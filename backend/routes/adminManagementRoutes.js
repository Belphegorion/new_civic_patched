// backend/routes/adminManagementRoutes.js
const express = require('express');
const router = express.Router();
const { createAdminByAdmin } = require('../controllers/adminManagementController');
const { protect, admin } = require('../middleware/authMiddleware');

// Protected: only admins can create admins
router.post('/create', protect, admin, createAdminByAdmin);

module.exports = router;
