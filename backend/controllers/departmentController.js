// backend/controllers/departmentController.js

const Department = require('../models/departmentModel');

/**
 * @desc    Get all departments
 * @route   GET /api/departments
 * @access  Private/Admin
 */
const getDepartments = async (req, res, next) => {
    try {
        const departments = await Department.find({}).sort({ name: 1 });
        res.status(200).json(departments);
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Create a new department
 * @route   POST /api/departments
 * @access  Private/Admin
 */
const createDepartment = async (req, res, next) => {
    try {
        const { name } = req.body;
        if (!name) {
            return res.status(400).json({ message: 'Department name is required' });
        }
        const departmentExists = await Department.findOne({ name });
        if (departmentExists) {
            return res.status(400).json({ message: 'Department already exists' });
        }
        const department = await Department.create({ name });
        res.status(201).json(department);
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getDepartments,
    createDepartment,
};