import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { useUser } from "@/contexts/UserContext";
import ToggleSwitch from "@/components/dashboard/ToggleSwitch";
import { useRequireUserType } from "@/hooks/use-require-user-type";
import { Job, JobView, Notification, UserProfile, CandidateView } from "@/api/entities";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Briefcase,
  Eye,
  FileText,
  User as UserIcon,
  Bell,
  HelpCircle,
  ChevronLeft,
  ChevronRight,
  Search,
  MapPin,
  Clock,
  Users,
  TrendingUp,
  CheckCircle,
  Plus
} from "lucide-react";
import { motion } from "framer-motion";
import { createPageUrl } from "@/utils";
import { UserAnalytics } from "@/components/UserAnalytics";
import { EmployerAnalytics } from "@/components/EmployerAnalytics";
import EmployerStatsCard from "@/components/employer/EmployerStatsCard";
import EmployerActivityFeed from "@/components/employer/EmployerActivityFeed";
import JobSeekerGuide from "@/components/guides/JobSeekerGuide";
import EmployerGuide from "@/components/guides/EmployerGuide";
import CareerStageModal from "@/components/dashboard/CareerStageModal";
import { calculate_match_score } from "@/utils/matchScore";
const EMPLOYER_ALLOWED_NOTIFICATION_TYPES = ['application_submitted', 'new_message'];

// --- JOB SEEKER DASHBOARD COMPONENT (New) ---
import iconJsRelevantJobs from "@/assets/icon_js_relevant_jobs.png";
import iconJsApplications from "@/assets/icon_js_applications.png";
import iconJsCv from "@/assets/icon_js_cv.png";
import iconJsProfileViews from "@/assets/icon_js_profile_views.png";

const JsRelevantJobsIcon = ({ className }) => <img src={iconJsRelevantJobs} className={`${className} object-contain`} alt="Relevant Jobs" />;
const JsApplicationsIcon = ({ className }) => <img src={iconJsApplications} className={`${className} object-contain`} alt="Applications" />;
const JsCvIcon = ({ className }) => <img src={iconJsCv} className={`${className} object-contain`} alt="CVs" />;
const JsProfileViewsIcon = ({ className }) => <img src={iconJsProfileViews} className={`${className} object-contain`} alt="Profile Views" />;

const JobSeekerDashboard = ({ user }) => {
  const [jobFilter, setJobFilter] = useState('new');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentNotificationIndex, setCurrentNotificationIndex] = useState(0);
  const [allJobs, setAllJobs] = useState([]); // Renamed 'jobs' to 'allJobs'
  const [viewedJobIds, setViewedJobIds] = useState(new Set()); // New state for viewed job IDs
  const [loading, setLoading] = useState(true);
  const [showGuide, setShowGuide] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [userStats, setUserStats] = useState(null);
  const [showCareerModal, setShowCareerModal] = useState(false);
  const [hasCV, setHasCV] = useState(true); // Default to true to avoid flickers
  const navigate = useNavigate();

  // Check for onboarding triggers - MOVED AFTER GUARDS CHECK
  useEffect(() => {
    // Wait for initial loading and User check
    if (loading || !user) return;

    // GUARD: If user doesn't have CV or Specialization, they shouldn't see these modals
    // because they will be redirected by the other useEffect (or logic below) shortly.
    // We check hasCV (state) and profile specialization.
    if (!hasCV) return; // Will be redirected

    // We access userProfile inside the effect or rely on 'user' object if it has merged profile data?
    // 'user' from useUser() has merged profile data.
    if (!user.specialization) return; // Will be redirected

    // 1. First priority: Career Stage
    if (!user.career_stage) {
      setShowCareerModal(true);
      return; // Wait for career stage before showing guide
    }

    // 2. Second priority: Site Guide
    const hasSeenGuide = localStorage.getItem(`jobseeker_guide_${user?.email}`);
    if (!hasSeenGuide) {
      setShowGuide(true);
    }
  }, [user, loading, hasCV]);

  const handleGuideComplete = () => {
    setShowGuide(false);
    if (user?.email) {
      localStorage.setItem(`jobseeker_guide_${user.email}`, 'completed');
    }
  };

  const handleCareerStageComplete = () => {
    setShowCareerModal(false);
    // After career stage, check if we need to show the guide
    const hasSeenGuide = localStorage.getItem(`jobseeker_guide_${user?.email}`);
    if (!hasSeenGuide) {
      setShowGuide(true);
    }
  };

  const handleGuideSkip = () => {
    setShowGuide(false);
    if (user?.email) {
      localStorage.setItem(`jobseeker_guide_${user.email}`, 'skipped');
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      if (!user) return;

      try {
        const results = await Promise.allSettled([
          Job.filter({ status: 'active' }, "-created_date", 50),
          JobView.filter({ user_email: user.email }),
          Notification.filter({ is_read: false, email: user.email }, "-created_date", 5),
          UserAnalytics.getUserStats(user.email),
          CandidateView.filter({ candidate_name: user.full_name }), // Get profile views for this job seeker
          UserProfile.filter({ email: user.email }).then(profiles => profiles[0] || null) // Get user profile
        ]);

        const jobsData = results[0].status === 'fulfilled' ? results[0].value : [];
        if (results[0].status === 'rejected') console.error("Jobs load failed", results[0].reason);

        const jobViewsData = results[1].status === 'fulfilled' ? results[1].value : [];
        const notificationsData = results[2].status === 'fulfilled' ? results[2].value : [];
        if (results[2].status === 'rejected') console.warn("Notifications load failed (400?)", results[2].reason);

        const statsData = results[3].status === 'fulfilled' ? results[3].value : null;
        const profileViewsData = results[4].status === 'fulfilled' ? results[4].value : [];
        const userProfile = results[5].status === 'fulfilled' ? results[5].value : null;

        // Calculate match scores for each job
        const jobsWithScores = await Promise.all(
          jobsData.map(async (job) => {
            let matchScore = null;
            if (userProfile) {
              try {
                const userSettings = {
                  prefers_no_career_change: userProfile.prefers_no_career_change || false
                };
                const score = await calculate_match_score(userProfile, job, userSettings);
                matchScore = score !== null ? Math.round(score * 100) : null; // Convert to percentage
              } catch (error) {
                console.error(`Error calculating match score for job ${job.id}:`, error);
              }
            }
            return {
              ...job,
              match_score: matchScore
            };
          })
        );

        // Enhance stats with profile views data
        const enhancedStats = statsData ? {
          ...statsData,
          profile_views: profileViewsData.length,
          resume_views: profileViewsData.length
        } : {
          profile_views: profileViewsData.length,
          resume_views: profileViewsData.length,
          total_applications: 0
        };

        setUserStats(enhancedStats);
        setAllJobs(jobsWithScores);
        setViewedJobIds(new Set(jobViewsData.map(view => view.job_id)));
        setNotifications(notificationsData);

        // Navigation guards for Job Seekers
        const cvs = await CV.filter({ user_email: user.email });
        if (cvs.length === 0) {
          setHasCV(false);
          navigate('/CVGenerator');
          return;
        }

        if (!userProfile?.specialization) {
          navigate('/PreferenceQuestionnaire');
          return;
        }

      } catch (error) {
        console.error("Error loading jobs for seeker:", error);
        setAllJobs([]);
        setViewedJobIds(new Set());
        setNotifications([]);
        setUserStats(null);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [user, navigate]);

  const StatCard = ({ icon: Icon, title, value }) => (
    <Card className="bg-white border border-gray-100 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] rounded-2xl h-full">
      <CardContent className="p-6 text-center flex flex-col items-center justify-center h-full">
        <div className="w-16 h-16 rounded-full border border-blue-200 flex items-center justify-center mb-4">
          <Icon className="w-8 h-8 object-contain" />
        </div>
        <p className="text-blue-900 font-bold text-base mb-2">{title}</p>
        <div className="text-3xl text-gray-500 font-normal">{value}</div>
      </CardContent>
    </Card>
  );

  const handlePrevNotification = () => setCurrentNotificationIndex(prev => prev > 0 ? prev - 1 : (notifications.length - 1 || 0));
  const handleNextNotification = () => setCurrentNotificationIndex(prev => prev < (notifications.length - 1) ? prev + 1 : 0);

  // Filter jobs based on the current jobFilter state and search term
  const displayedJobs = allJobs.filter(job => {
    // Text search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const matchesSearch =
        job.title?.toLowerCase().includes(term) ||
        job.company?.toLowerCase().includes(term) ||
        job.location?.toLowerCase().includes(term);

      if (!matchesSearch) return false;
    }

    if (jobFilter === 'new') {
      return !viewedJobIds.has(job.id);
    }
    if (jobFilter === 'viewed') {
      return viewedJobIds.has(job.id);
    }
    return true; // Should not happen with 'new'/'viewed' filters
  });
  const location = useLocation();

  useEffect(() => {
    if (!loading && location.hash && location.hash.startsWith('#job-')) {
      const scrollToTarget = () => {
        const element = document.querySelector(location.hash);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      };
      // Allow DOM to paint before scrolling
      requestAnimationFrame(scrollToTarget);
    }
  }, [loading, location.hash, displayedJobs.length]);

  return (
    <>
      <div className="max-w-7xl mx-auto space-y-6 pt-2 p-4 md:p-6">
        <div className="flex justify-between items-center px-4">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {user.full_name?.trim() ? `👋 היי ${user.full_name}!` : '👋 היי!'}
          </h1>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">התראות חדשות</span>
            <Bell className="w-5 h-5 text-yellow-500" />
          </div>
        </div>

        <div className="space-y-8">
          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 stats-grid">
            <StatCard icon={JsRelevantJobsIcon} title="משרות רלוונטיות" value={allJobs.length} />
            <StatCard icon={JsCvIcon} title="קו״ח שהגשת" value={userStats?.resume_views || userStats?.profile_views || 0} />
            <StatCard icon={JsApplicationsIcon} title="מועמדויות שהגשתי" value={userStats?.total_applications || 0} />
            <StatCard icon={JsProfileViewsIcon} title="צפו בכרטיס שלך" value={userStats?.profile_views || 0} />
          </div>

          {/* Notification Carousel */}
          <Card className="bg-[#E7F2F7] shadow-none border-0 rounded-lg notification-carousel">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <Button variant="ghost" size="icon" className="rounded-full hover:bg-blue-200/50 flex-shrink-0" onClick={handleNextNotification} disabled={notifications.length <= 1}><ChevronRight className="w-6 h-6 text-blue-600" /></Button>
                <div className="text-center flex items-center gap-3 overflow-hidden">
                  <p className="text-blue-800 font-semibold text-sm sm:text-base whitespace-nowrap">{notifications[currentNotificationIndex]?.message || "אין התראות חדשות"}</p>
                  {notifications.length > 1 && (<div className="hidden sm:flex gap-1.5">{notifications.map((_, index) => (<div key={index} className={`w-2.5 h-2.5 rounded-full ${index === currentNotificationIndex ? 'bg-blue-600' : 'bg-gray-300'}`} />))}</div>)}
                </div>
                <Button variant="ghost" size="icon" className="rounded-full hover:bg-blue-200/50 flex-shrink-0" onClick={handlePrevNotification} disabled={notifications.length <= 1}><ChevronLeft className="w-6 h-6 text-blue-600" /></Button>
              </div>
            </CardContent>
          </Card>

          {/* Filter Toggle */}
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="relative w-full md:w-96 job-search-input">
              <Input
                placeholder="אפשר גם לחפש"
                className="pl-12 pr-4 py-2 border-gray-300 focus:border-blue-400 rounded-full h-11"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            </div>
            <div className="flex justify-end w-full md:w-auto job-filter-buttons">
              <ToggleSwitch
                options={[
                  { value: 'viewed', label: 'משרות שצפית' },
                  { value: 'new', label: 'משרות חדשות' },
                ]}
                value={jobFilter}
                onChange={setJobFilter}
              />
            </div>
          </div>

          {/* Jobs List */}
          <div className="space-y-4 job-list">
            {loading ? (
              <div className="text-center py-8 text-gray-500">טוען משרות...</div>
            ) : displayedJobs.length > 0 ? ( // Changed to displayedJobs
              displayedJobs.map((job, index) => (
                <motion.div
                  key={job.id}
                  id={`job-${job.id}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <Card className="bg-white border border-gray-200/90 shadow-sm hover:shadow-lg transition-all duration-300 rounded-2xl p-4">
                    <div className="flex items-center justify-between gap-4">
                      <div className="w-16 h-16 rounded-full overflow-hidden shadow-md border-2 border-white flex-shrink-0">
                        <img src={job.company_logo_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(job.company)}&background=random`} alt={job.company} className="w-full h-full object-cover" />
                      </div>
                      <div className="text-right">
                        <h3 className="font-bold text-lg text-gray-900">{job.title}</h3>
                        <p className="text-gray-600 text-sm">{job.company}</p>
                        <div className="flex gap-4 text-xs text-gray-500 mt-1">
                          <span className="flex items-center gap-1"><MapPin className="w-3 h-3 ml-1" />{job.location}</span>
                          <span className="flex items-center gap-1"><Briefcase className="w-3 h-3 ml-1" />משרה מלאה</span>
                          <span className="flex items-center gap-1"><Clock className="w-3 h-3 ml-1" />{job.start_date || 'מיידי'}</span>
                        </div>
                      </div>
                      {job.match_score !== null && (
                        <div className="flex-1 text-right">
                          <div className="text-sm text-gray-600 mb-1.5">{job.match_score}% התאמה</div>
                          <div dir="ltr" className="w-full h-2.5 bg-gray-200 rounded-full overflow-hidden">
                            <div className={`h-full transition-all duration-500 ${job.match_score >= 80 ? 'bg-green-400' : 'bg-orange-400'}`} style={{ width: `${job.match_score}%` }}></div>
                          </div>
                        </div>
                      )}
                      <Button asChild className={`${viewedJobIds.has(job.id) ? 'bg-gray-400 hover:bg-gray-500' : 'bg-[#84CC9E] hover:bg-green-500'} text-white px-5 py-2 rounded-full font-bold w-28 view-job-button`}>
                        <Link
                          to={createPageUrl(`JobDetailsSeeker?id=${job.id}&from=Dashboard`)}
                          onClick={() => {
                            // Track job view when user clicks to view details
                            if (user?.email) {
                              UserAnalytics.trackJobView(user.email, job);
                            }
                          }}
                        >
                          {viewedJobIds.has(job.id) ? "נצפה" : "צפייה"}
                        </Link>
                      </Button>
                    </div>
                  </Card>
                </motion.div>
              ))
            ) : (
              // Updated empty state messages
              <div className="text-center py-8 text-gray-500">{jobFilter === 'new' ? 'אין משרות חדשות עבורך כרגע.' : 'עדיין לא צפית באף משרה.'}</div>
            )}
          </div>
        </div>
      </div>

      <JobSeekerGuide
        isActive={showGuide}
        onComplete={handleGuideComplete}
        onSkip={handleGuideSkip}
      />

      <CareerStageModal
        isOpen={showCareerModal}
        onComplete={handleCareerStageComplete}
      />
    </>
  );
};

// --- EMPLOYER DASHBOARD COMPONENT ---
import iconViews from "@/assets/icon_views.png";
import iconActiveJobs from "@/assets/icon_active_jobs.png";
import iconApplications from "@/assets/icon_applications.png";

// Icon components
const ViewsIcon = ({ className }) => <img src={iconViews} className={`${className} object-contain`} alt="Views" />;
const ApplicationsIcon = ({ className }) => <img src={iconApplications} className={`${className} object-contain`} alt="Applications" />;
const ActiveJobsIcon = ({ className }) => <img src={iconActiveJobs} className={`${className} object-contain`} alt="Active Jobs" />;

const EmployerDashboard = ({ user }) => {
  const [viewedCandidates, setViewedCandidates] = useState([]);
  const [candidates, setCandidates] = useState([]);
  const [currentNotificationIndex, setCurrentNotificationIndex] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [searchParams, setSearchParams] = useSearchParams();
  const [candidateFilter, setCandidateFilter] = useState(searchParams.get('filter') || 'new');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [showOnboardingHint, setShowOnboardingHint] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const filterParam = searchParams.get('filter');
    if (filterParam && filterParam !== candidateFilter) {
      setCandidateFilter(filterParam);
    }
  }, [searchParams]);

  const handleFilterChange = (val) => {
    setCandidateFilter(val);
    setSearchParams(prev => {
      prev.set('filter', val);
      return prev;
    });
  };

  // New state for employer analytics
  const [employerStats, setEmployerStats] = useState(null);
  const [employerActivity, setEmployerActivity] = useState([]);

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
      setLoading(true);
      try {
        const [notificationsData, viewedCandidatesData, candidatesData, dashboardData, activeJobsData] = await Promise.all([
          Notification.filter({ is_read: false, user_email: user.email }, "-created_date", 5),
          CandidateView.filter({ viewer_email: user.email }, "-created_date", 50),
          UserProfile.filter({ user_type: 'job_seeker' }, "-created_at", 10),
          EmployerAnalytics.getDashboardData(user.email),
          Job.filter({ created_by: user.email, status: 'active' })
        ]);

        // Filter notifications to only show allowed types for Employers
        const filteredNotifications = notificationsData.filter(notif =>
          EMPLOYER_ALLOWED_NOTIFICATION_TYPES.includes(notif.type)
        );

        // Enhance stats with real-time data
        const enhancedStats = {
          ...dashboardData.stats,
          total_jobs_published: activeJobsData.length, // Use actual active jobs count
          total_candidates_viewed: viewedCandidatesData.length, // Use actual viewed candidates count
          total_job_views: dashboardData.stats?.total_job_views || 0,
          total_applications_received: dashboardData.stats?.total_applications_received || 0,
          conversion_rate: dashboardData.stats?.conversion_rate || 0
        };

        setEmployerStats(enhancedStats);
        setEmployerActivity(dashboardData.recentActivity);
        setNotifications(filteredNotifications);
        setViewedCandidates(viewedCandidatesData);
        setCandidates(candidatesData);
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
  }, [user]);

  const handleViewCandidate = async (candidate) => {
    try {
      // Track candidate profile view
      if (user?.email) {
        await UserAnalytics.trackAction(user.email, 'profile_view', {
          candidate_name: candidate.full_name,
          candidate_email: candidate.email
        });
      }

      await CandidateView.create({
        candidate_name: candidate.full_name,
        candidate_role: candidate.experience_level || 'N/A',
        viewer_email: user.email,
        viewed_at: new Date().toISOString()
      });
      const updatedViewed = await CandidateView.filter({ viewer_email: user.email }, "-created_date", 50);
      setViewedCandidates(updatedViewed);
    } catch (error) {
      console.error("Error recording candidate view:", error);
    }
  };

  const handlePrevNotification = () => setCurrentNotificationIndex(prev => prev > 0 ? prev - 1 : (notifications.length - 1 || 0));
  const handleNextNotification = () => setCurrentNotificationIndex(prev => prev < (notifications.length - 1) ? prev + 1 : 0);

  const filteredCandidates = candidates.filter(c => {
    // Text search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const matchesSearch =
        c.full_name?.toLowerCase().includes(term) ||
        c.experience_level?.toLowerCase().replace('_', ' ').includes(term) ||
        c.skills?.some(skill => skill.toLowerCase().includes(term));

      if (!matchesSearch) return false;
    }

    const isViewed = viewedCandidates.some(vc => vc.candidate_name === c.full_name);
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
      <div className="max-w-7xl mx-auto space-y-6 pt-2 p-4 md:p-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="text-right px-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {user.company_name?.trim() ? `👋 היי ${user.company_name}!` : '👋 היי!'}
          </h1>

        </motion.div>

        <div className="space-y-8">
          {/* Enhanced Stats Grid with Real Analytics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 employer-stats">
            <EmployerStatsCard
              icon={ViewsIcon}
              title="צפיות במשרות"
              value={employerStats?.total_job_views || 0}
              color="bg-blue-50 text-blue-600"
            />
            <EmployerStatsCard
              icon={ApplicationsIcon}
              title="מועמדויות שהתקבלו"
              value={employerStats?.total_applications_received || 0}
              color="bg-green-50 text-green-600"
            />
            <EmployerStatsCard
              icon={ActiveJobsIcon}
              title="משרות פעילות"
              value={employerStats?.total_jobs_published || 0}
              color="bg-purple-50 text-purple-600"
            />
            <Card className="relative col-span-2 sm:col-span-1 bg-[#84CC9E] text-white border-0 shadow-md hover:shadow-lg transition-all duration-300 rounded-2xl create-job-card">
              <Link to={createPageUrl("CreateJob")}>
                <CardContent className="p-4 sm:p-6 text-center flex flex-col items-center justify-center h-full">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/30 rounded-full flex items-center justify-center mx-auto mb-3"><Plus className="w-5 h-5 sm:w-6 sm:h-6 text-white" /></div>
                  <h3 className="font-bold text-base sm:text-lg">פרסום משרה חדשה</h3>
                </CardContent>
              </Link>
              {showOnboardingHint && (
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
          </div>



          <Card className="bg-[#E7F2F7] shadow-none border-0 rounded-lg notification-carousel">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <Button variant="ghost" size="icon" className="rounded-full hover:bg-blue-200/50 flex-shrink-0" onClick={handleNextNotification} disabled={notifications.length <= 1}><ChevronRight className="w-6 h-6 text-blue-600" /></Button>
                <div className="text-center flex items-center gap-3 overflow-hidden">
                  <p className="text-blue-800 font-semibold text-sm sm:text-base whitespace-nowrap">{notifications[currentNotificationIndex]?.message || "אין התראות חדשות"}</p>
                  {notifications.length > 1 && (<div className="hidden sm:flex gap-1.5">{notifications.map((_, index) => (<div key={index} className={`w-2.5 h-2.5 rounded-full ${index === currentNotificationIndex ? 'bg-blue-600' : 'bg-gray-300'}`} />))}</div>)}
                </div>
                <Button variant="ghost" size="icon" className="rounded-full hover:bg-blue-200/50 flex-shrink-0" onClick={handlePrevNotification} disabled={notifications.length <= 1}><ChevronLeft className="w-6 h-6 text-blue-600" /></Button>
              </div>
            </CardContent>
          </Card>


          <div className="flex flex-col md:flex-row gap-4 items-center justify-between candidate-filter-buttons">
            <div className="relative w-full md:w-96 candidate-search-input">
              <Input
                placeholder="אפשר גם לחפש"
                className="pl-12 pr-4 py-2 border-gray-300 focus:border-blue-400 rounded-full h-11"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            </div>
            <div className="flex justify-end w-full md:w-auto">
              <ToggleSwitch
                options={[
                  { value: 'watched', label: 'מועמדים שצפית' },
                  { value: 'new', label: 'מועמדים חדשים' },
                ]}
                value={candidateFilter}
                onChange={handleFilterChange}
              />
            </div>
          </div>
          <div className="space-y-4 candidate-list">
            {filteredCandidates.length > 0 ? (filteredCandidates.map((candidate, index) => {
              // Calculate a stable match score based on candidate ID to ensure consistency
              const getStableMatchScore = (id) => {
                if (!id) return 90;
                let hash = 0;
                const str = String(id);
                for (let i = 0; i < str.length; i++) {
                  hash = str.charCodeAt(i) + ((hash << 5) - hash);
                }
                return 75 + (Math.abs(hash) % 25);
              };

              const match = getStableMatchScore(candidate.id);

              return (
                <motion.div key={candidate.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: index * 0.1 }}>
                  <Card className="bg-white border border-gray-200/90 shadow-sm hover:shadow-lg transition-all duration-300 rounded-2xl">
                    <CardContent className="p-4">
                      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        <div className="flex items-center gap-4 self-start md:self-center">
                          <div className="w-16 h-16 rounded-full overflow-hidden shadow-md border-2 border-white flex-shrink-0"><div className="w-full h-full bg-blue-200 flex items-center justify-center"><UserIcon className="w-8 h-8 text-blue-500" /></div></div>
                          <div className="text-right">
                            <h3 className="font-bold text-lg text-gray-900">
                              {(() => {
                                if (candidate.full_name && candidate.full_name.trim().length > 0) return candidate.full_name;
                                if (candidate.email) return candidate.email;
                                return 'מועמד ללא שם';
                              })()}
                            </h3>
                            <p className="text-gray-600">{candidate.experience_level?.replace('_', ' ')}</p>
                          </div>
                        </div>
                        <div className="flex flex-col sm:flex-row items-center gap-4 md:gap-6 w-full md:w-auto">
                          <div className="flex flex-wrap gap-2 justify-center sm:justify-start">{candidate.skills?.slice(0, 3).map((skill, i) => (<Badge key={i} variant="outline" className="border-blue-200 text-blue-700 bg-blue-50/50 text-xs">{skill}</Badge>))}</div>
                          <div className="w-full sm:w-48 text-right"><div className="text-sm text-gray-600 mb-1.5">{match}% התאמה</div><div dir="ltr" className="w-full h-2.5 bg-gray-200 rounded-full overflow-hidden"><div className={`h-full transition-all duration-500 ${match >= 80 ? 'bg-green-400' : 'bg-orange-400'}`} style={{ width: `${match}%` }}></div></div></div>
                          <Button asChild className="bg-[#84CC9E] hover:bg-green-500 text-white px-5 py-2 rounded-full font-bold w-full sm:w-auto view-candidate-button">
                            <Link
                              to={createPageUrl(`CandidateProfile?id=${candidate.id}&match=${match}`)}
                              state={{ from: `${location.pathname}?filter=${candidateFilter}` }}
                              onClick={() => handleViewCandidate(candidate)}
                            >
                              לצפייה
                            </Link>
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })) : (<div className="text-center py-8"><p className="text-gray-600">{candidateFilter === 'new' ? 'אין מועמדים חדשים זמינים כרגע.' : 'לא צפית במועמדים עדיין.'}</p></div>)
            }
          </div>
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

// --- MAIN DASHBOARD ROUTER ---
export default function Dashboard() {
  useRequireUserType(); // Ensure user has selected a user type
  const { user, loading } = useUser();

  if (loading) {
    return (
      <div className="p-8 space-y-8 flex justify-center items-center h-screen" dir="rtl">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="p-8 text-center" dir="rtl">
        נראה שאתה לא מחובר.
        <Button asChild>
          <Link to={createPageUrl("Login")}>התחבר</Link>
        </Button>
      </div>
    );
  }

  // Use user_type to decide which dashboard to render
  if (user.user_type === 'job_seeker') {
    return <JobSeekerDashboard user={user} />;
  } else {
    return <EmployerDashboard user={user} />;
  }
}
