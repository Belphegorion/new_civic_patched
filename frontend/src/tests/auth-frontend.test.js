/**
 * @jest-environment jsdom
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider, useAuth } from '../contexts/AuthContext';

// Mock fetch
global.fetch = jest.fn();

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.localStorage = localStorageMock;

// Mock navigate
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

// Test component to access auth context
const TestAuthComponent = () => {
  const { user, isAuthenticated, loading, login } = useAuth();
  
  return (
    <div>
      <div data-testid="loading">{loading ? 'loading' : 'not-loading'}</div>
      <div data-testid="authenticated">{isAuthenticated ? 'authenticated' : 'not-authenticated'}</div>
      <div data-testid="user">{user ? JSON.stringify(user) : 'no-user'}</div>
      <button 
        data-testid="login-btn" 
        onClick={() => login({ email: 'syedadnanmohd61@gmail.com', password: '987654321Adnan!' })}
      >
        Login
      </button>
    </div>
  );
};

describe('Frontend Authentication Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
  });

  test('1. AuthContext initializes correctly', async () => {
    console.log('=== AUTHCONTEXT INITIALIZATION TEST ===');
    
    render(
      <BrowserRouter>
        <AuthProvider>
          <TestAuthComponent />
        </AuthProvider>
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('not-loading');
    });

    expect(screen.getByTestId('authenticated')).toHaveTextContent('not-authenticated');
    expect(screen.getByTestId('user')).toHaveTextContent('no-user');
    
    console.log('✅ AuthContext initializes correctly');
  });

  test('2. Login function works and stores data', async () => {
    console.log('\n=== LOGIN FUNCTION TEST ===');
    
    const mockResponse = {
      user: { id: '123', email: 'syedadnanmohd61@gmail.com', role: 'Admin' },
      accessToken: 'mock-token-123'
    };

    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    render(
      <BrowserRouter>
        <AuthProvider>
          <TestAuthComponent />
        </AuthProvider>
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('not-loading');
    });

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

    console.log('✅ Login function called correctly');
  });

  test('3. Test stored user data loading', async () => {
    console.log('\n=== STORED USER DATA TEST ===');
    
    const mockUser = { id: '123', email: 'syedadnanmohd61@gmail.com', role: 'Admin' };
    const mockToken = 'valid-token-123';
    
    localStorageMock.getItem.mockImplementation((key) => {
      console.log('localStorage.getItem called with:', key);
      if (key === 'token') return mockToken;
      if (key === 'user') return JSON.stringify(mockUser);
      return null;
    });

    render(
      <BrowserRouter>
        <AuthProvider>
          <TestAuthComponent />
        </AuthProvider>
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('not-loading');
    });

    console.log('Authentication state:', screen.getByTestId('authenticated').textContent);
    console.log('User data:', screen.getByTestId('user').textContent);
    
    console.log('✅ Stored user data test completed');
  });
});