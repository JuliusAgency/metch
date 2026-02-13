import { UserAction, EmployerAction } from "@/api/entities";
import { SendWhatsAppMessage } from "@/api/integrations";

/**
 * Checks if a profile is incomplete and sends a one-time WhatsApp notification.
 * @param {Object} user - Auth user object
 * @param {Object} profile - User profile data
 * @param {boolean} hasCV - Whether the seeker has a CV (ignored for employers)
 * @returns {Promise<boolean>} True if notification was sent, false otherwise
 */
export const checkAndNotifyIncompleteProfile = async (user, profile, hasCV) => {
  if (!user || !profile || !profile.phone) return false;

  const userId = user.id;
  const isEmployer = profile.user_type === 'employer';
  const ActionEntity = isEmployer ? EmployerAction : UserAction;
  const actionType = 'incomplete_profile_wa_sent';

  try {
    // 1. Check if already sent
    const existingActions = await ActionEntity.filter({
      user_id: userId,
      action_type: actionType
    });

    if (existingActions.length > 0) {
      return false; // Already sent
    }

    // 2. Check for missing fields
    const hasProfilePicture = !!profile.profile_picture;
    const hasSocialLinks = !!(
      profile.linkedin_url || 
      profile.facebook_url || 
      profile.instagram_url || 
      profile.twitter_url || 
      (isEmployer && profile.portfolio_url)
    );
    
    // For seekers, check CV. For employers, hasCV is ignored or assumed true.
    const isCVComplete = isEmployer ? true : hasCV;

    const isIncomplete = !hasProfilePicture || !hasSocialLinks || !isCVComplete;

    if (!isIncomplete) {
      return false; // Profile is complete
    }

    // 3. Send WhatsApp Message
    const message = `שמנו לב שהפרופיל שלך עדיין אינו מלא.
השלמת הפרטים תאפשר התאמות מדויקות יותר ותגדיל את הסיכוי למאצ׳ המושלם.

להשלמת הפרופיל, היכנס לחשבון שלך.`;

    console.log(`[NotificationService] Sending incomplete profile WA to ${profile.phone}`);
    
    await SendWhatsAppMessage({
      phoneNumber: profile.phone,
      message: message
    });

    // 4. Log the action to prevent re-sending
    await ActionEntity.create({
      user_id: userId,
      user_email: profile.email || user.email,
      action_type: actionType,
      created_date: new Date().toISOString(),
      additional_data: {
        missing_fields: {
          profile_picture: !hasProfilePicture,
          social_links: !hasSocialLinks,
          cv: isEmployer ? false : !hasCV
        }
      }
    });

    return true;
  } catch (error) {
    console.error('[NotificationService] Error in checkAndNotifyIncompleteProfile:', error);
    return false;
  }
};
