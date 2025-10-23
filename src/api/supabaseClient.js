import { createClient } from '@supabase/supabase-js';

/**
 * Required Environment Variables:
 * - VITE_SUPABASE_URL: Your Supabase project URL
 * - VITE_SUPABASE_ANON_KEY: Your Supabase anon/public key
 * - VITE_OPENAI_API_KEY: OpenAI API key for LLM integration
 * - VITE_RESEND_API_KEY: Resend API key for email integration
 */

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY');
}

export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '');

/**
 * Create entity methods for CRUD operations
 * @param {string} tableName - The name of the Supabase table
 * @returns {Object} Entity methods (create, read, update, delete, list)
 */
export const createEntityMethods = (tableName) => {
  return {
    /**
     * Create a new record
     * @param {Object} data - The data to insert
     * @returns {Promise<Object>} The created record
     */
    async create(data) {
      const { data: result, error } = await supabase
        .from(tableName)
        .insert(data)
        .select()
        .single();
      
      if (error) throw error;
      return result;
    },

    /**
     * Get a record by ID
     * @param {string} id - The record ID
     * @returns {Promise<Object>} The record
     */
    async get(id) {
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return data;
    },

    /**
     * Update a record
     * @param {string} id - The record ID
     * @param {Object} data - The data to update
     * @returns {Promise<Object>} The updated record
     */
    async update(id, data) {
      const { data: result, error } = await supabase
        .from(tableName)
        .update(data)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return result;
    },

    /**
     * Delete a record
     * @param {string} id - The record ID
     * @returns {Promise<void>}
     */
    async delete(id) {
      const { error } = await supabase
        .from(tableName)
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },

    /**
     * List records with optional filtering
     * @param {Object} options - Query options (filters, limit, offset, orderBy)
     * @returns {Promise<Array>} Array of records
     */
    async list(options = {}) {
      let query = supabase.from(tableName).select('*');
      
      // Apply filters
      if (options.filters) {
        Object.entries(options.filters).forEach(([key, value]) => {
          query = query.eq(key, value);
        });
      }
      
      // Apply ordering
      if (options.orderBy) {
        const { column, ascending = true } = options.orderBy;
        query = query.order(column, { ascending });
      }
      
      // Apply pagination
      if (options.limit) {
        query = query.limit(options.limit);
      }
      if (options.offset) {
        query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      return data || [];
    },

    /**
     * Find records matching a query
     * @param {Object} query - Query parameters
     * @returns {Promise<Array>} Array of matching records
     */
    async find(query = {}) {
      return this.list({ filters: query });
    },
  };
};

/**
 * Auth helper methods
 */
export const auth = {
  /**
   * Get the current user
   * @returns {Promise<Object>} The current user
   */
  async me() {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) throw error;
    if (!user) throw new Error('Not authenticated');
    
    // Fetch user profile
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();
    
    if (profileError && profileError.code !== 'PGRST116') {
      throw profileError;
    }
    
    return profile || { id: user.id, email: user.email };
  },

  /**
   * Sign up a new user
   * @param {Object} credentials - Email and password
   * @returns {Promise<Object>} The created user
   */
  async signUp({ email, password, ...metadata }) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata
      }
    });
    
    if (error) throw error;
    return data.user;
  },

  /**
   * Sign in a user
   * @param {Object} credentials - Email and password
   * @returns {Promise<Object>} The signed-in user
   */
  async signIn({ email, password }) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    
    if (error) throw error;
    return data.user;
  },

  /**
   * Sign out the current user
   * @returns {Promise<void>}
   */
  async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  /**
   * Get the current session
   * @returns {Promise<Object>} The current session
   */
  async getSession() {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) throw error;
    return session;
  },

  /**
   * Ensure user profile exists
   * @returns {Promise<Object>} The user profile
   */
  async ensureProfile() {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError) throw authError;
    if (!user) throw new Error('Not authenticated');
    
    // Check if profile exists
    const { data: existingProfile } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();
    
    if (existingProfile) {
      return existingProfile;
    }
    
    // Create profile if it doesn't exist
    const { data: newProfile, error: createError } = await supabase
      .from('users')
      .insert({
        id: user.id,
        email: user.email,
        ...user.user_metadata
      })
      .select()
      .single();
    
    if (createError) throw createError;
    return newProfile;
  },

  /**
   * Get user with profile
   * @returns {Promise<Object>} User object with profile
   */
  async getUserWithProfile() {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError) throw authError;
    if (!user) return null;
    
    const { data: profile } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();
    
    return {
      ...user,
      profile: profile || null
    };
  },

  /**
   * Listen to auth state changes
   * @param {Function} callback - Callback function
   * @returns {Object} Subscription object
   */
  onAuthStateChange(callback) {
    return supabase.auth.onAuthStateChange(callback);
  }
};
