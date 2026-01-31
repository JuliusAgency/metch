import { UserAction, UserStats, JobView, Notification, JobApplication } from '@/api/entities';

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
   * @param {Object} user - User object {id, email}
   * @param {string} actionType - Type of action performed
   * @param {Object} actionData - Additional data about the action
   */
  static async trackAction(user, actionType, actionData = {}) {
    if (!user || (!user.email && !user.id)) {
      console.warn('UserAnalytics: No valid user provided for tracking');
      return;
    }

    try {
      const sessionId = this.initSession();

      // Record the action
      const actionRecord = {
        user_id: user.id, // Prefer ID
        user_email: user.email,
        action_type: actionType,
        session_id: sessionId,
        user_agent: navigator.userAgent,
        additional_data: actionData,
        ...actionData // Spread job data if provided
      };

      await UserAction.create(actionRecord);

      // Update user stats
      await this.updateUserStats(user, actionType, actionData);


    } catch (error) {
      console.error('Error tracking user action:', error);
    }
  }

  /**
   * Update aggregated user statistics
   * @param {Object} user - User object {id, email}
   * @param {string} actionType - Type of action performed
   * @param {Object} actionData - Additional data about the action
   */
  static async updateUserStats(user, actionType, actionData = {}) {
    try {
      // Get existing stats or create new ones
      // Priority: Filter by ID if available
      let existingStats = [];
      if (user.id) {
        existingStats = await UserStats.filter({ user_id: user.id });
      } else if (user.email) {
        existingStats = await UserStats.filter({ user_email: user.email });
      }

      let stats = existingStats.length > 0 ? existingStats[0] : {
        user_id: user.id,
        user_email: user.email,
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

      // Ensure ID is set on create
      if (!stats.user_id && user.id) stats.user_id = user.id;

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
  static async trackJobMatch(user, job, matchScore = null) {
    return this.trackAction(user, 'job_match', {
      job_id: job.id,
      job_title: job.title,
      job_company: job.company,
      match_score: matchScore || job.match_score
    });
  }

  /**
   * Track job detail view
   */
  static async trackJobView(user, job) {
    try {
      // Track the analytics event
      await this.trackAction(user, 'job_view', {
        job_id: job.id,
        job_title: job.title,
        job_company: job.company,
        match_score: job.match_score
      });

      // Create persistent JobView record if it doesn't exist
      let existingViews = [];
      if (user.id) {
        existingViews = await JobView.filter({
          viewer_id: user.id,
          job_id: job.id
        });
      } else if (user.email) {
        existingViews = await JobView.filter({
          user_email: user.email,
          job_id: job.id
        });
      }

      if (existingViews.length === 0) {
        await JobView.create({
          viewer_id: user.id,
          user_email: user.email,
          job_id: job.id
        });

        /* 
        // Track notification for employer - Disabled as per request to refine notifications
        try {
          if (job.created_by || job.employer_id) {
            await Notification.create({
              type: 'job_view',
              user_id: job.employer_id || job.created_by,
              email: job.created_by,
              created_by: job.employer_id || job.created_by,
              title: 'מישהו צפה במשרה שלך',
              message: `מועמד צפה במשרת ${job.title}`,
              is_read: 'false',
              created_date: new Date().toISOString()
            });
          }
        } catch (notifErr) {
          console.error('Error creating job_view notification:', notifErr);
        }
        */
      }
    } catch (error) {
      console.error('Error tracking job view:', error);
      console.error('Error details:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint
      });

    }
  }

  /**
   * Track job application
   */
  static async trackJobApplication(user, job) {
    return this.trackAction(user, 'job_apply', {
      job_id: job.id,
      job_title: job.title,
      job_company: job.company,
      match_score: job.match_score
    });
  }

  /**
   * Track job rejection
   */
  static async trackJobRejection(user, job, reason = null) {
    return this.trackAction(user, 'job_reject', {
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
  static async trackJobSave(user, job) {
    return this.trackAction(user, 'job_save', {
      job_id: job.id,
      job_title: job.title,
      job_company: job.company,
      match_score: job.match_score
    });
  }

  /**
   * Track job unsave/unbookmark
   */
  static async trackJobUnsave(user, job) {
    return this.trackAction(user, 'job_unsave', {
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
  static async getUserStats(userId) {
    try {
      const stats = await UserStats.filter({ user_id: userId }); // Change to user_id
      return stats.length > 0 ? stats[0] : null;
    } catch (error) {
      console.error('Error getting user stats:', error);
      return null;
    }
  }

  /**
   * Get comprehensive dashboard data for job seekers
   * @param {string} userId - User's ID
   * @param {string} userEmail - User's email
   */
  static async getUserDashboardData(userId, userEmail) {
    try {
      const [stats, applications, profileViewNotifications] = await Promise.all([
        this.getUserStats(userId),
        JobApplication.filter({ applicant_email: userEmail }),
        Notification.filter({ created_by: userId, type: 'profile_view' })
      ]);

      const mergedStats = {
        ...(stats || {
          total_jobs_viewed: 0,
          total_applications_sent: applications.length,
          total_messages_sent: 0,
          total_profile_views: profileViewNotifications.length
        }),
        total_applications_sent: applications.length,
        total_profile_views: profileViewNotifications.length
      };

      return {
        stats: mergedStats,
        applications: applications
      };
    } catch (error) {
      console.error('Error getting user dashboard data:', error);
      return {
        stats: {
          total_jobs_viewed: 0,
          total_applications_sent: 0,
          total_profile_views: 0
        },
        applications: []
      };
    }
  }

  /**
   * Get user activity history
   * @param {string} userEmail - User's email
   * @param {number} limit - Number of actions to retrieve
   * @returns {Array} User action history
   */
  static async getUserActivity(userId, limit = 50) {
    try {
      const actions = await UserAction.filter(
        { user_id: userId }, // Change to user_id
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