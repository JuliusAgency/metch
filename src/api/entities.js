import { createEntityMethods, auth } from './supabaseClient';

// Create entity methods for each table
export const Job = createEntityMethods('Job');

export const JobApplication = createEntityMethods('JobApplication');

export const Notification = createEntityMethods('Notification');

export const CandidateView = createEntityMethods('CandidateView');

export const Message = createEntityMethods('messages');

export const Conversation = createEntityMethods('conversations');

export const QuestionnaireResponse = createEntityMethods('questionnaire_responses');

export const JobView = createEntityMethods('job_views');

export const UserAction = createEntityMethods('user_actions');

export const UserStats = createEntityMethods('user_stats');

export const EmployerAction = createEntityMethods('EmployerAction');

export const EmployerStats = createEntityMethods('EmployerStats');

export const CV = createEntityMethods('cvs');

export const UserProfile = createEntityMethods('UserProfile');

// Export User auth methods
export const User = auth;
