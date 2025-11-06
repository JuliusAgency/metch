import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '@/contexts/UserContext';

/**
 * Hook that ensures user has selected a user type.
 * Redirects to UserTypeSelection if user_type is null.
 * Should be used in all protected pages.
 */
export function useRequireUserType() {
  const { user, loading } = useUser();
  const navigate = useNavigate();

  useEffect(() => {
    // Wait for user data to load
    if (loading) {
      return;
    }

    // If user exists but doesn't have a user_type, redirect to selection
    if (user && !user.user_type) {
      navigate('/UserTypeSelection', { replace: true });
    }
  }, [user, loading, navigate]);

  return { user, loading };
}

