import apiService from './apiService.js';

const getAllReports = async (filters) => {
  const response = await apiService.get('/reports', { params: filters });
  return response.data;
};

const getReportById = async (id) => {
  const response = await apiService.get(`/reports/${id}`);
  return response.data;
};

const createReport = async (formData) => {
  // Do NOT set Content-Type manually; let the browser/axios set the boundary for multipart/form-data
  const response = await apiService.post('/reports', formData);
  return response.data;
};

const updateReport = async (id, updateData) => {
  const response = await apiService.patch(`/reports/${id}`, updateData);
  return response.data;
};

export const reportsService = { getAllReports, getReportById, createReport, updateReport };
