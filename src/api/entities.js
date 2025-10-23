import { createEntityMethods, auth, ensureProfile, getUserWithProfile } from './supabaseClient';

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

// Auth methods
export const User = auth;

// Additional auth method for getting current user (similar to base44.auth.me())
User.me = async () => {
  const user = await auth.getCurrentUser();
  if (!user) throw new Error('No authenticated user');

  // Get user profile
  const profile = await getUserWithProfile(user.id);

  return {
    ...user,
    ...profile,
    user_type: profile?.user_type || 'job_seeker',
    full_name: profile?.full_name || user.email,
    email: user.email
  };
};

// Method to update current user's data
User.updateMyUserData = async (userData) => {
  const user = await auth.getCurrentUser();
  if (!user) throw new Error('No authenticated user');

  // Update profile data
  const updatedProfile = await ensureProfile(user.id, userData);
  return updatedProfile;
};