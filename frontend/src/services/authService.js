import apiService from './apiService';

/**
 * Authentication service for handling user login, registration, and logout
 */

/**
 * Validates email format
 * @param {string} email - Email to validate
 * @returns {boolean} - True if valid email format
 */
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validates password strength
 * @param {string} password - Password to validate
 * @returns {boolean} - True if password meets minimum requirements
 */
const isValidPassword = (password) => {
  return password && password.length >= 8 && /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password);
};

/**
 * Stores authentication token securely
 * @param {string} token - JWT access token
 */
const setAuthToken = (token) => {
  if (token) {
    // Store in localStorage for persistence
    localStorage.setItem('token', token);
    apiService.defaults.headers.Authorization = `Bearer ${token}`;
  }
};

/**
 * Removes authentication token and clears API client configuration
 */
const clearAuthToken = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('refreshToken');
  delete apiService.defaults.headers.Authorization;
};

/**
 * Authenticates user with email and password
 * @param {Object} credentials - User credentials
 * @param {string} credentials.email - User email
 * @param {string} credentials.password - User password
 * @param {AbortSignal} [signal] - Optional abort signal for request cancellation
 * @returns {Promise<Object>} - Authentication response with user data and token
 * @throws {Error} - Validation or authentication error
 */
const login = async (credentials, signal) => {
  try {
    // Input validation
    if (!credentials || typeof credentials !== 'object') {
      throw new Error('Credentials are required');
    }
    
    const { email, password } = credentials;
    
    if (!email || !isValidEmail(email)) {
      throw new Error('Valid email is required');
    }
    
    if (!password) {
      throw new Error('Password is required');
    }

    const response = await apiService.post('/auth/login', credentials, { signal });
    const { user, accessToken, refreshToken } = response.data;
    
    // Store tokens and configure API client
    setAuthToken(accessToken);
    if (refreshToken) {
      localStorage.setItem('refreshToken', refreshToken);
    }
    
    return {
      user,
      accessToken,
      refreshToken
    };
  } catch (error) {
    // Normalize error response
    if (error.response?.data?.message) {
      throw new Error(error.response.data.message);
    } else if (error.message) {
      throw error;
    } else {
      throw new Error('Login failed. Please try again.');
    }
  }
};

/**
 * Registers a new user account
 * @param {Object} userData - User registration data
 * @param {string} userData.email - User email
 * @param {string} userData.password - User password
 * @param {string} [userData.name] - User full name
 * @param {AbortSignal} [signal] - Optional abort signal for request cancellation
 * @returns {Promise<Object>} - Registration response with user data and token
 * @throws {Error} - Validation or registration error
 */
const register = async (userData, signal) => {
  try {
    // Input validation
    if (!userData || typeof userData !== 'object') {
      throw new Error('User data is required');
    }
    
    const { email, password } = userData;
    
    if (!email || !isValidEmail(email)) {
      throw new Error('Valid email is required');
    }
    
    if (!password || !isValidPassword(password)) {
      throw new Error('Password must be at least 8 characters with uppercase, lowercase, and number');
    }

    const response = await apiService.post('/auth/register', userData, { signal });
    const { user, accessToken, refreshToken } = response.data;
    
    // Store tokens and configure API client
    setAuthToken(accessToken);
    if (refreshToken) {
      localStorage.setItem('refreshToken', refreshToken);
    }
    
    return {
      user,
      accessToken,
      refreshToken
    };
  } catch (error) {
    // Normalize error response
    if (error.response?.data?.message) {
      throw new Error(error.response.data.message);
    } else if (error.message) {
      throw error;
    } else {
      throw new Error('Registration failed. Please try again.');
    }
  }
};

/**
 * Logs out the current user and clears authentication state
 * @param {AbortSignal} [signal] - Optional abort signal for request cancellation
 * @returns {Promise<void>}
 */
const logout = async (signal) => {
  try {
    // Attempt to call backend logout endpoint if available
    const token = localStorage.getItem('token');
    if (token) {
      try {
        await apiService.post('/auth/logout', {}, { signal });
      } catch (error) {
        // Continue with local logout even if backend call fails
        console.warn('Backend logout failed, continuing with local logout:', error.message);
      }
    }
  } catch (error) {
    // Don't throw on logout errors, just warn
    console.warn('Logout error:', error.message);
  } finally {
    // Always clear local authentication state
    clearAuthToken();
  }
};

/**
 * Initializes authentication state from stored tokens
 * @returns {string|null} - Stored access token or null
 */
const initializeAuth = () => {
  const token = localStorage.getItem('token');
  if (token) {
    apiService.defaults.headers.Authorization = `Bearer ${token}`;
  }
  return token;
};

/**
 * Gets the current access token
 * @returns {string|null} - Current access token or null
 */
const getAccessToken = () => {
  return localStorage.getItem('token');
};

export const authService = {
  login,
  register,
  logout,
  initializeAuth,
  getAccessToken,
  clearAuthToken
};