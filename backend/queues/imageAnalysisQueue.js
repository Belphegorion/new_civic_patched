// backend/queues/imageAnalysisQueue.js

const { Queue } = require('bullmq');

const imageAnalysisQueue = new Queue('image-analysis', {
    connection: {
        host: process.env.REDIS_HOST || 'redis',
        port: process.env.REDIS_PORT || 6379,
        password: process.env.REDIS_PASSWORD,
    },
});

module.exports = imageAnalysisQueue;