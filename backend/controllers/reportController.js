const { validationResult } = require('express-validator');
const reportService = require('../services/reportService');
const { deleteFromCloudinary } = require('../config/cloudinary');
const imageAnalysisQueue = require('../queues/imageAnalysisQueue');
const { autoAssignReport } = require('../utils/autoRouting');

const createReport = async (req, res, next) => {
    // Check for validation errors first.
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const { title, description, category, latitude, longitude } = req.body;
        // The service logic already handles uploads, so we just need to pass the file data.
        const reportData = {
            title, description, category,
            citizen: req.user._id,
            location: { coordinates: [parseFloat(longitude), parseFloat(latitude)] },
            files: req.files, // Pass the entire files object to the service.
        };

        let savedReport = await reportService.createReport(reportData);
        
        // Auto-assign to department
        savedReport = await autoAssignReport(savedReport);
        await savedReport.save();

        // Queue image analysis
        await imageAnalysisQueue.add('analyze-image', {
            reportId: savedReport._id,
            photoUrl: savedReport.photoUrl,
        });
        
        res.status(201).json(savedReport);

    } catch (error) {
        // Pass the error to our centralized error handler.
        next(error);
    }
};

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
                title: `Status Updated`, message: `Your report "${populatedReport.title}" is now: ${populatedReport.status}.`,
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
        
        const deletionPromises = [];
        if (report.photoCloudinaryId) deletionPromises.push(deleteFromCloudinary(report.photoCloudinaryId, 'image'));
        if (report.audioCloudinaryId) deletionPromises.push(deleteFromCloudinary(report.audioCloudinaryId, 'video'));
        await Promise.all(deletionPromises);
        
        res.status(200).json({ message: 'Report removed' });
    } catch (error) {
        if (error.message === 'Report not found') return res.status(404).json({ message: error.message });
        next(error);
    }
};

module.exports = { createReport, getReports, getReportById, updateReport, deleteReport };