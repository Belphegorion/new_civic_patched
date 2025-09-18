const Report = require('../models/reportModel');
const User = require('../models/userModel');
const Department = require('../models/departmentModel');

/**
 * Generates aggregated report data for analytics charts.
 * @returns {Promise<object>} Formatted analytics data.
 */
const getAnalyticsData = async () => {
    const analyticsData = await Report.aggregate([
        {
            $facet: {
                reportsByStatus: [
                    { $group: { _id: "$status", count: { $sum: 1 } } },
                ],
                reportsByCategory: [
                    { $group: { _id: "$category", count: { $sum: 1 } } },
                ]
            }
        }
    ]);

    return {
        byStatus: analyticsData[0].reportsByStatus.reduce((acc, item) => ({...acc, [item._id]: item.count}), {}),
        byCategory: analyticsData[0].reportsByCategory.reduce((acc, item) => ({...acc, [item._id]: item.count}), {}),
    };
};

/**
 * Retrieves a list of all departments.
 * @returns {Promise<Array>} A list of department documents.
 */
const getDepartments = async () => {
    return await Department.find({}).sort({ name: 1 });
};

/**
 * Retrieves a list of all users, excluding their passwords.
 * @returns {Promise<Array>} A list of user documents.
 */
const getUsers = async () => {
    return await User.find({}).select('-password');
};


module.exports = {
    getAnalyticsData,
    getDepartments,
    getUsers,
};