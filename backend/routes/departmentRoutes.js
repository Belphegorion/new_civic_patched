// backend/routes/departmentRoutes.js

const express = require('express');
const router = express.Router();
const { getDepartments, createDepartment } = require('../controllers/departmentController');
const { protect, admin } = require('../middleware/authMiddleware');

// This applies the security middleware to all routes in this file
router.use(protect, admin);

// Route for getting all departments and creating a new one
router.route('/')
    .get(getDepartments)
    .post(createDepartment);

module.exports = router;