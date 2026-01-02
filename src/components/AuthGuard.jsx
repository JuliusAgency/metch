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

  useEffect(() => {
    if (!loading && !user) {
      navigate('/Login');
    } else if (!loading && user && !user.profile) {
      navigate('/EmailConfirmed');
    } else if (!loading && user && user.profile && !user.user_type) {
      navigate('/UserTypeSelection');
    }
  }, [user, loading, navigate]);

  // Show loading while checking authentication
  if (loading && !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 border-t-2 border-blue-500 rounded-full animate-spin" />
      </div>
    );
  }

  // Don't render children if user is not authenticated
  if (!user) {
    return null;
  }

  // Don't render children if user doesn't have a profile
  if (!user.profile) {
    return null;
  }

  // Don't render children if user doesn't have a user_type
  if (!user.user_type) {
    return null;
  }

  return children;
};

AuthGuard.propTypes = {
  children: PropTypes.node.isRequired
};

export default AuthGuard;
