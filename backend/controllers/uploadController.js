// backend/controllers/uploadController.js
const asyncHandler = require('express-async-handler');
const Report = require('../models/reportModel');
const queue = require('../utils/queue'); // our in-memory queue
const { getPresignedPutUrl, getObjectUrl, headObject } = require('../services/minioService');

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'];
const MAX_BYTES = 5 * 1024 * 1024; // 5MB

// POST /api/uploads/presign
// body: { fileName, fileType, fileSize }
const presign = asyncHandler(async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ message: 'Not authenticated' });

    const { fileName, fileType, fileSize } = req.body || {};
    if (!fileName || !fileType) return res.status(400).json({ message: 'fileName and fileType required' });

    if (!ALLOWED_TYPES.includes(fileType)) {
      return res.status(400).json({ message: 'File type not allowed' });
    }
    if (fileSize && fileSize > MAX_BYTES) {
      return res.status(400).json({ message: `File size exceeds ${MAX_BYTES} bytes` });
    }

    // key naming — keep in same structure as your app expects
    const key = `reports/${Date.now()}-${fileName}`;

    const { uploadUrl } = await getPresignedPutUrl({ key });
    return res.json({ uploadUrl, key });
  } catch (err) {
    console.error('[uploadController.presign] error:', err && err.stack ? err.stack : err);
    return res.status(500).json({ message: 'Unable to generate presign URL' });
  }
});

// POST /api/uploads/confirm
// body: { key, description?, location?, audioKey? }
const confirmUpload = asyncHandler(async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ message: 'Not authenticated' });

    const { key, description, location, audioKey } = req.body || {};
    if (!key) return res.status(400).json({ message: 'Missing uploaded object key' });

    // Check if object exists in MinIO
    const exists = await headObject({ key }).catch(() => false);
    if (!exists) {
      return res.status(400).json({ message: 'Uploaded file not found in storage' });
    }

    // create report in DB
    const newReport = new Report({
      citizen: req.user._id,
      description: description || '',
      location: location || null,
      media: [{ key, url: null, type: 'image' }],
      audioKey: audioKey || null,
      status: 'Submitted',
    });

    // get presigned GET or public URL for serving to clients
    const objUrl = await getObjectUrl({ key });
    newReport.media = [{ key, url: objUrl.url, type: 'image', presigned: objUrl.presigned }];
    await newReport.save();

    // Optionally enqueue async job
    if (queue && typeof queue.add === 'function') {
      try {
        await queue.add(async () => {
          console.log('[queue] queued analysis for', newReport._id.toString());
          // call workers or message queue here if required
        });
      } catch (qErr) {
        console.warn('[uploadController.confirmUpload] queue add failed:', qErr && qErr.message ? qErr.message : qErr);
      }
    }

    return res.status(201).json({ message: 'Upload confirmed', report: newReport });
  } catch (err) {
    console.error('[uploadController.confirmUpload] error:', err && err.stack ? err.stack : err);
    return res.status(500).json({ message: 'Error confirming upload' });
  }
});

module.exports = { presign, confirmUpload };
