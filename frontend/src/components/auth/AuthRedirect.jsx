import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext.jsx';

const AuthRedirect = () => {
  const { isAuthenticated, user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    console.log('AuthRedirect - Auth state:', { isAuthenticated, user, loading });
    
    if (!loading && isAuthenticated && user) {
      console.log('Redirecting authenticated user:', user.role);
      const redirectTo = user.role === 'Admin' ? '/admin' : '/dashboard';
      console.log('Redirecting to:', redirectTo);
      navigate(redirectTo, { replace: true });
    }
  }, [isAuthenticated, user, loading, navigate]);

  return null;
};

export default AuthRedirect;