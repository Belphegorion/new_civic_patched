// backend/middleware/uploadMiddleware.js
const multer = require('multer');
const path = require('path');

const storage = multer.memoryStorage();

// Allowed mime types
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'];

const fileFilter = (req, file, cb) => {
  if (!ALLOWED_TYPES.includes(file.mimetype)) {
    return cb(new Error('Only images are allowed (jpeg, png, webp, avif)'), false);
  }
  // optionally check extension
  const ext = path.extname(file.originalname || '').toLowerCase();
  const allowedExts = ['.jpg', '.jpeg', '.png', '.webp', '.avif'];
  if (ext && !allowedExts.includes(ext)) {
    return cb(new Error('Invalid file extension'), false);
  }
  cb(null, true);
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5 MB
});

module.exports = upload;
