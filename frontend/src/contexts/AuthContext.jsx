import React, { createContext, useState, useEffect, useContext } from 'react';
import { jwtDecode } from 'jwt-decode';
import { authService } from '../services/authService.js';

const AuthContext = createContext();

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Initialize auth state on app start
  useEffect(() => {
    const initializeAuth = () => {
      try {
        const token = localStorage.getItem('token');
        const storedUser = localStorage.getItem('user');
        
        console.log('Initializing auth, token found:', !!token);
        console.log('Stored user found:', !!storedUser);
        
        if (token && storedUser) {
          try {
            // Parse stored user data
            const userData = JSON.parse(storedUser);
            console.log('Setting user from localStorage:', userData);
            setUser(userData);
            
            // Initialize API service with token
            authService.initializeAuth();
          } catch (parseError) {
            console.error('Error parsing stored user data:', parseError);
            localStorage.removeItem('token');
            localStorage.removeItem('user');
          }
        } else {
          console.log('No token or user found');
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      } finally {
        setLoading(false);
      }
    };

    // Initialize immediately
    initializeAuth();
  }, []);

  const login = async (credentials) => {
    try {
      console.log('AuthContext login - attempting login with:', credentials.email);
      const { user, accessToken } = await authService.login(credentials);
      console.log('AuthContext login - received user:', user);
      console.log('AuthContext login - received token:', accessToken);
      
      // Store user data in localStorage
      localStorage.setItem('token', accessToken);
      localStorage.setItem('user', JSON.stringify(user));
      
      // Set user state
      setUser(user);
      console.log('AuthContext login - user state set:', user);
      
      // Verify storage
      console.log('Token stored:', !!localStorage.getItem('token'));
      console.log('User stored:', !!localStorage.getItem('user'));
      
      return { user, accessToken };
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const register = async (userData) => {
    try {
      const { user, accessToken } = await authService.register(userData);
      setUser(user);
      return { user, accessToken };
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setUser(null);
    }
  };

  const refreshAuth = async () => {
    try {
      const token = authService.getAccessToken();
      if (token) {
        const decoded = jwtDecode(token);
        if (decoded.exp * 1000 > Date.now()) {
          setUser({ 
            id: decoded.id, 
            role: decoded.role, 
            email: decoded.email,
            name: decoded.name || decoded.email
          });
          return true;
        }
      }
      return false;
    } catch (error) {
      console.error('Auth refresh error:', error);
      authService.clearAuthToken();
      setUser(null);
      return false;
    }
  };

  const loginWithGoogle = async () => {
    try {
      // This would integrate with Google OAuth
      // For now, we'll show a placeholder
      throw new Error('Google OAuth integration coming soon!');
    } catch (error) {
      console.error('Google login error:', error);
      throw error;
    }
  };

  const value = { 
    user, 
    isAuthenticated: !!user, 
    loading, 
    login, 
    logout, 
    register,
    refreshAuth,
    loginWithGoogle
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};