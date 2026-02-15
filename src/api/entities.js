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

export const Transaction = createEntityMethods('Transaction');

export const EmployerStats = createEntityMethods('EmployerStats');

const defaultCvMethods = createEntityMethods('CV');
export const CV = {
  ...defaultCvMethods,
  // Override create to avoid 'select *' schema cache issues
  async create(data) {
      const { data: result, error } = await supabase
        .from('CV')
        .insert(data)
        .select('id, user_email, file_name, file_size_kb, last_modified, created_date, parsed_content, skills, summary, work_experience, education, certifications, personal_details')
        .single();
      
      if (error) throw error;
      return result;
  },
  // Override update too
  async update(id, data) {
      const { data: result, error } = await supabase
        .from('CV')
        .update(data)
        .eq('id', id)
        .select('id, user_email, file_name, file_size_kb, last_modified, created_date, parsed_content, skills, summary, work_experience, education, certifications, personal_details')
        .single();
      
      if (error) throw error;
      return result;
  },
  // Override filter to ensure parsed_content is included
  async filter(filters = {}, orderBy = null, limit = null) {
      let query = supabase.from('CV').select('id, user_email, file_name, file_size_kb, last_modified, created_date, parsed_content, personal_details, work_experience, education, certifications, skills, summary');
      
      if (filters && Object.keys(filters).length > 0) {
        Object.entries(filters).forEach(([key, value]) => {
          query = query.eq(key, value);
        });
      }
      
      if (orderBy) {
        const isDescending = orderBy.startsWith('-');
        const column = isDescending ? orderBy.substring(1) : orderBy;
        query = query.order(column, { ascending: !isDescending });
      }
      
      if (limit) {
        query = query.limit(limit);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data || [];
  }
};

export const UserProfile = createEntityMethods('UserProfile');

// Export User auth methods
export const User = auth;
