const express = require('express');
const router = express.Router();
const {
  getReportingTrends,
  getDepartmentMetrics,
  getSystemEffectiveness
} = require('../controllers/analyticsController');
const { protect, admin } = require('../middleware/authMiddleware');

router.get('/trends', protect, admin, getReportingTrends);
router.get('/departments', protect, admin, getDepartmentMetrics);
router.get('/effectiveness', protect, admin, getSystemEffectiveness);

module.exports = router;