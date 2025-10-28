import { createContext, useContext, useState, useEffect, useCallback } from 'react';
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
  console.log('[UserProvider] Component rendering');
  
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  
  console.log('[UserProvider] Initial state - loading:', loading, 'user:', user, 'profile:', profile);

  /**
   * Load user profile from database
   */
  const loadUserProfile = async (userId) => {
    try {
      console.log('[loadUserProfile] Starting to load profile for user ID:', userId);
      
      // Add timeout to prevent hanging
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Profile loading timeout')), 3000);
      });
      
      console.log('[loadUserProfile] Querying UserProfile table...');
      const profilePromise = supabase
        .from('UserProfile')
        .select('*')
        .eq('id', userId)
        .single();
      
      console.log('[loadUserProfile] Waiting for profile query or timeout...');
      const { data, error } = await Promise.race([profilePromise, timeoutPromise]);
      console.log('[loadUserProfile] Query completed');
      
      if (error) {
        console.error('[loadUserProfile] Error loading user profile:', error);
        console.error('[loadUserProfile] Error code:', error.code);
        console.error('[loadUserProfile] Error message:', error.message);
        
        // If profile doesn't exist (PGRST116), return null - EmailConfirmed will handle creation
        if (error.code === 'PGRST116') {
          console.log('[loadUserProfile] User profile not found (PGRST116) - will redirect to EmailConfirmed for profile creation');
          return null;
        }
      }
      
      console.log('[loadUserProfile] User profile loaded successfully:', data ? 'data exists' : 'no data');
      return data;
    } catch (error) {
      console.error('[loadUserProfile] Exception caught:', error);
      console.error('[loadUserProfile] Exception message:', error.message);
      // Return null to trigger EmailConfirmed redirect for profile creation
      return null;
    }
  };

  /**
   * Create user profile with optional updates
   */
  const createUserProfile = async (userId, updates = {}) => {
    try {
      console.log('Creating user profile for user ID:', userId, 'with updates:', updates);
      
      // Get user data from auth
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
      if (authError || !authUser) {
        console.error('Error getting auth user:', authError);
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
      
      console.log('Creating profile with data:', profileData);
      
      const { data, error } = await supabase
        .from('UserProfile')
        .insert(profileData)
        .select()
        .single();
      
      if (error) {
        console.error('Error creating user profile:', error);
        return null;
      }
      
      console.log('User profile created:', data);
      setProfile(data);
      return data;
    } catch (error) {
      console.error('Error creating user profile:', error);
      return null;
    }
  };

  /**
   * Initialize user session
   */
  const initializeUser = useCallback(async () => {
    try {
      console.log('[initializeUser] Starting user session initialization...');  
      console.log('[initializeUser] Calling supabase.auth.getSession()...');
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('[initializeUser] Error getting session:', error);
        console.log('[initializeUser] Setting loading to false due to error');
        setLoading(false);
        return;
      }
      
      console.log('[initializeUser] Session retrieved:', session ? 'session exists' : 'no session');
      console.log('[initializeUser] Session user:', session?.user ? 'user exists' : 'no user');
      
      if (session?.user) {
        console.log('[initializeUser] User found in session, ID:', session.user.id);
        console.log('[initializeUser] Setting user state...');
        setUser(session.user);
        console.log('[initializeUser] Loading user profile...');
        const userProfile = await loadUserProfile(session.user.id);
        console.log('[initializeUser] Profile loaded:', userProfile ? 'profile exists' : 'no profile');
        console.log('[initializeUser] Setting profile state...');
        setProfile(userProfile);
      } else {
        console.log('[initializeUser] No user in session');
      }
    } catch (error) {
      console.error('[initializeUser] Exception caught:', error);
      console.error('[initializeUser] Error stack:', error.stack);
    } finally {
      console.log('[initializeUser] Finally block - setting loading to false');
      setLoading(false);
      console.log('[initializeUser] Initialization complete');
    }
  }, []);

  /**
   * Sign up a new user
   */
  const signUp = async ({ email, password, ...metadata }) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: metadata
        }
      });
      
      if (error) throw error;
      
      // Create user profile
      if (data.user) {
        const { error: profileError } = await supabase
          .from('UserProfile')
          .insert({
            id: data.user.id,
            email: data.user.email,
            role: 'user',
            full_name: '',
            user_type: 'job_seeker',
            ...metadata
          });
        
        if (profileError) {
          console.error('Error creating user profile:', profileError);
        }
      }
      
      return data;
    } catch (error) {
      console.error('Error signing up:', error);
      throw error;
    }
  };

  /**
   * Sign in a user
   */
  const signIn = async ({ email, password }) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) throw error;
      
      setUser(data.user);
      const userProfile = await loadUserProfile(data.user.id);
      setProfile(userProfile);
      
      return data;
    } catch (error) {
      console.error('Error signing in:', error);
      throw error;
    }
  };

  /**
   * Sign out the current user
   */
  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      setUser(null);
      setProfile(null);
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  };

  /**
   * Update user profile
   */
  const updateProfile = async (updates) => {
    try {
      if (!user) throw new Error('No user logged in');
      
      // If profile doesn't exist, create it with the updates
      if (!profile) {
        console.log('Profile not found, creating new profile with updates:', updates);
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
          console.log('Profile not found during update, creating new profile with updates:', updates);
          return await createUserProfile(user.id, updates);
        }
        throw error;
      }
      
      setProfile(data);
      return data;
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
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

  // Track loading state changes
  useEffect(() => {
    console.log('[UserProvider] Loading state changed to:', loading);
  }, [loading]);

  // Track user state changes
  useEffect(() => {
    console.log('[UserProvider] User state changed:', user ? `user exists (ID: ${user.id})` : 'user is null');
  }, [user]);

  // Track profile state changes
  useEffect(() => {
    console.log('[UserProvider] Profile state changed:', profile ? 'profile exists' : 'profile is null');
  }, [profile]);

  // Initialize user on mount
  useEffect(() => {
    console.log('[UserProvider] Mounting - calling initializeUser');
    initializeUser();
  }, [initializeUser]);

  // listen to auth state changes
  useEffect(() => {
    console.log('[UserProvider] Setting up auth state listener');
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      console.log('[UserProvider] Auth state change event:', event);
      if (event === 'SIGNED_IN') {
        console.log('[UserProvider] SIGNED_IN event - calling initializeUser');
        initializeUser();
      }
    });
    return () => {
      console.log('[UserProvider] Cleaning up auth state listener');
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
