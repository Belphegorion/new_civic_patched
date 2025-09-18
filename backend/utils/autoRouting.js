const Department = require('../models/departmentModel');

const routingRules = {
  'Pothole': { department: 'Public Works', priority: 'Medium' },
  'Streetlight Out': { department: 'Utilities', priority: 'High' },
  'Trash Overflow': { department: 'Sanitation', priority: 'Medium' },
  'Graffiti': { department: 'Public Works', priority: 'Low' },
  'Water Leak': { department: 'Utilities', priority: 'High' },
  'Traffic Signal': { department: 'Transportation', priority: 'High' },
  'Park Maintenance': { department: 'Parks & Recreation', priority: 'Low' }
};

const autoAssignReport = async (report) => {
  try {
    const rule = routingRules[report.category];
    if (!rule) return report;

    const department = await Department.findOne({ name: rule.department });
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