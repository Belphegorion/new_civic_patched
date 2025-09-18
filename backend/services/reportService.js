const Report = require('../models/reportModel');
const Department = require('../models/departmentModel');
const { uploadFromBuffer } = require('../config/cloudinary');

const categoryToDepartmentMap = {
    'Pothole': 'Public Works',
    'Streetlight Out': 'Public Works',
    'Trash Overflow': 'Sanitation',
    'Graffiti': 'Parks & Recreation',
    'Other': 'Unassigned',
};

const createReport = async (reportData) => {
    // 1. Handle File Uploads within the service
    const { title, description, category, citizen, location, files } = reportData;
    const photoFile = files.photo[0];

    const photoUploadResult = await uploadFromBuffer(photoFile.buffer, 'civic-reports/photos');
    let audioUploadResult;
    if (files.audio) {
        audioUploadResult = await uploadFromBuffer(files.audio[0].buffer, 'civic-reports/audio', 'video');
    }
    
    // 2. Assign Department
    const departmentName = categoryToDepartmentMap[category] || 'Unassigned';
    const department = await Department.findOneAndUpdate(
        { name: departmentName }, { $setOnInsert: { name: departmentName } }, { upsert: true, new: true }
    );

    // 3. Create and Save Report
    const newReport = new Report({
        title, description, category, citizen, location,
        assignedDepartment: department._id,
        photoUrl: photoUploadResult.secure_url,
        photoCloudinaryId: photoUploadResult.public_id,
        audioUrl: audioUploadResult ? audioUploadResult.secure_url : undefined,
        audioCloudinaryId: audioUploadResult ? audioUploadResult.public_id : undefined,
    });

    return await newReport.save();
};


/**
 * Retrieves a paginated list of reports from the database.
 * @param {object} query - The MongoDB query object.
 * @param {number} page - The current page number.
 * @param {number} pageSize - The number of items per page.
 * @returns {Promise<{reports: Array, count: number}>} The reports and total count.
 */
const getAllReports = async (query, page, pageSize) => {
    const count = await Report.countDocuments(query);
    const reports = await Report.find(query)
        .populate('assignedDepartment', 'name')
        .limit(pageSize)
        .skip(pageSize * (page - 1))
        .sort({ createdAt: -1 });
    
    return { reports, count };
};

/**
 * Retrieves a single report by its ID.
 * @param {string} reportId - The ID of the report.
 * @returns {Promise<object|null>} The report document or null if not found.
 */
const getReportById = async (reportId) => {
    return await Report.findById(reportId)
        .populate('citizen', 'email')
        .populate('assignedDepartment', 'name');
};

/**
 * Updates a report's status and/or department.
 * @param {string} reportId - The ID of the report to update.
 * @param {object} updateData - An object containing `status` and/or `assignedDepartment`.
 * @returns {Promise<object>} The fully populated, updated report document.
 */
const updateReportById = async (reportId, updateData) => {
    const report = await Report.findById(reportId);
    if (!report) {
        throw new Error('Report not found');
    }

    if (updateData.status) report.status = updateData.status;
    if (updateData.assignedDepartment) report.assignedDepartment = updateData.assignedDepartment;
    
    await report.save();

    // Re-populate for sending back in the response
    return await Report.findById(report._id)
        .populate('assignedDepartment', 'name')
        .populate('citizen', '_id');
};

/**
 * Deletes a report from the database by its ID.
 * @param {string} reportId - The ID of the report to delete.
 */
const deleteReportById = async (reportId) => {
    const report = await Report.findById(reportId);
    if (!report) {
        throw new Error('Report not found');
    }
    // Note: The controller is still responsible for deleting files from Cloudinary.
    await report.deleteOne();
    return report; // Return the deleted report in case we need its data (like cloudinary IDs)
};


module.exports = {
    createReport,
    getAllReports,
    getReportById,
    updateReportById,
    deleteReportById,
};