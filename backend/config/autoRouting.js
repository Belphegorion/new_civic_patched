// backend/utils/autoRouting.js
const Department = require('../models/departmentModel');
const { categoryToDepartmentMap } = require('../config/departmentMapping');

const routingRules = {
  'Pothole': { priority: 'Medium' },
  'Streetlight Out': { priority: 'High' },
  'Trash Overflow': { priority: 'Medium' },
  'Graffiti': { priority: 'Low' },
  'Water Leak': { priority: 'High' },
  'Traffic Signal': { priority: 'High' },
  'Park Maintenance': { priority: 'Low' },
  'Other': { priority: 'Low' }
};

const autoAssignReport = async (report) => {
  try {
    const rule = routingRules[report.category];
    if (!rule) return report;

    const departmentName = categoryToDepartmentMap[report.category] || 'Unassigned';
    const department = await Department.findOne({ name: departmentName });
    if (department) {
      report.assignedDepartment = department._id;
      report.priority = rule.priority;
    }

    return report;
  } catch (error) {
    console.error('Auto-routing error:', error);
    return report;
  }
};

module.exports = { autoAssignReport };
