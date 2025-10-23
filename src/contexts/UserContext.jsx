import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase, auth } from '@/api/supabaseClient';

const UserContext = createContext();

/**
 * Hook to use user context
 * @returns {Object} User context with user, loading, and auth methods
 */
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
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (error && error.code !== 'PGRST116') {
        console.error('Error loading user profile:', error);
        return null;
      }
      
      return data;
    } catch (error) {
      console.error('Error loading user profile:', error);
      return null;
    }
  };

  /**
   * Initialize user session
   */
  const initializeUser = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        setUser(session.user);
        const userProfile = await loadUserProfile(session.user.id);
        setProfile(userProfile);
      }
    } catch (error) {
      console.error('Error initializing user:', error);
    } finally {
      setLoading(false);
    }
  };

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
          .from('users')
          .insert({
            id: data.user.id,
            email: data.user.email,
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
      
      const { data, error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', user.id)
        .select()
        .single();
      
      if (error) throw error;
      
      setProfile(data);
      return data;
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  };

  /**
   * Ensure user profile exists (create if missing)
   */
  const ensureProfile = async () => {
    try {
      if (!user) throw new Error('No user logged in');
      
      const existingProfile = await loadUserProfile(user.id);
      
      if (existingProfile) {
        setProfile(existingProfile);
        return existingProfile;
      }
      
      // Create profile if it doesn't exist
      const { data, error } = await supabase
        .from('users')
        .insert({
          id: user.id,
          email: user.email,
          ...user.user_metadata
        })
        .select()
        .single();
      
      if (error) throw error;
      
      setProfile(data);
      return data;
    } catch (error) {
      console.error('Error ensuring profile:', error);
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

  // Initialize user on mount
  useEffect(() => {
    initializeUser();

    // Listen to auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event);
        
        if (session?.user) {
          setUser(session.user);
          const userProfile = await loadUserProfile(session.user.id);
          setProfile(userProfile);
        } else {
          setUser(null);
          setProfile(null);
        }
        
        setLoading(false);
      }
    );

    // Cleanup subscription
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const value = {
    user: user ? getUserWithProfile() : null,
    profile,
    loading,
    signUp,
    signIn,
    signOut,
    updateProfile,
    ensureProfile,
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
