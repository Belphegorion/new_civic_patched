import axios from 'axios';

const apiService = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  // Do not set a default Content-Type here; axios will set it per-request.
  timeout: 30000,
  withCredentials: true,
});

// Request interceptor for auth headers, request-id etc.
apiService.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  // Add request metadata
  try {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      config.headers['X-Request-ID'] = crypto.randomUUID();
    }
  } catch (e) {}
  config.headers['X-Timestamp'] = Date.now().toString();
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Response interceptor: attach rawText when server returns non-JSON or when axios can't parse
apiService.interceptors.response.use(async (response) => {
  const ct = response.headers['content-type'] || '';
  if (!ct.includes('application/json')) {
    // save raw response for debugging
    response.rawText = response.data;
  }
  return response;
}, (error) => {
  if (error && error.response && typeof error.response.data === 'string') {
    error.response.rawText = error.response.data;
  }
  return Promise.reject(error);
});

export default apiService;
