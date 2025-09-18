// backend/routes/authAdminRoutes.js
const express = require('express');
const router = express.Router();
const { adminLogin } = require('../controllers/authAdminController');

// Public admin login (requires adminId)
router.post('/admin-login', adminLogin);

module.exports = router;
