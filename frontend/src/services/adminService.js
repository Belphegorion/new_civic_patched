import apiService from './apiService.js';

const getDepartments = async () => {
  return Promise.resolve([
      { _id: 'dept_1', name: 'Public Works' },
      { _id: 'dept_2', name: 'Sanitation' },
      { _id: 'dept_3', name: 'Parks & Recreation' },
      { _id: 'dept_4', name: 'Unassigned' },
  ]);
};

export const adminService = { getDepartments };