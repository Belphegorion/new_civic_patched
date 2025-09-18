const express = require('express');
const router = express.Router();
const { getAnalytics } = require('../controllers/adminController');
const { protect, admin } = require('../middleware/authMiddleware');

// This middleware line ensures ALL routes in this file are first protected (logged in)
// AND then checked for admin privileges.
router.use(protect, admin);

// GET /api/admin/analytics
router.get('/analytics', getAnalytics);

module.exports = router;