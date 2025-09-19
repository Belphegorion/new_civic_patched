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

  if (!title || !description || !category) {
    throw new Error('Missing required fields for creating report (title/description/category).');
  }

  // AI analysis
  let aiResult = { tags: [], determinedCategory: category, severityScore: 0, damageAreaPercent: 0 };
  if (files.photo && files.photo.length > 0 && files.photo[0].buffer) {
    try {
      aiResult = await analyzeImage(files.photo[0].buffer);
    } catch (err) {
      console.warn('AI analysis failed (non-fatal):', err.message || err);
    }
  } else if (files.photo && files.photo.length > 0 && files.photo[0].url) {
    try {
      aiResult = await analyzeImage(files.photo[0].url);
    } catch (err) {
      console.warn('AI analysis from URL failed:', err.message || err);
    }
  }

  // Photo upload
  let photoUploadResult = null;
  if (files.photo && files.photo.length > 0 && files.photo[0].buffer) {
    try {
      photoUploadResult = await uploadFromBuffer(files.photo[0].buffer, {
        folder: 'civic-reports/photos',
        resource_type: 'image'
      });
    } catch (err) {
      console.warn('Photo upload failed:', err.message || err);
    }
  }

  // Audio upload
  let audioUploadResult = null;
  if (files.audio && files.audio.length > 0) {
    try {
      audioUploadResult = await uploadFromBuffer(files.audio[0].buffer, {
        folder: 'civic-reports/audio',
        resource_type: 'video'
      });
    } catch (err) {
      console.warn('Audio upload failed:', err.message || err);
    }
  }

  // Determine department
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
    aiTags: aiResult.tags || [],
    severityScore: aiResult.severityScore || 0,
    damageAreaPercent: aiResult.damageAreaPercent || 0,
  });

  return await newReport.save();
};

// NEW: fetch all reports
const getAllReports = async () => {
  return await Report.find().populate('assignedDepartment').populate('citizen');
};

// NEW: fetch report by ID
const getReportById = async (id) => {
  return await Report.findById(id).populate('assignedDepartment').populate('citizen');
};

// Export everything
module.exports = {
  createReport,
  getAllReports,
  getReportById,
};
