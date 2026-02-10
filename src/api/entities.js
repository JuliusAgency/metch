import { createEntityMethods, auth, supabase } from './supabaseClient';

// Create entity methods for each table
export const Job = createEntityMethods('Job');

export const JobApplication = createEntityMethods('JobApplication');

export const Notification = createEntityMethods('Notification');

export const CandidateView = createEntityMethods('CandidateView');

export const Message = createEntityMethods('Message');

export const Conversation = createEntityMethods('Conversation');

export const QuestionnaireResponse = createEntityMethods('QuestionnaireResponse');

export const JobView = createEntityMethods('JobView');

export const UserAction = createEntityMethods('UserAction');

export const UserStats = createEntityMethods('UserStats');

export const EmployerAction = createEntityMethods('EmployerAction');

export const EmployerStats = createEntityMethods('EmployerStats');

const defaultCvMethods = createEntityMethods('CV');
export const CV = {
  ...defaultCvMethods,
  // Override create to avoid 'select *' schema cache issues
  async create(data) {
      // Remove parsed_content if it sneaks in
      const { parsed_content, ...cleanData } = data;
      const { data: result, error } = await supabase
        .from('CV')
        .insert(cleanData)
        .select('id, user_email, file_name, file_size_kb, last_modified') // Explicit columns
        .single();
      
      if (error) throw error;
      return result;
  },
  // Override update too
  async update(id, data) {
      const { parsed_content, ...cleanData } = data;
      const { data: result, error } = await supabase
        .from('CV')
        .update(cleanData)
        .eq('id', id)
        .select('id, user_email, file_name, file_size_kb, last_modified')
        .single();
      
      if (error) throw error;
      return result;
  }
};

export const UserProfile = createEntityMethods('UserProfile');

// Export User auth methods
export const User = auth;
