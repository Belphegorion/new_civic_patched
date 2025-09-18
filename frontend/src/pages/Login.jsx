// src/pages/Login.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';
import GoogleAuth from '../components/auth/GoogleAuth.jsx';
import AuthRedirect from '../components/auth/AuthRedirect.jsx';
import { UserIcon, ShieldCheckIcon } from '@heroicons/react/24/outline';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [adminId, setAdminId] = useState(''); // new adminId state
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isAdminMode, setIsAdminMode] = useState(false);
  const { login, isAuthenticated, user, loading } = useAuth();
  const navigate = useNavigate();

  // Redirect if already authenticated
  useEffect(() => {
    console.log('Login useEffect - Auth state:', { loading, isAuthenticated, user });
    if (!loading && isAuthenticated && user) {
      console.log('User already authenticated, forcing redirect...', user);
      const redirectTo = user.role === 'Admin' ? '/admin' : '/dashboard';
      console.log('Redirecting to:', redirectTo);
      window.location.href = redirectTo;
    }
  }, [isAuthenticated, user, loading]);

  // Prevent zoom on iOS when focusing inputs
  useEffect(() => {
    const viewport = document.querySelector('meta[name=viewport]');
    if (viewport) {
      viewport.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no');
    }
    return () => {
      if (viewport) {
        viewport.setAttribute('content', 'width=device-width, initial-scale=1.0');
      }
    };
  }, []);

  const toggleAdminMode = () => {
    setIsAdminMode(!isAdminMode);
    setError('');
    setEmail('');
    setPassword('');
    setAdminId('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (isAdminMode) {
        // Admin login flow: call admin-login endpoint directly (requires adminId)
        if (!email || !password || !adminId) {
          setError('Email, password and Admin ID are required for admin login.');
          setIsLoading(false);
          return;
        }

        const res = await fetch('/api/auth/admin-login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password, adminId })
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Admin login failed');

        // store token (your app reads token from localStorage elsewhere)
        localStorage.setItem('token', data.token);

        // redirect to admin dashboard
        window.location.href = '/admin';
      } else {
        // Citizen / normal login using your existing auth context
        const { user } = await login({ email, password });
        console.log('Login successful, user:', user);
        // Force navigation based on user role
        if (user && user.role === 'Admin') {
          console.log('Navigating to admin dashboard');
          window.location.href = '/admin';
        } else {
          console.log('Navigating to citizen dashboard');
          window.location.href = '/dashboard';
        }
      }
    } catch (err) {
      console.error('Login error:', err);
      const errorMessage = err.message || 'Login failed. Please check your credentials.';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <AuthRedirect />
      <div className="min-h-screen flex items-center justify-center py-6 md:py-12 px-4 bg-gray-50 dark:bg-gray-950">
        <div className="max-w-md w-full space-y-6 md:space-y-8">
          {/* Mobile-optimized Header */}
          <div className="text-center">
            <div className="mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <span className="text-white text-xl font-bold">CR</span>
              </div>
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100">
              {isAdminMode ? 'Admin Login' : 'Welcome back'}
            </h2>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              {isAdminMode ? 'Sign in to admin dashboard' : 'Sign in to your account'}
            </p>
          </div>

          {/* Login Type Toggle */}
          <div className="flex items-center justify-center space-x-4 mb-6">
            <button
              onClick={toggleAdminMode}
              className={`flex items-center space-x-2 px-4 py-2 rounded-xl font-medium transition-all duration-200 ${
                !isAdminMode
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              <UserIcon className="h-4 w-4" />
              <span>Citizen</span>
            </button>
            <button
              onClick={toggleAdminMode}
              className={`flex items-center space-x-2 px-4 py-2 rounded-xl font-medium transition-all duration-200 ${
                isAdminMode
                  ? 'bg-gradient-to-r from-red-600 to-pink-600 text-white shadow-lg'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              <ShieldCheckIcon className="h-4 w-4" />
              <span>Admin</span>
            </button>
          </div>

          {/* Mobile-optimized Form */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-800">
            <div className="p-6 md:p-8">
              <form className="space-y-5 md:space-y-6" onSubmit={handleSubmit}>
                {error && (
                  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-xl text-sm">
                    {error}
                  </div>
                )}

                {isAdminMode && (
                  <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400 px-4 py-3 rounded-xl text-sm">
                    <div className="flex items-center space-x-2">
                      <ShieldCheckIcon className="h-4 w-4" />
                      <span>Admin login mode enabled</span>
                    </div>
                  </div>
                )}

                <div className="form-group">
                  <label htmlFor="email" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Email address
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={isAdminMode ? "Enter admin email" : "Enter your email"}
                    required
                    className="w-full px-4 py-3.5 md:py-3 text-base md:text-sm border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-indigo-500 dark:focus:border-indigo-400 transition-all duration-200 bg-gray-50 dark:bg-gray-800 focus:bg-white dark:focus:bg-gray-700 text-gray-900 dark:text-gray-100"
                    disabled={isLoading}
                    autoComplete="email"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="password" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Password
                  </label>
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={isAdminMode ? "Enter admin password" : "Enter your password"}
                    required
                    className="w-full px-4 py-3.5 md:py-3 text-base md:text-sm border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-indigo-500 dark:focus:border-indigo-400 transition-all duration-200 bg-gray-50 dark:bg-gray-800 focus:bg-white dark:focus:bg-gray-700 text-gray-900 dark:text-gray-100"
                    disabled={isLoading}
                    autoComplete="current-password"
                  />
                </div>

                {/* Inline Admin ID input (new) */}
                {isAdminMode && (
                  <div className="form-group">
                    <label htmlFor="adminId" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Admin ID
                    </label>
                    <input
                      id="adminId"
                      type="text"
                      value={adminId}
                      onChange={(e) => setAdminId(e.target.value)}
                      placeholder="ADC5252"
                      required
                      className="w-full px-4 py-3.5 md:py-3 text-base md:text-sm border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-indigo-500 dark:focus:border-indigo-400 transition-all duration-200 bg-gray-50 dark:bg-gray-800 focus:bg-white dark:focus:bg-gray-700 text-gray-900 dark:text-gray-100"
                      disabled={isLoading}
                    />
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoading}
                  className={`w-full py-4 md:py-3 px-6 rounded-xl font-semibold text-base md:text-sm focus:ring-4 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed active:scale-98 touch-feedback ${
                    isAdminMode
                      ? 'bg-gradient-to-r from-red-600 to-pink-600 text-white hover:from-red-700 hover:to-pink-700 focus:ring-red-200 dark:focus:ring-red-800'
                      : 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-700 hover:to-purple-700 focus:ring-indigo-200 dark:focus:ring-indigo-800'
                  }`}
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      Signing in...
                    </div>
                  ) : (
                    `Sign in${isAdminMode ? ' as Admin' : ''}`
                  )}
                </button>

                {!isAdminMode && (
                  <>
                    <div className="relative my-6">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-gray-200 dark:border-gray-700"></div>
                      </div>
                      <div className="relative flex justify-center text-sm">
                        <span className="px-4 bg-white dark:bg-gray-900 text-gray-500 dark:text-gray-400">Or continue with</span>
                      </div>
                    </div>

                    <GoogleAuth isLogin={true} />
                  </>
                )}
              </form>
            </div>
          </div>

          {/* Mobile-optimized Footer */}
          <div className="text-center">
            <p className="text-gray-600 dark:text-gray-400">
              Don't have an account?{' '}
              <Link
                to="/register"
                className="font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors active:text-indigo-800"
              >
                Create account
              </Link>
            </p>
          </div>
        </div>
      </div>
    </>
  );
};
export default Login;
