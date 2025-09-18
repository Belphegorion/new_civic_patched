import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext.jsx';
import LoadingSpinner from '../shared/LoadingSpinner.jsx';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { isAuthenticated, user, loading } = useAuth();
  const location = useLocation();

  console.log('ProtectedRoute - Auth state:', { isAuthenticated, user, loading });

  if (loading) {
    console.log('ProtectedRoute - Still loading auth state');
    return <div className="h-screen flex items-center justify-center"><LoadingSpinner /></div>;
  }

  if (!isAuthenticated || !user) {
    console.log('Not authenticated or no user, redirecting to login');
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    console.log('User role not allowed:', user?.role, 'Required:', allowedRoles);
    return <Navigate to="/" replace />;
  }

  console.log('Access granted to protected route');
  return children;
};
export default ProtectedRoute;