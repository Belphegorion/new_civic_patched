// backend/controllers/uploadController.js
const { getPresignedPutUrl, getObjectUrl, s3 } = require('../services/s3Service');
const { HeadObjectCommand } = require('@aws-sdk/client-s3');
const asyncHandler = require('express-async-handler');
const Report = require('../models/reportModel'); // adjust path to your Report model
const queue = require('../utils/queue'); // optional: job queue helper (BullMQ etc.)

// Allowed mime types and max size (mirror client/server)
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'];
const MAX_BYTES = 5 * 1024 * 1024; // 5MB

/**
 * POST /api/uploads/presign
 * Body: { fileName, fileType, fileSize }
 * Protected: user must be authenticated (req.user exists)
 */
const presign = asyncHandler(async (req, res) => {
  const { fileName, fileType, fileSize } = req.body;
  if (!fileName || !fileType || typeof fileSize !== 'number') {
    return res.status(400).json({ message: 'fileName, fileType and fileSize are required' });
  }

  if (!ALLOWED_TYPES.includes(fileType)) {
    return res.status(400).json({ message: 'File type not allowed' });
  }
  if (fileSize > MAX_BYTES) {
    return res.status(400).json({ message: `File too large. Max ${Math.round(MAX_BYTES/1024/1024)}MB` });
  }

  // Build key and get presigned URL
  const { uploadUrl, key, expiresIn } = await getPresignedPutUrl({
    userId: req.user ? req.user._id : 'anonymous',
    originalName: fileName,
    contentType: fileType,
    expiresIn: 300
  });

  // Provide the client with uploadUrl + key. Client will PUT to uploadUrl.
  return res.json({ uploadUrl, key, expiresIn, publicUrl: getObjectUrl(key) });
});

/**
 * POST /api/uploads/confirm
 * Body: { key, reportData } (reportData contains other metadata to create Report)
 * Protected: user must be authenticated
 *
 * Server validates that object exists in S3 and optionally checks size/content-type
 * Then creates report in DB and enqueues ML worker job.
 */
const confirmUpload = asyncHandler(async (req, res) => {
  const { key, reportData = {} } = req.body;
  if (!key) return res.status(400).json({ message: 'key is required' });

  // HEAD S3 object to ensure it exists
  try {
    const head = await s3.send(new HeadObjectCommand({ Bucket: process.env.S3_BUCKET, Key: key }));
    // head.ContentLength, head.ContentType
    if (!ALLOWED_TYPES.includes(head.ContentType)) {
      return res.status(400).json({ message: 'Uploaded file type not allowed' });
    }
    if (head.ContentLength > MAX_BYTES) {
      return res.status(400).json({ message: 'Uploaded file too large' });
    }
  } catch (err) {
    return res.status(400).json({ message: 'Uploaded file not found or access denied', error: err.message });
  }

  // Save report in DB (adapt to your schema)
  const newReport = await Report.create({
    title: reportData.title || 'Image report',
    description: reportData.description || '',
    image: {
      s3Key: key,
      url: `s3://${process.env.S3_BUCKET}/${key}`, // internal
    },
    createdBy: req.user._id,
    status: 'pending_ml'
  });

  // Enqueue ML job (optional)
  if (queue && typeof queue.add === 'function') {
    await queue.add('analyze', { reportId: newReport._id.toString(), s3Key: key });
  } else {
    // If no queue, you could call the model service directly (not recommended for heavy compute)
    // optionally emit a socket event
  }

  res.status(201).json({ message: 'Upload confirmed', report: newReport });
});

module.exports = { presign, confirmUpload };
