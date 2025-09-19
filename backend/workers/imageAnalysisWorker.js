// queues/imageAnalysisWorker.js
const Queue = require('bull'); // bull v3
const axios = require('axios');
const { getObjectBuffer } = require('../services/s3Service');
const { analyzeImageBuffer } = require('../services/aiService');
const Report = require('../models/reportModel'); // adjust path if different
const streamToBuffer = require('../utils/streamToBuffer');
const { v2: cloudinary } = require('cloudinary');
const logger = require('../utils/logger');

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
const imageAnalysisQueue = new Queue('image-analysis', REDIS_URL);

// NOTE: your existing file imageAnalysisQueue import should reference this queue or vice-versa.
// If you already have a queue instance exported elsewhere, prefer that one.

imageAnalysisQueue.process('analyze-image', async (job, done) => {
  try {
    const { reportId, storage, url, publicId, key, bucket } = job.data;
    logger?.info?.('[imageAnalysis] job received', job.id, job.data);

    // Fetch buffer
    let buffer = null;
    if (storage === 's3') {
      const s3Bucket = bucket || process.env.S3_BUCKET;
      buffer = await getObjectBuffer(s3Bucket, key);
    } else if (storage === 'cloudinary') {
      if (!publicId) throw new Error('cloudinary publicId missing');
      // Use cloudinary API to download image bytes
      const remoteUrl = cloudinary.url(publicId, { secure: true, resource_type: 'image' });
      const resp = await axios.get(remoteUrl, { responseType: 'arraybuffer', timeout: 20000 });
      buffer = Buffer.from(resp.data);
    } else if (storage === 'public') {
      // a public URL
      const resp = await axios.get(url, { responseType: 'arraybuffer', timeout: 20000 });
      buffer = Buffer.from(resp.data);
    } else {
      throw new Error('Unknown storage type: ' + storage);
    }

    if (!buffer || buffer.length === 0) throw new Error('Image buffer empty');

    // Call aiService
    const aiResult = await analyzeImageBuffer(buffer);

    // Save AI result to report document
    const report = await Report.findById(reportId);
    if (!report) throw new Error('Report not found: ' + reportId);

    report.ml = report.ml || {};
    report.ml.analysis = aiResult;
    report.ml.analyzedAt = new Date();
    report.status = report.status || 'analyzed';

    await report.save();

    // Optionally emit via socket to the report's citizen (if socket infrastructure attached)
    // We expect a global io reference or you can publish to Redis channel etc.
    try {
      if (global.io && report.citizen) {
        global.io.to(report.citizen.toString()).emit('report_ml_ready', {
          reportId: report._id,
          ml: report.ml
        });
      }
    } catch (emitErr) {
      logger?.warn?.('Socket emit failed', emitErr.message);
    }

    done(null, { success: true, aiResult });
  } catch (err) {
    logger?.error?.('[imageAnalysis] job failed', err.message);
    // let Bull handle retries via job options (we set attempts in add)
    done(err);
  }
});

// Optional: export the queue instance if other modules need to add jobs to it
module.exports = imageAnalysisQueue;
