import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '@/contexts/UserContext';
import PropTypes from 'prop-types';

/**
 * Authentication Guard Component
 * Redirects unauthenticated users to login page
 */
const AuthGuard = ({ children }) => {
  const { user, loading } = useUser();
  const navigate = useNavigate();

  console.log('AuthGuard - loading:', loading, 'user:', user);

  useEffect(() => {
    console.log('AuthGuard useEffect - loading:', loading, 'user:', user);
    if (!loading && !user) {
      console.log('AuthGuard redirecting to Login - no user');
      navigate('/Login');
    } else if (!loading && user && !user.profile) {
      console.log('AuthGuard redirecting to EmailConfirmed - no profile');
      navigate('/EmailConfirmed');
    } else if (!loading && user && user.profile && !user.user_type) {
      console.log('AuthGuard redirecting to UserTypeSelection - no user_type');
      navigate('/UserTypeSelection');
    }
  }, [user, loading, navigate]);

  // Show loading while checking authentication
  if (loading) {
    console.log('AuthGuard showing loading spinner');
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Don't render children if user is not authenticated
  if (!user) {
    console.log('AuthGuard not rendering children - no user');
    return null;
  }

  // Don't render children if user doesn't have a profile
  if (!user.profile) {
    console.log('AuthGuard not rendering children - no profile');
    return null;
  }

  // Don't render children if user doesn't have a user_type
  if (!user.user_type) {
    console.log('AuthGuard not rendering children - no user_type');
    return null;
  }

  console.log('AuthGuard rendering children');
  return children;
};

AuthGuard.propTypes = {
  children: PropTypes.node.isRequired
};

export default AuthGuard;
