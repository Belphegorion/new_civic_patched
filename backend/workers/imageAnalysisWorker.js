const { Worker } = require('bullmq');
const Report = require('../models/reportModel');
const Department = require('../models/departmentModel');
const { analyzeImage } = require('../services/aiService');
const connectDB = require('../config/db');
const logger = require('../utils/logger');
require('dotenv').config();

const categoryToDepartmentMap = {
    'Pothole': 'Public Works',
    'Streetlight Out': 'Utilities',
    'Trash Overflow': 'Sanitation',
    'Graffiti': 'Public Works',
    'Water Leak': 'Utilities',
    'Traffic Signal': 'Transportation',
    'Park Maintenance': 'Parks & Recreation',
};

const processJob = async (job) => {
    const { reportId, photoUrl } = job.data;
    logger.info(`[Worker] Starting job for report ID: ${reportId}`);
    try {
        const { tags, determinedCategory } = await analyzeImage(photoUrl);
        const report = await Report.findById(reportId);
        if (!report) throw new Error(`Report ${reportId} not found.`);

        report.aiTags = tags;
        if (determinedCategory && report.category !== determinedCategory) {
            logger.info(`[Worker] AI re-categorized report ${reportId} from "${report.category}" to "${determinedCategory}"`);
            report.category = determinedCategory;
            const departmentName = categoryToDepartmentMap[determinedCategory];
            if (departmentName) {
                const department = await Department.findOne({ name: departmentName });
                if (department) {
                    report.assignedDepartment = department._id;
                }
            }
        }
        await report.save();
        logger.info(`[Worker] Successfully processed and updated report ID: ${reportId}`);
    } catch (error) {
        logger.error(`[Worker] Job for report ID ${reportId} failed:`, { message: error.message, stack: error.stack });
        throw error;
    }
};

const startWorker = async () => {
    try {
        await connectDB();
        const connection = {
            host: process.env.REDIS_HOST || 'redis',
            port: parseInt(process.env.REDIS_PORT) || 6379,
            password: process.env.REDIS_PASSWORD || undefined,
        };

        new Worker('image-analysis', processJob, {
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

startWorker();