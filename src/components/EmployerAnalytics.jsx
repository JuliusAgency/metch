import { EmployerAction } from '@/api/entities';
import { EmployerStats } from '@/api/entities';
import { Job } from '@/api/entities';
import { JobApplication } from '@/api/entities';
import { JobView } from '@/api/entities';

/**
 * Utility class for tracking employer actions and updating analytics
 */
export class EmployerAnalytics {
  static sessionId = null;

  /**
   * Initialize session ID for grouping related actions
   */
  static initSession() {
    if (!this.sessionId) {
      this.sessionId = `employer_session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    return this.sessionId;
  }

  /**
   * Track an employer action and update stats
   * @param {string} employerEmail - Employer's email
   * @param {string} actionType - Type of action performed
   * @param {Object} actionData - Additional data about the action
   */
  static async trackAction(employerEmail, actionType, actionData = {}) {
    if (!employerEmail) {
      console.warn('EmployerAnalytics: No employer email provided for tracking');
      return;
    }

    try {
      const sessionId = this.initSession();

      // Record the action
      const actionRecord = {
        employer_email: employerEmail,
        action_type: actionType,
        session_id: sessionId,
        user_agent: navigator.userAgent,
        additional_data: actionData
      };

      await EmployerAction.create(actionRecord);

      // Update employer stats
      await this.updateEmployerStats(employerEmail, actionType, actionData);


    } catch (error) {
      console.error('Error tracking employer action:', error);
    }
  }

  /**
   * Update aggregated employer statistics
   * @param {string} employerEmail - Employer's email
   * @param {string} actionType - Type of action performed
   * @param {Object} actionData - Additional data about the action
   */
  static async updateEmployerStats(employerEmail, actionType, actionData = {}) {
    try {
      // Get existing stats or create new ones
      const existingStats = await EmployerStats.filter({ employer_email: employerEmail });
      let stats = existingStats.length > 0 ? existingStats[0] : {
        employer_email: employerEmail,
        total_jobs_created: 0,
        total_jobs_published: 0,
        total_job_views: 0,
        total_applications_received: 0,
        total_candidates_viewed: 0,
        total_messages_sent: 0,
        jobs_filled: 0,
        jobs_filled_via_metch: 0
      };

      // Update based on action type
      switch (actionType) {
        case 'job_create':
          stats.total_jobs_created = (stats.total_jobs_created || 0) + 1;
          break;
        case 'job_publish':
          stats.total_jobs_published = (stats.total_jobs_published || 0) + 1;
          break;
        case 'job_view':
          stats.total_job_views = (stats.total_job_views || 0) + 1;
          break;
        case 'candidate_view':
          stats.total_candidates_viewed = (stats.total_candidates_viewed || 0) + 1;
          break;
        case 'application_review':
          stats.total_applications_received = (stats.total_applications_received || 0) + 1;
          break;
        case 'message_send':
          stats.total_messages_sent = (stats.total_messages_sent || 0) + 1;
          break;
        case 'job_close':
          if (actionData.status === 'filled') {
            stats.jobs_filled = (stats.jobs_filled || 0) + 1;
          } else if (actionData.status === 'filled_via_metch') {
            stats.jobs_filled_via_metch = (stats.jobs_filled_via_metch || 0) + 1;
          }
          break;
      }

      // Calculate conversion rate if we have both views and applications
      if (stats.total_job_views > 0 && stats.total_applications_received > 0) {
        stats.conversion_rate = (stats.total_applications_received / stats.total_job_views * 100).toFixed(2);
      }

      // Update last activity date
      stats.last_activity_date = new Date().toISOString();

      // Update or create stats record
      if (existingStats.length > 0) {
        await EmployerStats.update(stats.id, stats);
      } else {
        await EmployerStats.create(stats);
      }

    } catch (error) {
      console.error('Error updating employer stats:', error);
    }
  }

  /**
   * Track job creation
   */
  static async trackJobCreate(employerEmail, job) {
    return this.trackAction(employerEmail, 'job_create', {
      job_id: job.id,
      job_title: job.title,
      job_category: job.category,
      employment_type: job.employment_type
    });
  }

  /**
   * Track job publishing (making it active)
   */
  static async trackJobPublish(employerEmail, job) {
    return this.trackAction(employerEmail, 'job_publish', {
      job_id: job.id,
      job_title: job.title,
      job_category: job.category
    });
  }

  /**
   * Track job editing
   */
  static async trackJobEdit(employerEmail, job) {
    return this.trackAction(employerEmail, 'job_edit', {
      job_id: job.id,
      job_title: job.title
    });
  }

  /**
   * Track job status changes
   */
  static async trackJobStatusChange(employerEmail, job, oldStatus, newStatus) {
    return this.trackAction(employerEmail, 'job_close', {
      job_id: job.id,
      job_title: job.title,
      old_status: oldStatus,
      status: newStatus
    });
  }

  /**
   * Track job view by employer (for analytics dashboard)
   */
  static async trackJobView(employerEmail, job) {
    return this.trackAction(employerEmail, 'job_view', {
      job_id: job.id,
      job_title: job.title
    });
  }

  /**
   * Track candidate profile view
   */
  static async trackCandidateView(employerEmail, candidate, jobContext = null) {
    return this.trackAction(employerEmail, 'candidate_view', {
      candidate_email: candidate.email,
      candidate_name: candidate.full_name,
      job_id: jobContext?.id,
      job_title: jobContext?.title
    });
  }

  /**
   * Track application review
   */
  static async trackApplicationReview(employerEmail, application) {
    return this.trackAction(employerEmail, 'application_review', {
      job_id: application.job_id,
      candidate_email: application.applicant_email,
      application_status: application.status
    });
  }

  /**
   * Track candidate rejection/not relevant
   */
  static async trackCandidateRejection(employerEmail, candidate, jobContext = null) {
    return this.trackAction(employerEmail, 'candidate_reject', {
      candidate_email: candidate.email,
      candidate_name: candidate.full_name,
      job_id: jobContext?.id,
      job_title: jobContext?.title
    });
  }

  /**
   * Track message sent to candidate
   */
  static async trackMessageSent(employerEmail, candidateEmail, jobContext = null) {
    return this.trackAction(employerEmail, 'message_send', {
      candidate_email: candidateEmail,
      job_id: jobContext?.id,
      job_title: jobContext?.title
    });
  }

  /**
   * Get employer statistics
   * @param {string} employerEmail - Employer's email
   * @returns {Object} Employer statistics
   */
  static async getEmployerStats(employerEmail) {
    try {
      const stats = await EmployerStats.filter({ employer_email: employerEmail });
      return stats.length > 0 ? stats[0] : null;
    } catch (error) {
      console.error('Error getting employer stats:', error);
      return null;
    }
  }

  /**
   * Get employer activity history
   * @param {string} employerEmail - Employer's email
   * @param {number} limit - Number of actions to retrieve
   * @returns {Array} Employer action history
   */
  static async getEmployerActivity(employerEmail, limit = 50) {
    try {
      const actions = await EmployerAction.filter(
        { employer_email: employerEmail },
        "-created_date",
        limit
      );
      return actions;
    } catch (error) {
      console.error('Error getting employer activity:', error);
      return [];
    }
  }

  /**
   * Get comprehensive employer dashboard data
   * @param {string} employerEmail - Employer's email
   * @returns {Object} Dashboard data including stats and recent activity
   */
  static async getDashboardData(employerEmail) {
    try {
      // 1. Get all jobs by this employer
      const allJobs = await Job.filter({ created_by: employerEmail });
      const jobIds = allJobs.map(job => job.id);
      const activeJobsCount = allJobs.filter(job => job.status === 'active').length;

      // 2. Fetch stats and activity
      const [stats, recentActivity] = await Promise.all([
        this.getEmployerStats(employerEmail),
        this.getEmployerActivity(employerEmail, 10)
      ]);

      // 3. Robustly count applications and views by querying and summing if needed
      let realTotalApplications = 0;
      let realPendingApplications = 0;
      let realTotalJobViews = 0;

      if (jobIds.length > 0) {
        // We fetch per job to stay within filter limits and ensure accuracy
        const [appsResults, viewsResults] = await Promise.all([
          Promise.all(jobIds.map(async (jobId) => {
            return await JobApplication.filter({ job_id: jobId });
          })),
          Promise.all(jobIds.map(async (jobId) => {
            return await JobView.filter({ job_id: jobId });
          }))
        ]);

        const allRelevantApps = appsResults.flat();
        realTotalApplications = allRelevantApps.length;

        realPendingApplications = allRelevantApps.filter(app => app.status === 'pending').length;

        // Calculate unique candidates count
        const uniqueCandidateEmails = new Set(allRelevantApps.map(app => app.applicant_email));
        var realUniqueCandidates = uniqueCandidateEmails.size;

        const allRelevantViews = viewsResults.flat();
        realTotalJobViews = allRelevantViews.length;
      }

      // Merge manual stats with real-time counts
      const mergedStats = {
        ...(stats || {
          total_jobs_created: allJobs.length,
          total_jobs_published: activeJobsCount,
          total_candidates_viewed: 0,
        }),
        total_applications_received: realTotalApplications, // Override with real-time count
        unique_candidates_count: realUniqueCandidates, // Add unique candidates count
        total_job_views: realTotalJobViews, // Override with real-time count
        total_jobs_published: activeJobsCount // Ensure this is also accurate
      };

      return {
        stats: mergedStats,
        recentActivity,
        activeJobs: activeJobsCount,
        recentApplications: realTotalApplications,
        pendingApplications: realPendingApplications
      };
    } catch (error) {
      console.error('Error getting employer dashboard data:', error);
      return {
        stats: {},
        recentActivity: [],
        activeJobs: 0,
        recentApplications: 0,
        pendingApplications: 0
      };
    }
  }
}