import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import PropTypes from 'prop-types';
import { supabase } from '@/api/supabaseClient';

const UserContext = createContext();

/**
 * Hook to use user context
 * @returns {Object} User context with user, loading, and auth methods
 */
// eslint-disable-next-line react-refresh/only-export-components
export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};

/**
 * User/Auth Provider Component
 * Manages authentication state and provides auth methods
 */
export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const initInFlightRef = useRef(false);

  /**
   * Load user profile from database
   */
  const loadUserProfile = async (userId) => {
    try {
      // Add timeout to prevent hanging
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Profile loading timeout')), 3000);
      });

      const profilePromise = supabase
        .from('UserProfile')
        .select('*')
        .eq('id', userId)
        .single();

      const { data, error } = await Promise.race([profilePromise, timeoutPromise]);

      if (error) {
        // If profile doesn't exist (PGRST116), return null - EmailConfirmed will handle creation
        if (error.code === 'PGRST116') {
          return null;
        }
      }

      return data;
    } catch {
      // Return null to trigger EmailConfirmed redirect for profile creation
      return null;
    }
  };

  /**
   * Create user profile with optional updates
   */
  const createUserProfile = async (userId, updates = {}) => {
    try {
      // Get user data from auth
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
      if (authError || !authUser) {
        return null;
      }

      const profileData = {
        id: userId,
        email: authUser.email,
        role: 'user',
        full_name: authUser.user_metadata?.full_name || '',
        user_type: null, // No user type selected initially
        // Only include safe fields from user_metadata that exist in UserProfile schema
        ...(authUser.user_metadata?.bio && { bio: authUser.user_metadata.bio }),
        ...(authUser.user_metadata?.phone && { phone: authUser.user_metadata.phone }),
        ...(authUser.user_metadata?.linkedin_url && { linkedin_url: authUser.user_metadata.linkedin_url }),
        ...(authUser.user_metadata?.company_name && { company_name: authUser.user_metadata.company_name }),
        // Apply any updates passed in
        ...updates
      };

      const { data, error } = await supabase
        .from('UserProfile')
        .insert(profileData)
        .select()
        .single();

      if (error) {
        return null;
      }

      setProfile(data);
      return data;
    } catch {
      return null;
    }
  };

  /**
   * Initialize user session
   */
  const initializeUser = useCallback(async () => {
    // Prevent duplicate initialization calls
    if (initInFlightRef.current) {
      return;
    }
    initInFlightRef.current = true;

    try {
      const { data: { session }, error } = await supabase.auth.getSession();

      if (error) {
        setLoading(false);
        return;
      }

      if (session?.user) {
        setUser(session.user);
        const userProfile = await loadUserProfile(session.user.id);
        setProfile(userProfile);
      }
    } catch (error) {
      // Silently handle errors during initialization
      console.error('[initializeUser] Error:', error);
    } finally {
      setLoading(false);
      initInFlightRef.current = false;
    }
  }, []);

  /**
   * Sign up a new user
   */
  const signUp = async ({ email, password, ...metadata }) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata,
        emailRedirectTo: `${window.location.origin}/EmailConfirmed`
      }
    });

    if (error) throw error;

    // Create user profile
    if (data.user) {
      await supabase
        .from('UserProfile')
        .insert({
          id: data.user.id,
          email: data.user.email,
          role: 'user',
          full_name: '',
          user_type: null, // No user type selected initially - user will select after email confirmation
          ...metadata
        });
    }

    return data;
  };

  /**
   * Sign in a user
   */
  const signIn = async ({ email, password }) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) throw error;

    setUser(data.user);
    const userProfile = await loadUserProfile(data.user.id);
    setProfile(userProfile);

    return data;
  };

  /**
   * Sign out the current user
   */
  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;

    setUser(null);
    setProfile(null);
  };

  /**
   * Update user profile
   */
  const updateProfile = async (updates) => {
    if (!user) throw new Error('No user logged in');

    // If profile doesn't exist, create it with the updates
    if (!profile) {
      return await createUserProfile(user.id, updates);
    }

    // Profile exists, update it
    const { data, error } = await supabase
      .from('UserProfile')
      .update(updates)
      .eq('id', user.id)
      .select()
      .single();

    if (error) {
      // If update fails because profile doesn't exist, create it
      if (error.code === 'PGRST116') {
        return await createUserProfile(user.id, updates);
      }
      throw error;
    }

    setProfile(data);
    return data;
  };

  /**
   * Get user with profile data
   */
  const getUserWithProfile = () => {
    return {
      ...user,
      ...profile,
      profile
    };
  };

  // Initialize user and listen to auth state changes
  useEffect(() => {
    // Set up auth state listener first
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        initializeUser();
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setProfile(null);
        setLoading(false);
        initInFlightRef.current = false;
      }
    });

    // Then initialize user
    initializeUser();

    return () => {
      subscription.unsubscribe();
    };
  }, [initializeUser]);

  const value = {
    user: user ? getUserWithProfile() : null,
    profile,
    loading,
    signUp,
    signIn,
    signOut,
    updateProfile,
    createUserProfile,
    loadUserProfile,
    getUserWithProfile,
    // Backwards compatibility
    setUser: (newUser) => {
      setUser(newUser);
      if (newUser) {
        loadUserProfile(newUser.id).then(setProfile);
      }
    }
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
};

UserProvider.propTypes = {
  children: PropTypes.node.isRequired,
};
