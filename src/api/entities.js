import { createEntityMethods, auth } from './supabaseClient';

// Create entity methods for each table
export const Job = createEntityMethods('Job');

export const JobApplication = createEntityMethods('JobApplication');

export const Notification = createEntityMethods('Notification');

export const CandidateView = createEntityMethods('CandidateView');

export const Message = createEntityMethods('Message');

export const Conversation = createEntityMethods('Conversation');

export const QuestionnaireResponse = createEntityMethods('QuestionnaireResponse');

export const JobView = createEntityMethods('JobView');

export const UserAction = createEntityMethods('user_actions');

export const UserStats = createEntityMethods('user_stats');

export const EmployerAction = createEntityMethods('EmployerAction');

export const EmployerStats = createEntityMethods('EmployerStats');

export const CV = createEntityMethods('CV');

export const UserProfile = createEntityMethods('UserProfile');

// Export User auth methods
export const User = auth;
