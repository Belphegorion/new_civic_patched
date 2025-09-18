// backend/config/departmentMapping.js
/**
 * Central mapping: category -> department name
 * Import this from services/workers/utils where needed.
 */
const categoryToDepartmentMap = {
  'Pothole': 'Public Works',
  'Streetlight Out': 'Utilities',
  'Trash Overflow': 'Sanitation',
  'Graffiti': 'Public Works',
  'Water Leak': 'Utilities',
  'Traffic Signal': 'Transportation',
  'Park Maintenance': 'Parks & Recreation',
  'Other': 'Unassigned'
};

module.exports = { categoryToDepartmentMap };
