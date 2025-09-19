// controllers/reportController.js
const { validationResult } = require('express-validator');
const reportService = require('../services/reportService');
const { deleteFromCloudinary } = require('../config/cloudinary');
const imageAnalysisQueue = require('../queues/imageAnalysisQueue');
const { autoAssignReport } = require('../utils/autoRouting');
const logger = require('../utils/logger'); // optional, your logger

/**
 * createReport
 *
 * Notes:
 * - Expects uploads to have been handled by middleware (multer/presign/other).
 * - reportService.createReport should return a saved mongoose document (with _id).
 * - We queue an image analysis job with a standard payload that the worker understands.
 */
const createReport = async (req, res, next) => {
  // 1) validation
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const { title, description, category, latitude, longitude } = req.body;

    // Build report data for service
    const reportData = {
      title,
      description,
      category,
      citizen: req.user._id,
      location: { type: 'Point', coordinates: [parseFloat(longitude), parseFloat(latitude)] },
      files: req.files // pass files to service; service decides storage & URL fields
    };

    // Save report (service should persist and return the saved doc)
    let savedReport = await reportService.createReport(reportData);

    // Auto-assign to department (may mutate and save)
    // autoAssignReport should return the savedReport (potentially updated)
    savedReport = await autoAssignReport(savedReport);
    // Ensure savedReport is persisted if modified in autoAssignReport
    if (typeof savedReport.save === 'function') {
      await savedReport.save();
    }

    // Enqueue image analysis if there is an image URL or file metadata
    // Normalize how we pass storage details so worker can fetch
    // Prefer: savedReport.photoUrl (public url) OR savedReport.files (info about uploaded files) OR savedReport.storageObject keys
    const analysisPayload = buildAnalysisPayloadForReport(savedReport);
    if (analysisPayload) {
      await imageAnalysisQueue.add('analyze-image', analysisPayload, {
        attempts: 3,
        backoff: { type: 'exponential', delay: 5000 }
      });
    } else {
      logger?.info?.('No image found to analyze for report ' + savedReport._id);
    }

    return res.status(201).json(savedReport);
  } catch (error) {
    next(error);
  }
};

/**
 * Build a normalized payload for the analysis queue from the saved report.
 * The worker expects:
 *  { reportId, storage: 'cloudinary'|'s3'|'public', url?, key?, bucket? }
 */
function buildAnalysisPayloadForReport(report) {
  if (!report) return null;

  // 1) If your service saved a direct public URL (photoUrl), use that
  if (report.photoUrl) {
    return { reportId: report._id.toString(), storage: 'public', url: report.photoUrl };
  }

  // 2) If your report contains cloudinary ids/urls
  if (report.photoCloudinaryId || (report.files && Array.isArray(report.files))) {
    // try explicit fields first
    if (report.photoCloudinaryId) {
      return { reportId: report._id.toString(), storage: 'cloudinary', publicId: report.photoCloudinaryId };
    }
    // fallback: examine files array for cloudinary detail
    if (report.files && Array.isArray(report.files)) {
      const img = report.files.find(f => (f.mimetype || '').startsWith('image/'));
      if (img) {
        // possible fields: img.cloudinaryPublicId, img.url, img.s3Key, img.s3Bucket
        if (img.cloudinaryPublicId) return { reportId: report._id.toString(), storage: 'cloudinary', publicId: img.cloudinaryPublicId };
        if (img.url) return { reportId: report._id.toString(), storage: 'public', url: img.url };
        if (img.s3Key) return { reportId: report._id.toString(), storage: 's3', key: img.s3Key, bucket: img.s3Bucket };
      }
    }
  }

  // 3) If your service saved S3 metadata directly on the report (s3Key / s3Bucket)
  if (report.s3Key) {
    return { reportId: report._id.toString(), storage: 's3', key: report.s3Key, bucket: report.s3Bucket || process.env.S3_BUCKET };
  }

  // No analyzable image found
  return null;
}

const getReports = async (req, res, next) => {
  try {
    const pageSize = parseInt(req.query.limit) || 20;
    const page = parseInt(req.query.page) || 1;
    const query = req.user.role === 'Admin' ? {} : { citizen: req.user._id };

    const { reports, count } = await reportService.getAllReports(query, page, pageSize);
    res.status(200).json({ reports, page, pages: Math.ceil(count / pageSize), total: count });
  } catch (error) { next(error); }
};

const getReportById = async (req, res, next) => {
  try {
    const report = await reportService.getReportById(req.params.id);
    if (!report) return res.status(404).json({ message: 'Report not found' });
    if (req.user.role === 'Citizen' && report.citizen._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    res.status(200).json(report);
  } catch (error) { next(error); }
};

const updateReport = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const populatedReport = await reportService.updateReportById(req.params.id, req.body);

    if (populatedReport.citizen) {
      req.io.to(populatedReport.citizen._id.toString()).emit('report_updated', {
        title: `Status Updated`,
        message: `Your report "${populatedReport.title}" is now: ${populatedReport.status}.`,
        report: populatedReport,
      });
    }
    res.status(200).json(populatedReport);
  } catch (error) {
    if (error.message === 'Report not found') return res.status(404).json({ message: error.message });
    next(error);
  }
};

const deleteReport = async (req, res, next) => {
  try {
    const report = await reportService.deleteReportById(req.params.id);

    // Delete files from storage (supports Cloudinary + S3)
    const deletionPromises = [];

    // Cloudinary cleanup
    if (report.photoCloudinaryId) deletionPromises.push(deleteFromCloudinary(report.photoCloudinaryId, 'image'));
    if (report.audioCloudinaryId) deletionPromises.push(deleteFromCloudinary(report.audioCloudinaryId, 'video'));

    // If S3 metadata exists, attempt deletion via s3Service
    const s3Service = require('../services/s3Service'); // lazy require
    if (report.s3Key) {
      deletionPromises.push(s3Service.deleteObject(report.s3Bucket || process.env.S3_BUCKET, report.s3Key).catch(err => {
        logger?.warn?.('S3 deletion failure', err.message);
      }));
    } else if (report.files && Array.isArray(report.files)) {
      for (const f of report.files) {
        if (f.s3Key) {
          deletionPromises.push(s3Service.deleteObject(f.s3Bucket || process.env.S3_BUCKET, f.s3Key).catch(err => {
            logger?.warn?.('S3 deletion failure for file', f, err.message);
          }));
        }
      }
    }

    await Promise.all(deletionPromises);

    res.status(200).json({ message: 'Report removed' });
  } catch (error) {
    if (error.message === 'Report not found') return res.status(404).json({ message: error.message });
    next(error);
  }
};

module.exports = { createReport, getReports, getReportById, updateReport, deleteReport };
