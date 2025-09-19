// backend/routes/uploadRoutes.js
const express = require('express');
const router = express.Router();
const { presign, confirmUpload } = require('../controllers/uploadControllerbackup');
const { protect } = require('../middleware/authMiddleware');

// Request presigned URL
router.post('/presign', protect, presign);

// Confirm after client uploaded to S3
router.post('/confirm', protect, confirmUpload);

module.exports = router;
