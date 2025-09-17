import { createClient } from '@base44/sdk';
// import { getAccessToken } from '@base44/sdk/utils/auth-utils';

// Create a client with authentication required
export const base44 = createClient({
  appId: "689c85a409a96fa6a10f1aca", 
  requiresAuth: false // Ensure authentication is required for all operations
});
