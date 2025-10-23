import { createEntityMethods, auth } from './supabaseClient';

// Create entity methods for each table
export const Job = createEntityMethods('jobs');

export const JobApplication = createEntityMethods('job_applications');

export const Notification = createEntityMethods('notifications');

export const CandidateView = createEntityMethods('candidate_views');

export const Message = createEntityMethods('messages');

export const Conversation = createEntityMethods('conversations');

export const QuestionnaireResponse = createEntityMethods('questionnaire_responses');

export const JobView = createEntityMethods('job_views');

export const UserAction = createEntityMethods('user_actions');

export const UserStats = createEntityMethods('user_stats');

export const EmployerAction = createEntityMethods('employer_actions');

export const EmployerStats = createEntityMethods('employer_stats');

export const CV = createEntityMethods('cvs');

// Export User auth methods
export const User = auth;
