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
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  /**
   * Load user profile from database
   */
  const loadUserProfile = async (userId) => {
    try {
      console.log('Loading user profile for user ID:', userId);
      
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
        console.error('Error loading user profile:', error);
        
        // If profile doesn't exist (PGRST116), return null - EmailConfirmed will handle creation
        if (error.code === 'PGRST116') {
          console.log('User profile not found - will redirect to EmailConfirmed for profile creation');
          return null;
        }
      }
      
      console.log('User profile loaded:', data);
      return data;
    } catch (error) {
      console.error('Error loading user profile:', error);
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
      console.log('Initializing user session...');  
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('Error getting session:', error);
        setLoading(false);
        return;
      }
      
      console.log('Session data:', session);
      
      if (session?.user) {
        console.log('User found in session:', session.user);
        setUser(session.user);
        const userProfile = await loadUserProfile(session.user.id);
        console.log('Profile loaded in initializeUser:', userProfile);
        setProfile(userProfile);
      } else {
        console.log('No user in session');
      }
    } catch (error) {
      console.error('Error initializing user:', error);
    } finally {
      console.log('Setting loading to false');
      setLoading(false);
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

  // listen to auth state changes
  useEffect(() => {
      const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN') {
        initializeUser();
      }
    });
    return () => subscription.unsubscribe();
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
