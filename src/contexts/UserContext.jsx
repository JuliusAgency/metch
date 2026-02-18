import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
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
  const [unreadCount, setUnreadCount] = useState(0);
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);
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
        if (session.user.user_metadata?.is_deleted) {
          await supabase.auth.signOut();
          setUser(null);
          setProfile(null);
          setLoading(false);
          return;
        }

        setUser(session.user);
        const userProfile = await loadUserProfile(session.user.id);
        setProfile(userProfile);

        // Load initial unread count
        if (session.user.id) {
          refreshUnreadCount(session.user.id, session.user.email);
        }

        // Update last login date
        if (userProfile) {
          await supabase
            .from('UserProfile')
            .update({ last_login_date: new Date().toISOString() })
            .eq('id', session.user.id);
        }
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
    // We separate specific metadata fields that might not exist in UserProfile schema
    // but should be preserved in Auth User Metadata
    // eslint-disable-next-line no-unused-vars
    const { marketing_consent, terms_accepted, ...profileData } = metadata;

    if (data.user) {
      await supabase
        .from('UserProfile')
        .insert({
          id: data.user.id,
          email: data.user.email,
          role: 'user',
          full_name: '',
          user_type: null, // No user type selected initially - user will select after email confirmation
          last_login_date: new Date().toISOString(),
          ...profileData
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

    if (error) throw error;

    if (data.user?.user_metadata?.is_deleted) {
      await supabase.auth.signOut();
      throw new Error("המשתמש נמחק מהמערכת");
    }

    setUser(data.user);
    const userProfile = await loadUserProfile(data.user.id);
    setProfile(userProfile);

    // Update last login date
    if (userProfile) {
      await supabase
        .from('UserProfile')
        .update({ last_login_date: new Date().toISOString() })
        .eq('id', data.user.id);
    }

    return data;
  };

  /**
   * Sign in with Google
   */
  const signInWithGoogle = async () => {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/EmailConfirmed`,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      }
    });

    if (error) throw error;
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
   * Refresh unread notification and message counts
   */
  const refreshUnreadCount = useCallback(async (userId, userEmail) => {
    if (!userId && !userEmail) return;

    console.log('[refreshUnreadCount] Starting with userId:', userId, 'userEmail:', userEmail);

    try {
      // Count unread notifications (INCLUDING message notifications now)
      const [byUserId, byEmail] = await Promise.all([
        supabase.from('Notification').select('*', { count: 'exact', head: false }).eq('user_id', userId).eq('is_read', false),
        supabase.from('Notification').select('*', { count: 'exact', head: false }).eq('email', userEmail).eq('is_read', false)
      ]);

      console.log('[refreshUnreadCount] Query results:', {
        byUserId: byUserId.data?.length,
        byEmail: byEmail.data?.length
      });

      console.log('[refreshUnreadCount] Notifications by userId:', byUserId.data?.length);
      console.log('[refreshUnreadCount] Notifications by email:', byEmail.data?.length);

      // Merge and deduplicate notifications
      const allNotifications = [
        ...(byUserId.data || []),
        ...(byEmail.data || [])
      ];
      const uniqueNotifications = Array.from(
        new Map(allNotifications.map(item => [item.id, item])).values()
      );

      console.log('[refreshUnreadCount] Total unique unread notifications (all types):', uniqueNotifications.length);
      if (uniqueNotifications.length > 0) {
        console.log('[refreshUnreadCount] Unique unread notification details:', uniqueNotifications.map(n => ({
          type: n.type,
          email: n.email,
          user_id: n.user_id,
          is_read: n.is_read
        })));
      }

      // Filter by allowed types based on profile
      let filteredUnread = [];
      if (profile) {
        const allowedTypes = profile.user_type === 'employer'
          ? ['application_submitted', 'new_message']
          : ['profile_view', 'new_message'];

        filteredUnread = uniqueNotifications.filter(n => allowedTypes.includes(n.type));
        console.log('[refreshUnreadCount] Filtered unread count for', profile.user_type, ':', filteredUnread.length);
      } else {
        filteredUnread = uniqueNotifications;
      }

      setUnreadCount(filteredUnread.length);

      // Count unread messages
      const [messagesByEmail, messagesById] = await Promise.all([
        supabase.from('Message').select('*', { count: 'exact', head: false }).eq('recipient_email', userEmail).eq('is_read', 'false'),
        supabase.from('Message').select('*', { count: 'exact', head: false }).eq('recipient_id', userId).eq('is_read', 'false')
      ]);

      console.log('[refreshUnreadCount] Messages by email:', messagesByEmail.data?.length);
      console.log('[refreshUnreadCount] Messages by id:', messagesById.data?.length);

      // Merge and deduplicate messages
      const allMessages = [
        ...(messagesByEmail.data || []),
        ...(messagesById.data || [])
      ];
      const uniqueMessages = Array.from(
        new Map(allMessages.map(item => [item.id, item])).values()
      );

      console.log('[refreshUnreadCount] Total unique messages:', uniqueMessages.length);
      setUnreadMessagesCount(uniqueMessages.length);

      console.log('[refreshUnreadCount] SUCCESS. Unread Counts - Notifications:', filteredUnread.length, 'Messages:', uniqueMessages.length);
    } catch (error) {
      console.error('[refreshUnreadCount] ERROR:', error);
    }
  }, [profile]);

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

    // Set up Realtime subscription for Notifications
    let notificationSubscription = null;
    if (user?.id || user?.email) {
      notificationSubscription = supabase
        .channel('public:Notification')
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'Notification'
        }, (payload) => {
          console.log('[UserContext] Notification change detected:', payload.eventType, payload);
          const newNotif = payload.new;
          const oldNotif = payload.old;

          // Check if it's relevant to this user (Must be the recipient)
          const isRelevant =
            (newNotif?.user_id === user.id || newNotif?.email === user.email) ||
            (oldNotif?.user_id === user.id || oldNotif?.email === user.email);

          console.log('[UserContext] Notification is relevant:', isRelevant, 'user.id:', user.id, 'user.email:', user.email);
          if (isRelevant) {
            refreshUnreadCount(user.id, user.email);
          }
        })
        .subscribe();

      // Initial count refresh
      refreshUnreadCount(user.id, user.email);
    }

    // Set up Realtime subscription for Messages to refresh counts when marked as read
    let messageSubscription = null;
    if (user?.id || user?.email) {
      messageSubscription = supabase
        .channel('public:Message')
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'Message'
        }, (payload) => {
          console.log('[UserContext] Message change detected:', payload.eventType, payload);
          const newMsg = payload.new;
          const oldMsg = payload.old;

          // Check if it's relevant to this user
          const isRelevant =
            (newMsg?.recipient_id === user.id || newMsg?.recipient_email === user.email) ||
            (oldMsg?.recipient_id === user.id || oldMsg?.recipient_email === user.email);

          console.log('[UserContext] Message is relevant:', isRelevant);
          if (isRelevant) {
            refreshUnreadCount(user.id, user.email);
          }
        })
        .subscribe();
    }

    return () => {
      subscription.unsubscribe();
      if (notificationSubscription) {
        supabase.removeChannel(notificationSubscription);
      }
      if (messageSubscription) {
        supabase.removeChannel(messageSubscription);
      }
    };
  }, [initializeUser, user?.id, user?.email, profile, refreshUnreadCount]);

  const value = React.useMemo(() => ({
    user: user ? getUserWithProfile() : null,
    profile,
    loading,
    signUp,
    signIn,
    signInWithGoogle,
    signOut,
    updateProfile,
    createUserProfile,
    loadUserProfile,
    // Check if user exists by email (to prevent duplicate registrations)
    checkUserExists: async (email) => {
      try {
        const { data, error } = await supabase
          .from('UserProfile')
          .select('email')
          .eq('email', email)
          .maybeSingle(); // Use maybeSingle to avoid 406 on no rows

        if (error) return false;
        return !!data;
      } catch {
        return false;
      }
    },
    getUserWithProfile,
    unreadCount,
    unreadMessagesCount,
    refreshUnreadCount,
    // Backwards compatibility
    setUser: (newUser) => {
      setUser(newUser);
      if (newUser) {
        loadUserProfile(newUser.id).then(setProfile);
      }
    }
  }), [user, profile, loading, unreadCount, unreadMessagesCount, refreshUnreadCount, signUp, signIn, signInWithGoogle, signOut, updateProfile, createUserProfile, loadUserProfile, getUserWithProfile]);

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
};

UserProvider.propTypes = {
  children: PropTypes.node.isRequired,
};
