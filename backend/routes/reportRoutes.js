const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const multer = require('multer');
const { createReport, getReports, getReportById, updateReport, deleteReport } = require('../controllers/reportController');
const { protect, admin } = require('../middleware/authMiddleware');

// Multer setup for in-memory storage
const storage = multer.memoryStorage();
const _multer = multer({
    storage: storage,
    limits: { fileSize: 25 * 1024 * 1024 } // 25MB limit
}).fields([
    { name: 'photo', maxCount: 1 },
    { name: 'audio', maxCount: 1 }
]);

// Multer error handling wrapper
const upload = (req, res, next) => {
    _multer(req, res, (err) => {
        if (err) {
            console.error('[MULTER ERROR]', err);
            if (err.code === 'LIMIT_FILE_SIZE') {
                return res.status(413).json({ success: false, message: 'File is too large. Maximum size is 25MB.' });
            }
            return res.status(400).json({ success: false, message: err.message || 'File upload error' });
        }
        next();
    });
};

// Validation chains
const createReportValidation = [
    body('title').notEmpty().withMessage('Title is required').trim().escape(),
    body('description').notEmpty().withMessage('Description is required').trim().escape(),
    body('category').notEmpty().withMessage('Category is required').trim().escape(),
    body('latitude').isFloat({ min: -90, max: 90 }).withMessage('A valid latitude is required'),
    body('longitude').isFloat({ min: -180, max: 180 }).withMessage('A valid longitude is required'),
];

const updateReportValidation = [
    body('status').optional().isIn(['Submitted', 'Acknowledged', 'In Progress', 'Resolved', 'Rejected']),
    body('assignedDepartment').optional().isMongoId().withMessage('Invalid department ID'),
];

// Consolidated and Corrected Routes
router.route('/')
    .post(protect, upload, createReportValidation, createReport)
    .get(protect, getReports);

router.route('/:id')
    .get(protect, getReportById)
    .patch(protect, admin, updateReportValidation, updateReport)
    .delete(protect, admin, deleteReport);

module.exports = router;