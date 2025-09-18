// backend/routes/reportRoutes.js
const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const multer = require('multer');
const { createReport, getReports, getReportById, updateReport, deleteReport } = require('../controllers/reportController');
const { protect, admin } = require('../middleware/authMiddleware');

// Multer in-memory + fileFilter
const storage = multer.memoryStorage();
const allowedImageMimes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
const allowedAudioMimes = ['audio/mpeg', 'audio/wav', 'audio/x-wav', 'audio/ogg', 'audio/mp3'];

const fileFilter = (req, file, cb) => {
  if (file.fieldname === 'photo') {
    return allowedImageMimes.includes(file.mimetype) ? cb(null, true) : cb(new Error('Invalid photo type'));
  }
  if (file.fieldname === 'audio') {
    return allowedAudioMimes.includes(file.mimetype) ? cb(null, true) : cb(new Error('Invalid audio type'));
  }
  return cb(new Error('Unexpected file field'));
};

const _multer = multer({
  storage,
  limits: { fileSize: 25 * 1024 * 1024 },
  fileFilter
}).fields([
  { name: 'photo', maxCount: 1 },
  { name: 'audio', maxCount: 1 }
]);

// wrapper to capture multer errors
const upload = (req, res, next) => {
  _multer(req, res, (err) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(413).json({ success: false, message: 'File too large (max 25MB)' });
      }
      return res.status(400).json({ success: false, message: err.message || 'File upload error' });
    }
    next();
  });
};

// Validations (example)
const createReportValidation = [
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('description').trim().notEmpty().withMessage('Description is required'),
  body('category').trim().notEmpty().withMessage('Category is required'),
  body('latitude').optional().isFloat({ min: -90, max: 90 }),
  body('longitude').optional().isFloat({ min: -180, max: 180 }),
];

const updateReportValidation = [
  body('status').optional().isIn(['Submitted', 'Acknowledged', 'In Progress', 'Resolved', 'Rejected']),
  body('assignedDepartment').optional().isMongoId().withMessage('Invalid department ID'),
];

router.route('/')
  .post(protect, upload, createReportValidation, createReport)
  .get(protect, getReports);

router.route('/:id')
  .get(protect, getReportById)
  .patch(protect, admin, updateReportValidation, updateReport)
  .delete(protect, admin, deleteReport);

module.exports = router;
