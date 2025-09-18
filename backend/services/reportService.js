// backend/services/reportService.js
const Report = require('../models/reportModel');
const Department = require('../models/departmentModel');
const { uploadFromBuffer } = require('../config/cloudinary'); // your helper
const { categoryToDepartmentMap } = require('../config/departmentMapping');
const { analyzeImage } = require('./aiService');

/**
 * reportData expected shape:
 * {
 *  title, description, category, citizen, location: { type:'Point', coordinates: [lng, lat] },
 *  files: { photo: [{ buffer, mimetype, originalname }], audio: [...] }
 * }
 */
const createReport = async (reportData) => {
  const { title, description, category, citizen, location, files = {} } = reportData;

  // Basic validation
  if (!title || !description || !category) {
    throw new Error('Missing required fields for creating report (title/description/category).');
  }

  // Analyze photo (if present) BEFORE upload if buffer available
  let aiResult = { tags: [], determinedCategory: category, severityScore: 0, damageAreaPercent: 0 };
  if (files.photo && files.photo.length > 0 && files.photo[0].buffer) {
    try {
      aiResult = await analyzeImage(files.photo[0].buffer);
    } catch (err) {
      console.warn('AI analysis failed (non-fatal):', err.message || err);
    }
  } else {
    // If no buffer but an external URL was provided (rare), try that:
    if (files.photo && files.photo.length > 0 && files.photo[0].url) {
      try {
        aiResult = await analyzeImage(files.photo[0].url);
      } catch (err) {
        console.warn('AI analysis from URL failed:', err.message || err);
      }
    }
  }

  // Upload photo if present (cloudinary)
  let photoUploadResult = null;
  if (files.photo && files.photo.length > 0 && files.photo[0].buffer) {
    const photoFile = files.photo[0];
    try {
      photoUploadResult = await uploadFromBuffer(photoFile.buffer, {
        folder: 'civic-reports/photos',
        resource_type: 'image'
      });
    } catch (err) {
      console.warn('Photo upload failed:', err.message || err);
      // continue — you may want to throw depending on your requirements
    }
  }

  // Upload audio if present
  let audioUploadResult = null;
  if (files.audio && files.audio.length > 0) {
    const audioFile = files.audio[0];
    try {
      audioUploadResult = await uploadFromBuffer(audioFile.buffer, {
        folder: 'civic-reports/audio',
        resource_type: 'video'
      });
    } catch (err) {
      console.warn('Audio upload failed:', err.message || err);
    }
  }

  // Determine department: prefer AI-determined category, otherwise mapping from submitted category
  const effectiveCategory = aiResult.determinedCategory || category;
  const departmentName = categoryToDepartmentMap[effectiveCategory] || 'Unassigned';
  const department = await Department.findOneAndUpdate(
    { name: departmentName },
    { $setOnInsert: { name: departmentName } },
    { upsert: true, new: true }
  );

  const newReport = new Report({
    title,
    description,
    category: effectiveCategory,
    citizen,
    location,
    assignedDepartment: department ? department._id : undefined,
    photoUrl: photoUploadResult ? photoUploadResult.secure_url : undefined,
    photoCloudinaryId: photoUploadResult ? photoUploadResult.public_id : undefined,
    audioUrl: audioUploadResult ? audioUploadResult.secure_url : undefined,
    audioCloudinaryId: audioUploadResult ? audioUploadResult.public_id : undefined,

    // AI fields:
    aiTags: aiResult.tags || [],
    severityScore: aiResult.severityScore || 0,         // 0..100
    damageAreaPercent: aiResult.damageAreaPercent || 0, // 0..1
  });

  return await newReport.save();
};

module.exports = {
  createReport,
  // other methods omitted for brevity - keep your existing ones
};
