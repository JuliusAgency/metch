import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth, ensureProfile, getUserWithProfile } from '@/api/supabaseClient';

const UserContext = createContext();

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState(null);

  const loadUser = async (currentSession = null) => {
    try {
      const { data: { session: activeSession }, error: sessionError } = await auth.getSession();

      if (sessionError) throw sessionError;

      if (activeSession?.user) {
        // User is authenticated, get their profile
        const profile = await getUserWithProfile(activeSession.user.id);

        const userData = {
          id: activeSession.user.id,
          email: activeSession.user.email,
          full_name: profile?.full_name || activeSession.user.email,
          user_type: profile?.user_type || 'job_seeker',
          phone: profile?.phone || null,
          avatar_url: profile?.avatar_url || null,
          created_at: activeSession.user.created_at,
          updated_at: profile?.updated_at || activeSession.user.updated_at,
          isDemo: false,
          ...profile
        };

        setUser(userData);
        setSession(activeSession);
      } else {
        // No authenticated user
        setUser(null);
        setSession(null);
      }
    } catch (error) {
      console.error("Error loading user:", error);
      setUser(null);
      setSession(null);
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email, password) => {
    setLoading(true);
    try {
      const { data, error } = await auth.signIn(email, password);
      if (error) throw error;

      // Load user data after successful sign in
      await loadUser(data.session);
      return data;
    } catch (error) {
      console.error("Sign in error:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email, password, userData = {}) => {
    setLoading(true);
    try {
      const { data, error } = await auth.signUp(email, password, userData);
      if (error) throw error;

      // Create profile if user data provided
      if (data.user && userData.full_name) {
        await ensureProfile(data.user.id, {
          full_name: userData.full_name,
          user_type: userData.user_type || 'job_seeker',
          phone: userData.phone || null
        });
      }

      return data;
    } catch (error) {
      console.error("Sign up error:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    setLoading(true);
    try {
      const { error } = await auth.signOut();
      if (error) throw error;

      setUser(null);
      setSession(null);
    } catch (error) {
      console.error("Sign out error:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (profileData) => {
    if (!user?.id) throw new Error('No authenticated user');

    try {
      const updatedProfile = await ensureProfile(user.id, profileData);
      setUser(prev => ({ ...prev, ...updatedProfile }));
      return updatedProfile;
    } catch (error) {
      console.error("Profile update error:", error);
      throw error;
    }
  };

  // Listen for auth state changes
  useEffect(() => {
    loadUser();

    const { data: { subscription } } = auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event, session?.user?.id);

      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        await loadUser(session);
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setSession(null);
        setLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const value = {
    user,
    loading,
    session,
    signIn,
    signUp,
    signOut,
    updateProfile,
    setUser
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
};

