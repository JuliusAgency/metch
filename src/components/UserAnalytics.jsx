import { UserAction } from '@/api/entities';
import { UserStats } from '@/api/entities';

/**
 * Utility class for tracking user actions and updating analytics
 */
export class UserAnalytics {
  static sessionId = null;

  /**
   * Initialize session ID for grouping related actions
   */
  static initSession() {
    if (!this.sessionId) {
      this.sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    return this.sessionId;
  }

  /**
   * Track a user action and update stats
   * @param {string} userEmail - User's email
   * @param {string} actionType - Type of action performed
   * @param {Object} actionData - Additional data about the action
   */
  static async trackAction(userEmail, actionType, actionData = {}) {
    if (!userEmail) {
      console.warn('UserAnalytics: No user email provided for tracking');
      return;
    }

    try {
      const sessionId = this.initSession();
      
      // Record the action
      const actionRecord = {
        user_email: userEmail,
        action_type: actionType,
        session_id: sessionId,
        user_agent: navigator.userAgent,
        additional_data: actionData,
        ...actionData // Spread job data if provided
      };

      await UserAction.create(actionRecord);

      // Update user stats
      await this.updateUserStats(userEmail, actionType, actionData);

      console.log(`Tracked ${actionType} for user ${userEmail}`, actionData);
    } catch (error) {
      console.error('Error tracking user action:', error);
    }
  }

  /**
   * Update aggregated user statistics
   * @param {string} userEmail - User's email
   * @param {string} actionType - Type of action performed
   * @param {Object} actionData - Additional data about the action
   */
  static async updateUserStats(userEmail, actionType, actionData = {}) {
    try {
      // Get existing stats or create new ones
      const existingStats = await UserStats.filter({ user_email: userEmail });
      let stats = existingStats.length > 0 ? existingStats[0] : {
        user_email: userEmail,
        total_job_matches: 0,
        total_job_views: 0,
        total_applications: 0,
        total_rejections: 0,
        total_saves: 0,
        preferred_job_categories: []
      };

      // Update based on action type
      switch (actionType) {
        case 'job_match':
          stats.total_job_matches = (stats.total_job_matches || 0) + 1;
          break;
        case 'job_view':
          stats.total_job_views = (stats.total_job_views || 0) + 1;
          if (actionData.job_company) {
            stats.most_viewed_company = actionData.job_company;
          }
          break;
        case 'job_apply':
          stats.total_applications = (stats.total_applications || 0) + 1;
          break;
        case 'job_reject':
          stats.total_rejections = (stats.total_rejections || 0) + 1;
          break;
        case 'job_save':
          stats.total_saves = (stats.total_saves || 0) + 1;
          break;
        case 'job_unsave':
          stats.total_saves = Math.max((stats.total_saves || 0) - 1, 0);
          break;
      }

      // Update last activity date
      stats.last_activity_date = new Date().toISOString();

      // Update or create stats record
      if (existingStats.length > 0) {
        await UserStats.update(stats.id, stats);
      } else {
        await UserStats.create(stats);
      }

    } catch (error) {
      console.error('Error updating user stats:', error);
    }
  }

  /**
   * Track job match when a job is shown to a user
   */
  static async trackJobMatch(userEmail, job, matchScore = null) {
    return this.trackAction(userEmail, 'job_match', {
      job_id: job.id,
      job_title: job.title,
      job_company: job.company,
      match_score: matchScore || job.match_score
    });
  }

  /**
   * Track job detail view
   */
  static async trackJobView(userEmail, job) {
    return this.trackAction(userEmail, 'job_view', {
      job_id: job.id,
      job_title: job.title,
      job_company: job.company,
      match_score: job.match_score
    });
  }

  /**
   * Track job application
   */
  static async trackJobApplication(userEmail, job) {
    return this.trackAction(userEmail, 'job_apply', {
      job_id: job.id,
      job_title: job.title,
      job_company: job.company,
      match_score: job.match_score
    });
  }

  /**
   * Track job rejection
   */
  static async trackJobRejection(userEmail, job, reason = null) {
    return this.trackAction(userEmail, 'job_reject', {
      job_id: job.id,
      job_title: job.title,
      job_company: job.company,
      match_score: job.match_score,
      rejection_reason: reason
    });
  }

  /**
   * Track job save/bookmark
   */
  static async trackJobSave(userEmail, job) {
    return this.trackAction(userEmail, 'job_save', {
      job_id: job.id,
      job_title: job.title,
      job_company: job.company,
      match_score: job.match_score
    });
  }

  /**
   * Track job unsave/unbookmark
   */
  static async trackJobUnsave(userEmail, job) {
    return this.trackAction(userEmail, 'job_unsave', {
      job_id: job.id,
      job_title: job.title,
      job_company: job.company,
      match_score: job.match_score
    });
  }

  /**
   * Get user statistics
   * @param {string} userEmail - User's email
   * @returns {Object} User statistics
   */
  static async getUserStats(userEmail) {
    try {
      const stats = await UserStats.filter({ user_email: userEmail });
      return stats.length > 0 ? stats[0] : null;
    } catch (error) {
      console.error('Error getting user stats:', error);
      return null;
    }
  }

  /**
   * Get user activity history
   * @param {string} userEmail - User's email
   * @param {number} limit - Number of actions to retrieve
   * @returns {Array} User action history
   */
  static async getUserActivity(userEmail, limit = 50) {
    try {
      const actions = await UserAction.filter(
        { user_email: userEmail }, 
        "-created_at", 
        limit
      );
      return actions;
    } catch (error) {
      console.error('Error getting user activity:', error);
      return [];
    }
  }
}