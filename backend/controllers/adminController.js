const adminService = require('../services/adminService'); // Import the service

const getAnalytics = async (req, res, next) => {
    try {
        const analyticsData = await adminService.getAnalyticsData();
        res.status(200).json(analyticsData);
    } catch (error) {
        next(error);
    }
};

module.exports = { getAnalytics };