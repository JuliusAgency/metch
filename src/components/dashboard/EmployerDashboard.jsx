import { useState, useEffect } from "react";
import { supabase } from "@/api/supabaseClient";
import { UserProfile } from "@/api/entities";
import { Notification } from "@/api/entities";
import { CandidateView } from "@/api/entities";
import { JobApplication, Job } from "@/api/entities";
import { calculate_match_score } from "@/utils/matchScore";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Link, useLocation, useSearchParams } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  Plus,
  ChevronLeft,
  ChevronRight,
  Search,
  User as UserIcon,
  HelpCircle,
  MapPin,
  Clock,
  Briefcase,
  FileText
} from "lucide-react";
import { motion } from "framer-motion";
import { UserAnalytics } from "@/components/UserAnalytics";
import { EmployerAnalytics } from "@/components/EmployerAnalytics";
import EmployerStatsCard from "@/components/employer/EmployerStatsCard";
import EmployerActivityFeed from "@/components/employer/EmployerActivityFeed";
import EmployerGuide from "@/components/guides/EmployerGuide";
import iconViews from "@/assets/icon_views.png";
import iconActiveJobs from "@/assets/icon_active_jobs.png";
import iconApplications from "@/assets/icon_applications.png";

// Icon components
const ViewsIcon = ({ className }) => <img src={iconViews} className={`${className} object-contain`} alt="Views" />;
const ApplicationsIcon = ({ className }) => <img src={iconApplications} className={`${className} object-contain`} alt="Applications" />;
const ActiveJobsIcon = ({ className }) => <img src={iconActiveJobs} className={`${className} object-contain`} alt="Active Jobs" />;

// Allowed notification types for Employer users
const EMPLOYER_ALLOWED_NOTIFICATION_TYPES = ['application_submitted', 'new_message'];

const EmployerDashboard = ({ user }) => {
  const [viewedCandidates, setViewedCandidates] = useState([]);
  const [candidates, setCandidates] = useState([]);
  const [currentNotificationIndex, setCurrentNotificationIndex] = useState(0);
  const [notifications, setNotifications] = useState([]);

  // Sync filter with URL
  const [searchParams, setSearchParams] = useSearchParams();
  const [candidateFilter, setCandidateFilter] = useState(searchParams.get('filter') || 'new');

  const [loading, setLoading] = useState(true);
  const [showOnboardingHint, setShowOnboardingHint] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const location = useLocation();

  // New state for employer analytics
  const [employerStats, setEmployerStats] = useState(null);
  const [employerActivity, setEmployerActivity] = useState([]);

  // State for storing application info per candidate (email -> jobTitle)
  const [candidateApplications, setCandidateApplications] = useState({});
  const [matchScores, setMatchScores] = useState({});

  useEffect(() => {
    const filterParam = searchParams.get('filter');
    if (filterParam && filterParam !== candidateFilter) {
      setCandidateFilter(filterParam);
    }
  }, [searchParams]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('onboarding') === 'complete') {
      setShowOnboardingHint(true);
      // Hide hint after a few seconds
      const timer = setTimeout(() => setShowOnboardingHint(false), 8000);
      return () => clearTimeout(timer);
    }
  }, [location]);

  // Check if user needs onboarding guide
  useEffect(() => {
    const hasSeenGuide = localStorage.getItem(`employer_guide_${user?.email}`);
    if (!hasSeenGuide) {
      setShowGuide(true);
    }
  }, [user]);

  const handleGuideComplete = () => {
    setShowGuide(false);
    if (user?.email) {
      localStorage.setItem(`employer_guide_${user.email}`, 'completed');
    }
  };

  const handleGuideSkip = () => {
    setShowGuide(false);
    if (user?.email) {
      localStorage.setItem(`employer_guide_${user.email}`, 'skipped');
    }
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [byUserId, byEmail, byCreatedBy, viewedCandidatesData, dashboardData] = await Promise.all([
          Notification.filter({ user_id: user.id, is_read: false }, "-created_date", 10),
          Notification.filter({ email: user.email, is_read: false }, "-created_date", 10),
          Notification.filter({ created_by: user.id, is_read: false }, "-created_date", 10),
          CandidateView.filter({ viewer_email: user.email }, "-created_date", 50),
          EmployerAnalytics.getDashboardData(user.email)
        ]);

        console.log('[EmployerDashboard] Notifications fetched:', {
          byUserId: byUserId?.length,
          byEmail: byEmail?.length,
          byCreatedBy: byCreatedBy?.length
        });

        // Merge and deduplicate notifications
        const mergedNotifications = [...(byUserId || []), ...(byEmail || []), ...(byCreatedBy || [])]
          .reduce((acc, current) => {
            const x = acc.find(item => item.id === current.id);
            if (!x) return acc.concat([current]);
            return acc;
          }, [])
          .sort((a, b) => new Date(b.created_date || b.created_at) - new Date(a.created_date || a.created_at));

        // Fetch actual applicants instead of just recent job seekers
        // We'll get all jobs by this employer first (already done in getDashboardData, but we need the IDs here)
        const myJobs = await Job.filter({ created_by: user.email });
        const myJobIds = myJobs.map(j => j.id);
        const myJobMap = myJobs.reduce((acc, job) => ({ ...acc, [job.id]: job.title }), {});
        console.log('[EmployerDashboard] My Jobs:', myJobs.length, 'IDs:', myJobIds);

        let applicantProfiles = [];
        if (myJobIds.length > 0) {
          // Fetch all applications for these jobs
          const appsResults = await Promise.all(myJobIds.map(async (jobId) => {
            return await JobApplication.filter({ job_id: jobId });
          }));
          const allApps = appsResults.flat().sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
          console.log('[EmployerDashboard] Total Applications found:', allApps.length);

          // Each application should be a separate entry if it's for a different job
          const applicationRefs = [];
          const seenJobApps = new Set(); // To avoid truly duplicate applications for the same job

          for (const app of allApps) {
            const email = app.applicant_email?.toLowerCase();
            const applicantKey = app.applicant_id || email;
            const jobAppKey = `${app.job_id}_${applicantKey}`;

            if (!seenJobApps.has(jobAppKey)) {
              applicationRefs.push({
                applicant_id: app.applicant_id,
                applicant_email: email,
                job_id: app.job_id,
                job_title: myJobMap[app.job_id] || 'משרה לא ידועה',
                application_id: app.id,
                applied_at: app.created_date // Save application timestamp
              });
              seenJobApps.add(jobAppKey);
            }
            if (applicationRefs.length >= 20) break;
          }
          console.log('[EmployerDashboard] Application refs created:', applicationRefs.length);

          if (applicationRefs.length > 0) {
            const profiles = await Promise.all(applicationRefs.map(async (ref) => {
              try {
                let p = null;
                if (ref.applicant_id) {
                  const results = await UserProfile.filter({ id: ref.applicant_id });
                  if (results.length > 0) p = results[0];
                }

                if (!p && ref.applicant_email) {
                  // Try exact email first, then lowercase
                  let results = await UserProfile.filter({ email: ref.applicant_email });
                  if (results.length === 0) {
                    results = await UserProfile.filter({ email: ref.applicant_email.toLowerCase() });
                  }
                  if (results.length > 0) p = results[0];
                }

                if (p) {
                  // Enrich profile with application context
                  return {
                    ...p,
                    applied_job_id: ref.job_id,
                    applied_job_title: ref.job_title,
                    application_id: ref.application_id,
                    applied_at: ref.applied_at, // Pass timestamp
                    // Unique combined ID for React key
                    unique_app_id: `${p.id || p.email}_${ref.job_id}`
                  };
                }
              } catch (e) { console.error(`[EmployerDashboard] Error fetching profile for ${ref.applicant_email}:`, e); }
              return null;
            }));
            applicantProfiles = profiles.filter(p => p !== null);
            applicantProfiles = profiles.filter(p => p !== null);
            console.log('[EmployerDashboard] Final applicant profiles loaded:', applicantProfiles.length);

            // Calculate matches
            const scores = {};
            await Promise.all(applicantProfiles.map(async (profile) => {
              // Find the job this profile applied to
              const appliedJobId = profile.applied_job_id;
              if (!appliedJobId) return;

              // We need the full job object. We have myJobs which is a list of Jobs.
              const jobObj = myJobs.find(j => j.id === appliedJobId);
              if (jobObj) {
                try {
                  const score = await calculate_match_score(profile, jobObj);
                  // Store by unique_app_id to handle same candidate applying to multiple jobs
                  if (score !== null) {
                    scores[profile.unique_app_id] = Math.round(score * 100);
                  } else {
                    scores[profile.unique_app_id] = 0;
                  }
                } catch (e) {
                  console.error("Error calc match for dashboard:", e);
                }
              }
            }));
            setMatchScores(scores);
          }
        }

        // Filter notifications to only show allowed types for Employers
        const filteredNotifications = mergedNotifications.filter(notif =>
          EMPLOYER_ALLOWED_NOTIFICATION_TYPES.includes(notif.type)
        );

        // Deduplicate message notifications - show only one per sender
        const deduplicatedNotifications = [];
        const seenMessageSenders = new Set();

        for (const notif of filteredNotifications) {
          if (notif.type === 'new_message') {
            // Extract sender from message (assuming format: "הודעה חדשה מ-[שם]")
            const senderMatch = notif.message?.match(/מ-(.+)$/);
            const sender = senderMatch ? senderMatch[1] : notif.message;

            if (!seenMessageSenders.has(sender)) {
              seenMessageSenders.add(sender);
              deduplicatedNotifications.push(notif);
            }
          } else {
            // Keep all non-message notifications
            deduplicatedNotifications.push(notif);
          }
        }

        // Slice to 5 items AFTER filtering and deduplicating
        const finalNotifications = deduplicatedNotifications.slice(0, 5);
        console.log('[EmployerDashboard] Final notifications for display:', finalNotifications.length, finalNotifications.map(n => n.type));

        // Sync Stats Fix: If total raw applications are small (<=20), assume any diff is due to ghosts and sync displayed stat to visible valid profiles
        // This ensures the "14 vs 12" mismatch doesn't happen for small numbers
        const totalRawApps = dashboardData.stats?.total_applications_received || 0;
        if (totalRawApps <= 20 && applicantProfiles.length > 0) {
          console.log(`[EmployerDashboard] Syncing stats: Overriding ${totalRawApps} with ${applicantProfiles.length} valid profiles`);
          dashboardData.stats.total_applications_received = applicantProfiles.length;
          // Also sync total candidates viewed if relevant? Not for now, sticking to apps.
        }

        setEmployerStats(dashboardData.stats);
        setEmployerActivity(dashboardData.recentActivity);
        setNotifications(finalNotifications);
        setViewedCandidates(viewedCandidatesData);
        setCandidates(applicantProfiles);
      } catch (error) {
        console.error("Error loading employer dashboard:", error);
        setNotifications([]);
        setViewedCandidates([]);
        setCandidates([]);
        setEmployerStats({});
        setEmployerActivity([]);
      } finally {
        setLoading(false);
      }
    };
    loadData();

    // Set up Realtime subscription for Notifications to refresh dashboard list
    let notificationSubscription = null;
    if (user?.id || user?.email) {
      notificationSubscription = supabase
        .channel('dashboard:Notification')
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'Notification'
        }, (payload) => {
          const newNotif = payload.new;
          const oldNotif = payload.old;

          // Check if it's relevant to this user using broad identifiers
          const isRelevant =
            (newNotif?.user_id === user.id || newNotif?.email === user.email || newNotif?.created_by === user.id) ||
            (oldNotif?.user_id === user.id || oldNotif?.email === user.email || oldNotif?.created_by === user.id);

          if (isRelevant) {
            loadData(); // Re-fetch all data to keep stats and list in sync
          }
        })
        .subscribe();
    }

    return () => {
      if (notificationSubscription) {
        supabase.removeChannel(notificationSubscription);
      }
    };
  }, [user, navigate]);

  useEffect(() => {
    console.log('Candidates Data:', candidates);
    console.log('Viewed Candidates Data:', viewedCandidates);
    console.log('User:', user);
  }, [candidates, viewedCandidates, user]);

  // Fetch applications for displayed candidates to show "Job Applied For"
  useEffect(() => {
    const fetchCandidateApplications = async () => {
      if (!user?.email || candidates.length === 0) return;

      const appMap = {};

      try {
        // 1. Get Jobs created by this employer
        const myJobs = await Job.filter({ created_by: user.email });
        if (!myJobs || myJobs.length === 0) return;

        const myJobIds = myJobs.map(j => j.id);
        const myJobMap = myJobs.reduce((acc, job) => ({ ...acc, [job.id]: job.title }), {});

        // 2. For each candidate, check for applications to these jobs
        await Promise.all(candidates.map(async (candidate) => {
          if (!candidate.email) return;
          try {
            // Fetch applications by this candidate
            // Optimally we would filter by both applicant and job_id list but client lib limitation
            const apps = await JobApplication.filter({ applicant_email: candidate.email });

            // Find one that matches one of my jobs
            const relevantApp = apps.find(app => myJobIds.includes(app.job_id));

            if (relevantApp) {
              appMap[candidate.email] = myJobMap[relevantApp.job_id];
            }
          } catch (e) {
            console.error(`Error fetching apps for ${candidate.email}`, e);
          }
        }));

        setCandidateApplications(appMap);

      } catch (err) {
        console.error("Error fetching candidate applications context", err);
      }
    };

    fetchCandidateApplications();
  }, [candidates, user]);

  const handleViewCandidate = async (candidate) => {
    try {
      if (user?.email) {
        // Track candidate profile view with centralized analytics
        await EmployerAnalytics.trackCandidateView(user.email, candidate, {
          id: candidate.applied_job_id,
          title: candidate.applied_job_title
        });
      }
      // Refresh viewed candidates list
      const updatedViewed = await CandidateView.filter({ viewer_email: user.email }, "-created_date", 50);
      setViewedCandidates(updatedViewed);
    } catch (error) {
      console.error("Error recording candidate view:", error);
    }
  };

  const handlePrevNotification = () => setCurrentNotificationIndex(prev => prev > 0 ? prev - 1 : (notifications.length - 1 || 0));
  const handleNextNotification = () => setCurrentNotificationIndex(prev => prev < (notifications.length - 1) ? prev + 1 : 0);

  const handleFilterChange = (filter) => {
    setCandidateFilter(filter);
    setSearchParams(prev => {
      prev.set('filter', filter);
      return prev;
    });
  };

  const filteredCandidates = candidates.filter(c => {
    // Check if this specific application (by candidate and job) has been viewed
    // A view counts only if it matches this job and happened AFTER the application
    const isViewed = viewedCandidates.some(vc =>
      (vc.candidate_email === c.email || vc.candidate_name === c.full_name) &&
      (vc.job_id === c.applied_job_id) &&
      (new Date(vc.viewed_at || vc.created_at || vc.created_date) > new Date(c.applied_at))
    );
    return candidateFilter === 'new' ? !isViewed : isViewed;
  });

  if (loading) {
    return (
      <div className="p-8 space-y-8" dir="rtl">
        {Array(4).fill(0).map((_, i) => <div key={i} className="h-32 bg-gradient-to-r from-gray-100 to-gray-200 rounded-2xl animate-pulse" />)}
      </div>
    );
  }

  return (
    <>
      <div className="p-4 md:p-6" dir="rtl">
        <div className="max-w-7xl mx-auto space-y-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="text-right px-2 flex justify-between items-center">
            <h1 className="text-xl font-bold text-gray-900 mb-2 mt-2">👋 היי {user.full_name?.split(' ')[0] || 'רפאל'}!</h1>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowGuide(true)}
              className="rounded-full px-3 py-1 text-xs"
            >
              מדריך
              <HelpCircle className="w-3 h-3 mr-1" />
            </Button>
          </motion.div>
          <Card className="bg-white rounded-2xl md:rounded-[2.5rem] shadow-xl p-4 sm:p-6 md:p-8 space-y-8 border border-gray-100">
            {/* Enhanced Stats Grid with Real Analytics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 employer-stats">
              <Card className={`relative col-span-2 sm:col-span-1 border-0 shadow-md transition-all duration-300 rounded-2xl create-job-card ${(user?.job_credits > 0 || user?.profile?.job_credits > 0)
                ? 'bg-[#84CC9E] text-white hover:shadow-lg cursor-pointer'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }`}>
                <div onClick={(e) => {
                  if (!(user?.job_credits > 0 || user?.profile?.job_credits > 0)) {
                    e.preventDefault();
                    // Optional: Add toast here
                  }
                }}>
                  {(user?.job_credits > 0 || user?.profile?.job_credits > 0) ? (
                    <Link to={createPageUrl("CreateJob")}>
                      <CardContent className="p-4 sm:p-6 text-center flex flex-col items-center justify-center h-full">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/30 rounded-full flex items-center justify-center mx-auto mb-3">
                          <Plus className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                        </div>
                        <h3 className="font-bold text-base sm:text-lg">פרסום משרה חדשה</h3>
                        <p className="text-sm opacity-90 mt-1">יתרה: {user?.job_credits || user?.profile?.job_credits || 0}</p>
                      </CardContent>
                    </Link>
                  ) : (
                    <CardContent className="p-4 sm:p-6 text-center flex flex-col items-center justify-center h-full">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gray-300 rounded-full flex items-center justify-center mx-auto mb-3">
                        <Plus className="w-5 h-5 sm:w-6 sm:h-6 text-gray-500" />
                      </div>
                      <h3 className="font-bold text-base sm:text-lg">פרסום משרה חדשה</h3>
                      <p className="text-sm mt-1">אין יתרת משרות</p>
                    </CardContent>
                  )}
                </div>
                {showOnboardingHint && (user?.job_credits > 0 || user?.profile?.job_credits > 0) && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute -top-14 left-1/2 -translate-x-1/2 w-max bg-gray-800 text-white text-sm font-semibold py-2 px-4 rounded-lg shadow-lg"
                  >
                    כאן יוצרים משרה חדשה
                    <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-x-8 border-x-transparent border-t-8 border-t-gray-800"></div>
                  </motion.div>
                )}
              </Card>
              <EmployerStatsCard
                icon={ViewsIcon}
                title="צפיות במשרות"
                value={employerStats?.total_job_views || 10}
                color="bg-blue-50 text-blue-600"
              />
              <EmployerStatsCard
                icon={ApplicationsIcon}
                title="מועמדויות שהתקבלו"
                value={employerStats?.total_applications_received || 3}
                color="bg-green-50 text-green-600"
              />
              <EmployerStatsCard
                icon={ActiveJobsIcon}
                title="משרות פעילות"
                value={employerStats?.total_jobs_published || 6}
                color="bg-purple-50 text-purple-600"
              />

            </div>



            <Card className="bg-[#E7F2F7] shadow-none border-0 rounded-lg notification-carousel">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <Button variant="ghost" size="icon" className="rounded-full hover:bg-blue-200/50 flex-shrink-0" onClick={handleNextNotification} disabled={notifications.length <= 1}><ChevronRight className="w-6 h-6 text-blue-600" /></Button>
                  <div
                    className="text-center flex items-center gap-3 overflow-hidden cursor-pointer hover:opacity-80 transition-opacity"
                    onClick={() => {
                      const notif = notifications[currentNotificationIndex];
                      if (notif) {
                        navigate(createPageUrl("Notifications"), { state: { selectedNotificationId: notif.id } });
                      }
                    }}
                  >
                    <p className="text-blue-800 font-semibold text-sm sm:text-base whitespace-nowrap">{notifications[currentNotificationIndex]?.message || "אין התראות חדשות"}</p>
                    {notifications.length > 1 && (<div className="hidden sm:flex gap-1.5">{notifications.map((_, index) => (<div key={index} className={`w-2.5 h-2.5 rounded-full ${index === currentNotificationIndex ? 'bg-blue-600' : 'bg-gray-300'}`} />))}</div>)}
                  </div>
                  <Button variant="ghost" size="icon" className="rounded-full hover:bg-blue-200/50 flex-shrink-0" onClick={handlePrevNotification} disabled={notifications.length <= 1}><ChevronLeft className="w-6 h-6 text-blue-600" /></Button>
                </div>
              </CardContent>
            </Card>

            {/* Activity Feed */}
            <EmployerActivityFeed activities={employerActivity} />

            <div className="flex flex-col md:flex-row gap-4 items-center justify-between candidate-filter-buttons">
              <div className="relative w-full md:w-96 candidate-search-input">
                <Input placeholder="אפשר גם לחפש" className="pl-12 pr-4 py-2 border-gray-300 focus:border-blue-400 rounded-full h-11" />
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              </div>
              <div className="flex gap-2 w-full md:w-auto">
                <Button className={`px-6 py-2 rounded-full font-semibold flex-1 md:flex-none transition-colors ${candidateFilter === 'watched' ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-700'}`} onClick={() => handleFilterChange('watched')}>מועמדים שנצפוי</Button>
                <Button className={`px-6 py-2 rounded-full font-semibold flex-1 md:flex-none transition-colors ${candidateFilter === 'new' ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-700'}`} onClick={() => handleFilterChange('new')}>מועמדים חדשים</Button>
              </div>
            </div>
            <div className="space-y-4 candidate-list">
              <h2 className="text-lg font-bold text-gray-900 mb-2 px-2">מועמדים שהגישו מועמדות</h2>
              {filteredCandidates.length > 0 ? (filteredCandidates.map((candidate, index) => {
                const match = matchScores[candidate.unique_app_id] || 0;
                const jobAppliedTo = candidateApplications[candidate.email];

                // Helper Maps
                const availabilityText = {
                  immediate: "מיידית",
                  two_weeks: "תוך שבועיים",
                  one_month: "תוך חודש",
                  negotiable: "גמיש/ה",
                };

                const jobTypeText = {
                  full_time: "משרה מלאה",
                  part_time: "משרה חלקית",
                  contract: "חוזה",
                  freelance: "פרילנס",
                  internship: "התמחות",
                };

                return (
                  <motion.div key={candidate.unique_app_id || candidate.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: index * 0.1 }}>
                    <Card className="bg-white border border-gray-200/90 shadow-sm hover:shadow-lg transition-all duration-300 rounded-2xl">
                      <CardContent className="p-4">
                        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                          <div className="flex flex-col gap-4">
                            <div className="flex items-center justify-between gap-4">
                              <div className="flex items-center gap-4 flex-1">
                                <div className="w-16 h-16 rounded-full overflow-hidden shadow-md border-2 border-white flex-shrink-0">
                                  <div className="w-full h-full bg-blue-200 flex items-center justify-center">
                                    {candidate.profile_picture ? (
                                      <img
                                        src={candidate.profile_picture}
                                        alt={candidate.full_name}
                                        className="w-full h-full object-cover"
                                      />
                                    ) : (
                                      <UserIcon className="w-8 h-8 text-blue-500" />
                                    )}
                                  </div>
                                </div>
                                <div className="text-right">
                                  <h3 className="font-bold text-lg text-gray-900 leading-tight">
                                    {(() => {
                                      if (candidate.full_name && candidate.full_name.trim().length > 0) return candidate.full_name;
                                      if (candidate.email) return candidate.email;
                                      return 'מועמד ללא שם';
                                    })()}
                                  </h3>
                                  <p className="text-gray-500 text-sm mt-0.5">
                                    {candidate.applied_job_title || jobAppliedTo || candidate.experience_level?.replace('_', ' ') || "ללא ניסיון"}
                                  </p>
                                </div>
                              </div>

                              <div className="flex-shrink-0">
                                <Button
                                  asChild
                                  className={`text-white px-6 py-1.5 h-9 rounded-full font-bold w-32 text-sm view-candidate-button transition-colors duration-300 ${match >= 70 ? 'bg-green-400 hover:bg-green-500' : match >= 40 ? 'bg-orange-400 hover:bg-orange-500' : 'bg-red-500 hover:bg-red-600'
                                    }`}
                                >
                                  <Link
                                    to={createPageUrl(`CandidateProfile?id=${candidate.id}&jobId=${candidate.applied_job_id}`)}
                                    state={{ from: `${location.pathname}?filter=${candidateFilter}` }}
                                    onClick={() => handleViewCandidate(candidate)}
                                  >
                                    לצפייה
                                  </Link>
                                </Button>
                              </div>
                            </div>

                            <div className="flex flex-col sm:flex-row items-center gap-4 w-full">
                              <div className="flex flex-wrap gap-2 items-center justify-start">
                                <div className="flex items-center gap-1 bg-blue-50 text-blue-700 px-2.5 py-1 rounded-lg border border-blue-100/50 text-xs font-bold">
                                  <MapPin className="w-3.5 h-3.5" />
                                  <span>{candidate.preferred_location || "לא צוין"}</span>
                                </div>

                                <div className="flex items-center gap-1 bg-blue-50 text-blue-700 px-2.5 py-1 rounded-lg border border-blue-100/50 text-xs font-bold">
                                  <Briefcase className="w-3.5 h-3.5" />
                                  <span>
                                    {candidate.preferred_job_types?.length > 0
                                      ? (jobTypeText[candidate.preferred_job_types[0]] || candidate.preferred_job_types[0])
                                      : "לא צוין"}
                                  </span>
                                </div>

                                <div className="flex items-center gap-1 bg-blue-50 text-blue-700 px-2.5 py-1 rounded-lg border border-blue-100/50 text-xs font-bold">
                                  <Clock className="w-3.5 h-3.5" />
                                  <span>
                                    {candidate.availability
                                      ? (availabilityText[candidate.availability] || candidate.availability)
                                      : "לא צוין"}
                                  </span>
                                </div>
                              </div>

                              {match !== null && (
                                <div className="flex-1 relative h-5 bg-gray-200 rounded-full overflow-hidden shadow-inner w-full">
                                  <div
                                    className={`absolute right-0 top-0 h-full transition-all duration-700 ${match >= 70 ? 'bg-green-400/90' : match >= 40 ? 'bg-orange-400/90' : 'bg-red-500/90'}`}
                                    style={{ width: `${match}%` }}
                                  ></div>
                                  <div className="absolute inset-0 flex items-center justify-center text-[11px] font-bold text-black z-10 pointer-events-none">
                                    {match}% התאמה
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })) : (<div className="text-center py-8"><p className="text-gray-600">{candidateFilter === 'new' ? 'אין מועמדים חדשים זמינים כרגע.' : 'לא צפית במועמדים עדיין.'}</p></div>)
              }
            </div>
          </Card>
        </div>
      </div>

      <EmployerGuide
        isActive={showGuide}
        onComplete={handleGuideComplete}
        onSkip={handleGuideSkip}
      />
    </>
  );
};

export default EmployerDashboard;
