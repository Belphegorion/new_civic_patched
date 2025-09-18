import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import { authService } from '../services/authService';
import ProtectedRoute from '../components/auth/ProtectedRoute';
import { vi, describe, test, expect, beforeEach } from 'vitest';

// Mock fetch
global.fetch = vi.fn();

// Mock localStorage with detailed logging
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: vi.fn((key) => {
      console.log(`localStorage.getItem('${key}'):`, store[key] || null);
      return store[key] || null;
    }),
    setItem: vi.fn((key, value) => {
      console.log(`localStorage.setItem('${key}', '${value}')`);
      store[key] = value;
    }),
    removeItem: vi.fn((key) => {
      console.log(`localStorage.removeItem('${key}')`);
      delete store[key];
    }),
    clear: vi.fn(() => {
      console.log('localStorage.clear()');
      store = {};
    }),
  };
})();
global.localStorage = localStorageMock;

// Mock jwtDecode
vi.mock('jwt-decode', () => ({
  jwtDecode: vi.fn((token) => {
    console.log('jwtDecode called with token:', token);
    if (token === 'valid-token') {
      return {
        id: '123',
        email: 'syedadnanmohd61@gmail.com',
        role: 'Admin',
        name: 'syedadnanmohd61@gmail.com',
        exp: Math.floor(Date.now() / 1000) + 3600 // 1 hour from now
      };
    }
    if (token === 'expired-token') {
      return {
        id: '123',
        email: 'syedadnanmohd61@gmail.com',
        role: 'Admin',
        name: 'syedadnanmohd61@gmail.com',
        exp: Math.floor(Date.now() / 1000) - 3600 // 1 hour ago
      };
    }
    throw new Error('Invalid token');
  })
}));

// Test components
const TestAuthComponent = () => {
  const { user, isAuthenticated, loading, login, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  return (
    <div>
      <div data-testid="loading">{loading ? 'loading' : 'not-loading'}</div>
      <div data-testid="authenticated">{isAuthenticated ? 'authenticated' : 'not-authenticated'}</div>
      <div data-testid="user">{user ? JSON.stringify(user) : 'no-user'}</div>
      <div data-testid="location">{location.pathname}</div>
      <button 
        data-testid="login-btn" 
        onClick={async () => {
          try {
            const result = await login({ email: 'syedadnanmohd61@gmail.com', password: '987654321Adnan!' });
            console.log('Login result:', result);
            if (result.user.role === 'Admin') {
              navigate('/admin');
            } else {
              navigate('/dashboard');
            }
          } catch (error) {
            console.error('Login failed:', error);
          }
        }}
      >
        Login
      </button>
      <button data-testid="logout-btn" onClick={logout}>Logout</button>
    </div>
  );
};

const AdminDashboard = () => <div data-testid="admin-dashboard">Admin Dashboard</div>;
const CitizenDashboard = () => <div data-testid="citizen-dashboard">Citizen Dashboard</div>;
const LoginPage = () => <div data-testid="login-page">Login Page</div>;

const TestApp = () => (
  <BrowserRouter>
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/test" element={<TestAuthComponent />} />
        <Route 
          path="/admin" 
          element={
            <ProtectedRoute allowedRoles={['Admin']}>
              <AdminDashboard />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute>
              <CitizenDashboard />
            </ProtectedRoute>
          } 
        />
        <Route path="/" element={<div data-testid="home">Home</div>} />
      </Routes>
    </AuthProvider>
  </BrowserRouter>
);

describe('Complete Frontend Authentication & Routing Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.clear();
    fetch.mockClear();
  });

  test('1. Initial state - no authentication', async () => {
    console.log('\n=== TEST 1: INITIAL STATE ===');
    
    render(<TestApp />);
    
    // Navigate to test component
    window.history.pushState({}, '', '/test');
    
    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('not-loading');
    });

    expect(screen.getByTestId('authenticated')).toHaveTextContent('not-authenticated');
    expect(screen.getByTestId('user')).toHaveTextContent('no-user');
    
    console.log('✅ Initial state correct - not authenticated');
  });

  test('2. Token storage and retrieval', async () => {
    console.log('\n=== TEST 2: TOKEN STORAGE & RETRIEVAL ===');
    
    // Pre-populate localStorage
    localStorageMock.setItem('token', 'valid-token');
    localStorageMock.setItem('user', JSON.stringify({
      id: '123',
      email: 'syedadnanmohd61@gmail.com',
      role: 'Admin'
    }));

    render(<TestApp />);
    window.history.pushState({}, '', '/test');

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('not-loading');
    });

    expect(screen.getByTestId('authenticated')).toHaveTextContent('authenticated');
    expect(screen.getByTestId('user')).toHaveTextContent(JSON.stringify({
      id: '123',
      email: 'syedadnanmohd61@gmail.com',
      role: 'Admin'
    }));
    
    console.log('✅ Token storage and retrieval working');
  });

  test('3. Login flow with token generation', async () => {
    console.log('\n=== TEST 3: LOGIN FLOW & TOKEN GENERATION ===');
    
    const mockResponse = {
      user: { id: '123', email: 'syedadnanmohd61@gmail.com', role: 'Admin' },
      accessToken: 'valid-token'
    };

    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    render(<TestApp />);
    window.history.pushState({}, '', '/test');

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('not-loading');
    });

    // Perform login
    fireEvent.click(screen.getByTestId('login-btn'));

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'syedadnanmohd61@gmail.com',
          password: '987654321Adnan!'
        })
      });
    });

    // Check if user is authenticated
    await waitFor(() => {
      expect(screen.getByTestId('authenticated')).toHaveTextContent('authenticated');
    });

    // Verify localStorage calls
    expect(localStorageMock.setItem).toHaveBeenCalledWith('token', 'valid-token');
    expect(localStorageMock.setItem).toHaveBeenCalledWith('user', JSON.stringify(mockResponse.user));
    
    console.log('✅ Login flow and token generation working');
  });

  test('4. Protected route access with valid token', async () => {
    console.log('\n=== TEST 4: PROTECTED ROUTE ACCESS ===');
    
    // Set up authenticated state
    localStorageMock.setItem('token', 'valid-token');
    localStorageMock.setItem('user', JSON.stringify({
      id: '123',
      email: 'syedadnanmohd61@gmail.com',
      role: 'Admin'
    }));

    render(<TestApp />);
    
    // Try to access admin route
    window.history.pushState({}, '', '/admin');

    await waitFor(() => {
      expect(screen.getByTestId('admin-dashboard')).toBeInTheDocument();
    });
    
    console.log('✅ Protected route accessible with valid token');
  });

  test('5. Protected route redirect without token', async () => {
    console.log('\n=== TEST 5: PROTECTED ROUTE REDIRECT ===');
    
    render(<TestApp />);
    
    // Try to access admin route without authentication
    window.history.pushState({}, '', '/admin');

    await waitFor(() => {
      expect(screen.getByTestId('login-page')).toBeInTheDocument();
    });
    
    console.log('✅ Protected route redirects to login when not authenticated');
  });

  test('6. Role-based access control', async () => {
    console.log('\n=== TEST 6: ROLE-BASED ACCESS CONTROL ===');
    
    // Set up citizen user
    localStorageMock.setItem('token', 'valid-token');
    localStorageMock.setItem('user', JSON.stringify({
      id: '456',
      email: 'citizen@example.com',
      role: 'Citizen'
    }));

    // Mock jwtDecode for citizen
    const { jwtDecode } = require('jwt-decode');
    jwtDecode.mockReturnValueOnce({
      id: '456',
      email: 'citizen@example.com',
      role: 'Citizen',
      name: 'citizen@example.com',
      exp: Math.floor(Date.now() / 1000) + 3600
    });

    render(<TestApp />);
    
    // Try to access admin route as citizen
    window.history.pushState({}, '', '/admin');

    await waitFor(() => {
      expect(screen.getByTestId('home')).toBeInTheDocument();
    });
    
    console.log('✅ Role-based access control working');
  });

  test('7. Token expiration handling', async () => {
    console.log('\n=== TEST 7: TOKEN EXPIRATION HANDLING ===');
    
    // Set up expired token
    localStorageMock.setItem('token', 'expired-token');
    localStorageMock.setItem('user', JSON.stringify({
      id: '123',
      email: 'syedadnanmohd61@gmail.com',
      role: 'Admin'
    }));

    render(<TestApp />);
    window.history.pushState({}, '', '/test');

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('not-loading');
    });

    // Should be logged out due to expired token
    expect(screen.getByTestId('authenticated')).toHaveTextContent('not-authenticated');
    expect(localStorageMock.removeItem).toHaveBeenCalledWith('token');
    expect(localStorageMock.removeItem).toHaveBeenCalledWith('user');
    
    console.log('✅ Token expiration handled correctly');
  });

  test('8. Logout functionality', async () => {
    console.log('\n=== TEST 8: LOGOUT FUNCTIONALITY ===');
    
    // Set up authenticated state
    localStorageMock.setItem('token', 'valid-token');
    localStorageMock.setItem('user', JSON.stringify({
      id: '123',
      email: 'syedadnanmohd61@gmail.com',
      role: 'Admin'
    }));

    render(<TestApp />);
    window.history.pushState({}, '', '/test');

    await waitFor(() => {
      expect(screen.getByTestId('authenticated')).toHaveTextContent('authenticated');
    });

    // Perform logout
    fireEvent.click(screen.getByTestId('logout-btn'));

    await waitFor(() => {
      expect(screen.getByTestId('authenticated')).toHaveTextContent('not-authenticated');
    });

    expect(localStorageMock.removeItem).toHaveBeenCalledWith('token');
    expect(localStorageMock.removeItem).toHaveBeenCalledWith('user');
    
    console.log('✅ Logout functionality working');
  });

  test('9. Navigation after successful login', async () => {
    console.log('\n=== TEST 9: NAVIGATION AFTER LOGIN ===');
    
    const mockResponse = {
      user: { id: '123', email: 'syedadnanmohd61@gmail.com', role: 'Admin' },
      accessToken: 'valid-token'
    };

    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    render(<TestApp />);
    window.history.pushState({}, '', '/test');

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('not-loading');
    });

    // Perform login
    fireEvent.click(screen.getByTestId('login-btn'));

    await waitFor(() => {
      expect(screen.getByTestId('location')).toHaveTextContent('/admin');
    });
    
    console.log('✅ Navigation after login working');
  });

  test('10. AuthService integration', async () => {
    console.log('\n=== TEST 10: AUTHSERVICE INTEGRATION ===');
    
    // Test authService methods directly
    const mockResponse = {
      user: { id: '123', email: 'syedadnanmohd61@gmail.com', role: 'Admin' },
      accessToken: 'test-token'
    };

    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    const result = await authService.login({
      email: 'syedadnanmohd61@gmail.com',
      password: '987654321Adnan!'
    });

    expect(result.user).toEqual(mockResponse.user);
    expect(result.accessToken).toBe('test-token');
    expect(localStorageMock.setItem).toHaveBeenCalledWith('token', 'test-token');
    
    // Test token retrieval
    const token = authService.getAccessToken();
    expect(token).toBe('test-token');
    
    console.log('✅ AuthService integration working');
  });

  test('11. Complete authentication flow simulation', async () => {
    console.log('\n=== TEST 11: COMPLETE FLOW SIMULATION ===');
    
    const mockResponse = {
      user: { id: '123', email: 'syedadnanmohd61@gmail.com', role: 'Admin' },
      accessToken: 'complete-flow-token'
    };

    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    // Start with login page
    render(<TestApp />);
    window.history.pushState({}, '', '/login');

    expect(screen.getByTestId('login-page')).toBeInTheDocument();

    // Navigate to test component and login
    window.history.pushState({}, '', '/test');

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('not-loading');
    });

    // Perform login
    fireEvent.click(screen.getByTestId('login-btn'));

    // Wait for authentication
    await waitFor(() => {
      expect(screen.getByTestId('authenticated')).toHaveTextContent('authenticated');
    });

    // Navigate to admin dashboard
    expect(screen.getByTestId('location')).toHaveTextContent('/admin');

    // Verify complete flow
    expect(localStorageMock.setItem).toHaveBeenCalledWith('token', 'complete-flow-token');
    expect(localStorageMock.setItem).toHaveBeenCalledWith('user', JSON.stringify(mockResponse.user));
    
    console.log('✅ Complete authentication flow working');
  });
});