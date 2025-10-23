import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please check VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Auth methods
export const auth = {
  signUp: async (email, password, userData = {}) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: userData
      }
    });
    if (error) throw error;
    return data;
  },

  signIn: async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    if (error) throw error;
    return data;
  },

  signOut: async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  getCurrentUser: async () => {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) throw error;
    return user;
  },

  getSession: async () => {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) throw error;
    return session;
  },

  onAuthStateChange: (callback) => {
    return supabase.auth.onAuthStateChange(callback);
  },

  resetPassword: async (email) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) throw error;
  },

  updatePassword: async (password) => {
    const { error } = await supabase.auth.updateUser({ password });
    if (error) throw error;
  }
};

// Helper function to create entity methods
export const createEntityMethods = (tableName) => {
  return {
    find: async (filters = {}, options = {}) => {
      let query = supabase.from(tableName).select('*');

      // Apply filters
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          query = query.eq(key, value);
        }
      });

      // Apply options
      if (options.orderBy) {
        query = query.order(options.orderBy.column, { ascending: options.orderBy.ascending ?? true });
      }
      if (options.limit) {
        query = query.limit(options.limit);
      }
      if (options.offset) {
        query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },

    findOne: async (id) => {
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .eq('id', id)
        .single();
      if (error) throw error;
      return data;
    },

    create: async (data) => {
      const { data: result, error } = await supabase
        .from(tableName)
        .insert(data)
        .select()
        .single();
      if (error) throw error;
      return result;
    },

    update: async (id, data) => {
      const { data: result, error } = await supabase
        .from(tableName)
        .update(data)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return result;
    },

    delete: async (id) => {
      const { error } = await supabase
        .from(tableName)
        .delete()
        .eq('id', id);
      if (error) throw error;
      return true;
    },

    count: async (filters = {}) => {
      let query = supabase.from(tableName).select('*', { count: 'exact', head: true });

      // Apply filters
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          query = query.eq(key, value);
        }
      });

      const { count, error } = await query;
      if (error) throw error;
      return count;
    }
  };
};

// Profile management methods
export const ensureProfile = async (userId, profileData) => {
  // First check if profile exists
  const { data: existingProfile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (existingProfile) {
    return existingProfile;
  }

  // Create new profile if it doesn't exist
  const { data: newProfile, error } = await supabase
    .from('profiles')
    .insert({
      id: userId,
      ...profileData,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .select()
    .single();

  if (error) throw error;
  return newProfile;
};

export const getUserWithProfile = async (userId) => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error && error.code !== 'PGRST116') throw error; // PGRST116 is "not found"
  return data;
};

// Storage methods for file uploads
export const uploadFile = async (bucket, fileName, file, options = {}) => {
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(fileName, file, options);

  if (error) throw error;
  return data;
};

export const getFileUrl = (bucket, fileName) => {
  const { data } = supabase.storage
    .from(bucket)
    .getPublicUrl(fileName);
  return data.publicUrl;
};

export const deleteFile = async (bucket, fileName) => {
  const { error } = await supabase.storage
    .from(bucket)
    .remove([fileName]);

  if (error) throw error;
  return true;
};

// Database subscriptions for real-time updates
export const subscribeToTable = (tableName, callback, filters = {}) => {
  let channel = supabase
    .channel(`${tableName}_changes`)
    .on('postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: tableName,
        ...filters
      },
      callback
    )
    .subscribe();

  return channel;
};