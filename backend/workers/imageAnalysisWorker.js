// backend/workers/imageAnalysisWorker.js
const { Worker } = require('bullmq');
const Report = require('../models/reportModel');
const Department = require('../models/departmentModel');
const { analyzeImage } = require('../services/aiService');
const connectDB = require('../config/db');
const logger = require('../utils/logger');
const { categoryToDepartmentMap } = require('../config/departmentMapping');
require('dotenv').config();

const processJob = async (job) => {
  const { reportId, photoUrl } = job.data;
  logger.info(`[Worker] Starting job for report ID: ${reportId}`);
  try {
    const { tags, determinedCategory } = await analyzeImage(photoUrl);
    const report = await Report.findById(reportId);
    if (!report) throw new Error(`Report ${reportId} not found.`);

    report.aiTags = tags || [];

    if (determinedCategory && report.category !== determinedCategory) {
      logger.info(`[Worker] AI re-categorized report ${reportId} from "${report.category}" to "${determinedCategory}"`);
      report.category = determinedCategory;
      const departmentName = categoryToDepartmentMap[determinedCategory];
      if (departmentName) {
        const department = await Department.findOne({ name: departmentName });
        if (department) report.assignedDepartment = department._id;
      }
    }
    await report.save();
    logger.info(`[Worker] Successfully processed and updated report ID: ${reportId}`);
  } catch (error) {
    logger.error(`[Worker] Job for report ID ${reportId} failed: ${error.message}`, { stack: error.stack });
    throw error;
  }
};

const startWorker = async () => {
  await connectDB();
  try {
    const connection = {
      host: process.env.REDIS_HOST || '127.0.0.1',
      port: process.env.REDIS_PORT || 6379
    };

    new Worker('image-analysis', async (job) => processJob(job), {
      connection,
      concurrency: 5,
      removeOnComplete: { count: 1000 },
      removeOnFail: { count: 5000 },
    });
    logger.info('[Worker] Image analysis worker is running and connected to Redis.');
  } catch (err) {
    logger.error('[Worker] Failed to start worker:', err);
    process.exit(1);
  }
};

startWorker().catch((err) => {
  logger.error('[Worker] startup error: ', err);
  process.exit(1);
});
