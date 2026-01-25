import { useState, useEffect, useRef } from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { useUser } from "@/contexts/UserContext";
import { useToast } from "@/components/ui/use-toast";
import ToggleSwitch from "@/components/dashboard/ToggleSwitch";
import { useRequireUserType } from "@/hooks/use-require-user-type";
import { Job, JobView, Notification, UserProfile, CandidateView, CV, JobApplication, User as UserApi } from "@/api/entities";
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

// --- ICONS AND ASSETS ---
import iconJsRelevantJobs from "@/assets/icon_js_relevant_jobs.png";
import iconJsApplications from "@/assets/icon_js_applications.png";
import iconJsCv from "@/assets/icon_js_cv.png";
import iconJsProfileViews from "@/assets/icon_js_profile_views.png";
import iconApplications from "@/assets/icon_applications.png";




const JsRelevantJobsIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="6" y="10" width="20" height="14" rx="3" stroke="#2987cd" strokeWidth="1.8" />
    <path d="M6 14.5H26" stroke="#2987cd" strokeWidth="1.8" />
    <path d="M12 14.5v3M20 14.5v3" stroke="#2987cd" strokeWidth="1.8" strokeLinecap="round" />
    <path d="M12 10V8a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" stroke="#2987cd" strokeWidth="1.8" strokeLinecap="round" />
  </svg>
);

const JsApplicationsIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M6 11c0-2.76 2.24-5 5-5h7l8 8v9c0 2.76-2.24 5-5 5H11c-2.76 0-5-2.24-5-5V11z" stroke="#2987cd" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M18 6v5a3 3 0 0 0 3 3h5" stroke="#2987cd" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M16 21v-8M12.5 16.5 16 13l3.5 3.5" stroke="#2987cd" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const JsCvIcon = ({ className }) => <img src={iconJsCv} className={`${className} object-contain`} style={{ imageRendering: '-webkit-optimize-contrast', filter: 'contrast(1.05)' }} alt="CVs" />;

const JsProfileViewsIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M16 8C10 8 6 12 4 16c2 4 6 8 12 8s10-4 12-8c-2-4-6-8-12-8z" stroke="#2987cd" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="16" cy="16" r="4" stroke="#2987cd" strokeWidth="1.8" fill="none" />
  </svg>
);

const ViewsIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M16 8C10 8 6 12 4 16c2 4 6 8 12 8s10-4 12-8c-2-4-6-8-12-8z" stroke="#2987cd" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="16" cy="16" r="4" stroke="#2987cd" strokeWidth="1.8" fill="none" />
  </svg>
);

const ApplicationsIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M6 11c0-2.76 2.24-5 5-5h7l8 8v9c0 2.76-2.24 5-5 5H11c-2.76 0-5-2.24-5-5V11z" stroke="#2987cd" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M18 6v5a3 3 0 0 0 3 3h5" stroke="#2987cd" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M16 21v-8M12.5 16.5 16 13l3.5 3.5" stroke="#2987cd" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const ActiveJobsIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="6" y="10" width="20" height="14" rx="3" stroke="#2987cd" strokeWidth="1.8" />
    <path d="M6 14.5H26" stroke="#2987cd" strokeWidth="1.8" />
    <path d="M12 14.5v3M20 14.5v3" stroke="#2987cd" strokeWidth="1.8" strokeLinecap="round" />
    <path d="M12 10V8a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" stroke="#2987cd" strokeWidth="1.8" strokeLinecap="round" />
  </svg>
);

// --- JOB SEEKER DASHBOARD COMPONENT (New) ---

const JobSeekerDashboard = ({ user }) => {
  const [jobFilter, setJobFilter] = useState('new');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentNotificationIndex, setCurrentNotificationIndex] = useState(0);
  const [allJobs, setAllJobs] = useState([]); // Renamed 'jobs' to 'allJobs'
  const [viewedJobIds, setViewedJobIds] = useState(new Set()); // New state for viewed job IDs
  const [appliedJobIds, setAppliedJobIds] = useState(new Set()); // New state for applied job IDs
  const [loading, setLoading] = useState(true);
  const [showGuide, setShowGuide] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [userStats, setUserStats] = useState(null);
  const [showCareerModal, setShowCareerModal] = useState(false);
  const [hasCV, setHasCV] = useState(true); // Default to true to avoid flickers
  const [currentPage, setCurrentPage] = useState(1);
  const [hasCompletedOnboardingFlow, setHasCompletedOnboardingFlow] = useState(false);
  const ITEMS_PER_PAGE = 10;
  const navigate = useNavigate();
  const location = useLocation();

  // Check for onboarding triggers - MOVED AFTER GUARDS CHECK
  useEffect(() => {
    // Wait for initial loading and User check
    if (loading || !user) return;

    // GUARD: If we just finished the flow, don't re-evaluate
    if (hasCompletedOnboardingFlow) return;

    const params = new URLSearchParams(location.search);
    const forceOnboarding = params.get('onboarding') === 'complete';

    // 1. First priority: Career Stage
    // Force show if redirected from Preference Questionnaire (forceOnboarding) 
    // OR if data is missing AND user hasn't completed onboarding yet
    if (forceOnboarding || (!user.career_stage && !user.is_onboarding_completed)) {
      setShowCareerModal(true);
      return; // Wait for career stage before showing guide
    }

    // We check hasCV (state) and profile specialization.
    if (!hasCV) return; // Will be redirected

    // We access userProfile inside the effect or rely on 'user' object if it has merged profile data?
    // 'user' from useUser() has merged profile data.
    // Removed specialization check to ensure guide shows
    // if (!user.specialization) return;

    // 2. Second priority: Site Guide
    const hasSeenGuide = localStorage.getItem(`jobseeker_guide_${user?.email}`);
    if (!hasSeenGuide) {
      setShowGuide(true);
    }
  }, [user, loading, hasCV, hasCompletedOnboardingFlow]);

  const handleGuideComplete = () => {
    setShowGuide(false);
    if (user?.email) {
      localStorage.setItem(`jobseeker_guide_${user.email}`, 'completed');
    }
  };

  const handleCareerStageComplete = () => {
    // Mark flow as completed to prevent re-triggering
    setHasCompletedOnboardingFlow(true);
    setShowCareerModal(false);

    // Check for forced onboarding param
    const params = new URLSearchParams(location.search);
    const forceOnboarding = params.get('onboarding') === 'complete';

    // If forced onboarding, clear the param NOW (prevent loops) and show guide
    if (forceOnboarding) {
      // Clear the param
      navigate(location.pathname, { replace: true });

      // Use timeout to ensure modal closes before guide opens
      setTimeout(() => {
        setShowGuide(true);
      }, 500);
      return;
    }

    // Normal flow (not forced): Check if guide seen
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
          Job.filter({ status: 'active' }, "-created_date", 100),
          JobView.filter({ viewer_id: user.id }),
          Notification.filter({ is_read: false, user_id: user.id }, "-created_date", 5), // Change to user_id
          UserAnalytics.getUserStats(user.id), // Change to user.id
          CandidateView.filter({ candidate_id: user.id }), // Change to candidate_id
          UserProfile.filter({ id: user.id }).then(profiles => profiles[0] || null), // Change to ID
          JobApplication.filter({ applicant_id: user.id }), // Change to applicant_id
          CV.filter({ user_email: user.email }).then(cvs => cvs[0] || null) // Fetch user CV
        ]);

        const jobsData = results[0].status === 'fulfilled' ? results[0].value : [];
        if (results[0].status === 'rejected') console.error("Jobs load failed", results[0].reason);

        const jobViewsData = results[1].status === 'fulfilled' ? results[1].value : [];
        const notificationsData = results[2].status === 'fulfilled' ? results[2].value : [];
        if (results[2].status === 'rejected') console.warn("Notifications load failed (400?)", results[2].reason);

        const statsData = results[3].status === 'fulfilled' ? results[3].value : null;
        const profileViewsData = results[4].status === 'fulfilled' ? results[4].value : [];
        const userProfile = results[5].status === 'fulfilled' ? results[5].value : null;
        const applicationsData = results[6].status === 'fulfilled' ? results[6].value : [];
        const userCv = results[7].status === 'fulfilled' ? results[7].value : null;

        // Merge CV data into profile for matching
        const enhancedProfile = {
          ...userProfile,
          ...(userCv || {})
        };

        // Calculate match scores for each job
        const jobsWithScores = await Promise.all(
          jobsData.map(async (job) => {
            let matchScore = null;
            if (enhancedProfile) {
              try {
                const userSettings = {
                  prefers_no_career_change: enhancedProfile.prefers_no_career_change || false
                };
                const score = await calculate_match_score(enhancedProfile, job, userSettings);
                matchScore = score !== null ? Math.round(score * 100) : null;
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

        // Filter: Match >= 0% (Temporary debugging change)
        const qualifiedJobs = jobsWithScores.filter(job => job.match_score >= 0);

        // Sort by match score (descending)
        qualifiedJobs.sort((a, b) => b.match_score - a.match_score);

        // Apply Limits: Max 30 
        const limitedJobs = qualifiedJobs.slice(0, 30);

        const mockJob = {
          id: 'f0000000-0000-0000-0000-000000000001',
          title: 'מנהלת קשרי לקוחות',
          company: 'Google',
          location: 'מרכז',
          company_logo_url: 'https://www.google.com/images/branding/googlelogo/2x/googlelogo_color_92x30dp.png',
          match_score: 96,
          start_date: 'מיידית',
          description: 'אנחנו מחפשים רכז/ת גיוס טכנולוגי/ת יצירתי/ת שיצטרפו לצוות שלנו...',
          requirements: ['ניסיון של שנתיים לפחות בגיוס טכנולוגי - חובה', 'אנגלית ברמה גבוהה'],
          responsibilities: ['אחריות מלאה על תהליך הגיוס מקצה לקצה'],
          created_date: new Date().toISOString()
        };

        setUserStats(enhancedStats);
        // Prepend mock job to the list
        setAllJobs([mockJob, ...limitedJobs]);
        // Use String for ID sets to ensure consistent matching
        setViewedJobIds(new Set(jobViewsData.map(view => String(view.job_id))));
        setAppliedJobIds(new Set(applicationsData.map(app => String(app.job_id))));
        setNotifications(notificationsData);


      } catch (error) {
        console.error("Error loading jobs for seeker:", error);
        setAllJobs([]);
        setViewedJobIds(new Set());
        setAppliedJobIds(new Set());
        setNotifications([]);
        setUserStats(null);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [user, navigate]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, jobFilter]);

  const StatCard = ({ icon: Icon, title, value }) => (
    <Card className="bg-white border border-gray-100 shadow-[0_8px_30px_-8px_rgba(0,0,0,0.12)] rounded-2xl h-full">
      <CardContent className="py-3 px-3 text-center flex flex-col items-center justify-center h-full">
        <div className="w-[44px] h-[44px] rounded-full border-[1.8px] flex items-center justify-center mb-2" style={{ borderColor: '#2987cd' }}>
          <Icon className="w-[22px] h-[22px] object-contain" style={{ imageRendering: '-webkit-optimize-contrast', filter: 'contrast(1.05)' }} />
        </div>
        <p className="text-blue-900 font-bold text-[15px] mb-0.5">{title}</p>
        <div className="text-[22px] text-gray-500 font-normal">{value}</div>
      </CardContent>
    </Card>
  );

  const handlePrevNotification = () => setCurrentNotificationIndex(prev => prev > 0 ? prev - 1 : (notifications.length - 1 || 0));
  const handleNextNotification = () => setCurrentNotificationIndex(prev => prev < (notifications.length - 1) ? prev + 1 : 0);

  // Filter jobs based on the current jobFilter state and search term
  const displayedJobs = allJobs.filter(job => {
    // 1. Expiration check: Filter out jobs older than 30 days (unless it's the mock job)
    if (job.id !== 'f0000000-0000-0000-0000-000000000001' && job.created_date) {
      const createdDate = new Date(job.created_date);
      const now = new Date();
      const diffTime = Math.abs(now - createdDate);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      if (diffDays > 30) return false;
    }

    // 2. Text search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const matchesSearch =
        job.title?.toLowerCase().includes(term) ||
        job.company?.toLowerCase().includes(term) ||
        job.location?.toLowerCase().includes(term);

      if (!matchesSearch) return false;
    }

    if (jobFilter === 'new') {
      return !viewedJobIds.has(String(job.id));
    }
    if (jobFilter === 'viewed') {
      return viewedJobIds.has(String(job.id));
    }
    return true;
  });

  const totalPages = Math.ceil(displayedJobs.length / ITEMS_PER_PAGE);
  const paginatedJobs = displayedJobs.slice(
    0,
    currentPage * ITEMS_PER_PAGE
  );

  const observerRef = useRef();

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && paginatedJobs.length < displayedJobs.length) {
          setCurrentPage((prev) => prev + 1);
        }
      },
      { threshold: 0.1 }
    );

    if (observerRef.current) {
      observer.observe(observerRef.current);
    }

    return () => {
      if (observerRef.current) observer.unobserve(observerRef.current);
    };
  }, [paginatedJobs.length, displayedJobs.length]);

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
  }, [loading, location.hash, paginatedJobs.length]);

  return (
    <>
      <div className="max-w-7xl w-[68%] mx-auto space-y-4 pt-1 px-4 md:px-6 md:pb-6">
        <div className="flex justify-between items-center px-4 mt-2">
          <h1 className="text-lg font-bold text-gray-900 mb-1 mt-2">
            {user.full_name?.trim() ? ` היי ${user.full_name} 👋` : 'היי 👋'}
          </h1>
        </div>

        <div className="space-y-4">
          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-12 stats-grid">
            <StatCard icon={JsRelevantJobsIcon} title="משרות רלוונטיות" value={allJobs.length} />
            <StatCard icon={JsCvIcon} title="קו״ח שהגשת" value={userStats?.resume_views || userStats?.profile_views || 0} />
            <StatCard icon={JsApplicationsIcon} title="מועמדויות שהגשתי" value={userStats?.total_applications || 0} />
            <StatCard icon={JsProfileViewsIcon} title="צפו בכרטיס שלך" value={userStats?.profile_views || 0} />
          </div>

          {/* Notification Carousel */}
          <Card className="bg-[#E7F2F7] shadow-none border-0 rounded-lg notification-carousel">
            <CardContent className="py-2.5 px-4">
              <div className="flex items-center justify-between">
                <Button variant="ghost" className="rounded-full hover:bg-blue-200/50 flex-shrink-0 w-8 h-8 p-0" onClick={handleNextNotification} disabled={notifications.length <= 1}>
                  <ChevronRight className="w-5 h-5 text-blue-600" />
                </Button>
                <div className="text-center flex items-center gap-3 overflow-hidden">
                  <p className="text-blue-800 font-semibold text-sm sm:text-base whitespace-nowrap">{notifications[currentNotificationIndex]?.message || "אין התראות חדשות"}</p>
                  {notifications.length > 1 && (<div className="hidden sm:flex gap-1.5">{notifications.map((_, index) => (<div key={index} className={`w-2 h-2 rounded-full ${index === currentNotificationIndex ? 'bg-blue-600' : 'bg-gray-300'}`} />))}</div>)}
                </div>
                <Button variant="ghost" className="rounded-full hover:bg-blue-200/50 flex-shrink-0 w-8 h-8 p-0" onClick={handlePrevNotification} disabled={notifications.length <= 1}>
                  <ChevronLeft className="w-5 h-5 text-blue-600" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Filter Toggle */}
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="flex justify-end w-full md:w-auto job-filter-buttons order-2 md:order-1">
              <ToggleSwitch
                options={[
                  { value: 'viewed', label: 'משרות שצפית' },
                  { value: 'new', label: 'משרות חדשות' },
                ]}
                value={jobFilter}
                onChange={setJobFilter}
              />
            </div>
            <div className="relative w-full md:w-96 job-search-input order-1 md:order-2">
              <Input
                placeholder="אפשר גם לחפש"
                className="pl-12 pr-4 py-2 border-gray-300 focus:border-blue-400 rounded-full h-11"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            </div>
          </div>

          {/* Jobs List */}
          <div className="space-y-4 job-list">
            {loading ? (
              <div className="text-center py-8 text-gray-500">טוען משרות...</div>
            ) : paginatedJobs.length > 0 ? (
              paginatedJobs.map((job, index) => (
                <motion.div
                  key={job.id}
                  id={`job-${job.id}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4 }}
                >
                  <Card className="bg-white border border-gray-200/90 shadow-[0_8px_30px_-8px_rgba(0,0,0,0.12)] hover:shadow-xl transition-all duration-300 rounded-2xl p-4">
                    <div className="flex flex-col gap-4">
                      {/* Top Row: Info/Logo (left) and Button (right) */}
                      <div className="flex items-center justify-between gap-4">
                        {/* Left: Info and Logo */}
                        <div className="flex items-center gap-4 flex-1">
                          <div className="w-16 h-16 rounded-full overflow-hidden shadow-md border-2 border-white flex-shrink-0">
                            <img src={job.company_logo_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(job.company)}&background=random`} alt={job.company} className="w-full h-full object-cover" />
                          </div>
                          <div className="text-left">
                            <h3 className="font-bold text-lg text-gray-900 leading-tight">{job.title}</h3>
                            <p className="text-gray-500 text-sm mt-0.5">{job.company}</p>
                          </div>
                        </div>

                        {/* Right: Button */}
                        <div className="flex-shrink-0">
                          <Button asChild className={`${appliedJobIds.has(String(job.id))
                            ? 'bg-gray-200 text-gray-700 hover:bg-gray-200'
                            : viewedJobIds.has(String(job.id))
                              ? 'bg-gray-400 hover:bg-gray-500 text-white'
                              : job.match_score >= 70
                                ? 'bg-green-400 hover:bg-green-500 text-white'
                                : job.match_score >= 40
                                  ? 'bg-orange-400 hover:bg-orange-500 text-white'
                                  : 'bg-red-500 hover:bg-red-600 text-white'
                            } px-4 py-1.5 h-9 rounded-full font-bold w-32 text-sm view-job-button transition-colors duration-300`}>
                            <Link
                              to={createPageUrl(`JobDetailsSeeker?id=${job.id}&from=Dashboard`)}
                              onClick={() => {
                                // Track job view when user clicks to view details
                                if (user?.email) {
                                  UserAnalytics.trackJobView(user, job); // Pass full user object
                                  setViewedJobIds(prev => new Set(prev).add(String(job.id)));
                                }
                              }}
                            >
                              {appliedJobIds.has(String(job.id))
                                ? "הוגשה מועמדות"
                                : viewedJobIds.has(String(job.id))
                                  ? "נצפה"
                                  : "צפייה"}
                            </Link>
                          </Button>
                        </div>
                      </div>

                      {/* Bottom Row: Chips (left) and Match Bar (right) */}
                      <div className="flex flex-col sm:flex-row items-center gap-4 w-full">
                        {/* Left: Chips Area */}
                        <div className="flex gap-2 text-xs flex-wrap">
                          <span className="flex items-center gap-1 bg-[#eaf5fc] text-[#001a6e] px-2.5 py-1 rounded-lg border border-blue-100/50 font-bold whitespace-nowrap">
                            <Clock className="w-3 h-3 ml-1 text-[#001a6e]" />{job.start_date || 'מיידית'}
                          </span>
                          <span className="flex items-center gap-1 bg-[#eaf5fc] text-[#001a6e] px-2.5 py-1 rounded-lg border border-blue-100/50 font-bold whitespace-nowrap">
                            <Briefcase className="w-3 h-3 ml-1 text-[#001a6e]" />משרה מלאה
                          </span>
                          <span className="flex items-center gap-1 bg-[#eaf5fc] text-[#001a6e] px-2.5 py-1 rounded-lg border border-blue-100/50 font-bold whitespace-nowrap">
                            <MapPin className="w-3 h-3 ml-1 text-[#001a6e]" />{job.location}
                          </span>
                        </div>

                        {/* Right: Match Score Bar */}
                        {job.match_score !== null && (
                          <div className="flex-1 relative h-5 bg-gray-200 rounded-full overflow-hidden shadow-inner w-full">
                            {/* Progress Fill - Right to Left */}
                            <div
                              className={`absolute right-0 top-0 h-full transition-all duration-700 ${job.match_score >= 70 ? 'bg-green-400/90' : job.match_score >= 40 ? 'bg-orange-400/90' : 'bg-red-500/90'}`}
                              style={{ width: `${job.match_score}%` }}
                            ></div>
                            {/* Centered Text inside bar */}
                            <div className="absolute inset-0 flex items-center justify-center text-[11px] font-bold text-black z-10 pointer-events-none">
                              {job.match_score}% התאמה
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))
            ) : (
              // Updated empty state messages
              <div className="text-center py-8 text-gray-500">{jobFilter === 'new' ? 'אין משרות חדשות עבורך כרגע.' : 'עדיין לא צפית באף משרה.'}</div>
            )}
          </div>

          {/* Pagination Controls */}
          {/* Infinite Scroll Sentinel */}
          {paginatedJobs.length < displayedJobs.length && (
            <div ref={observerRef} className="flex justify-center items-center py-4">
              <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
            </div>
          )}
        </div>
      </div >

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
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const filterParam = searchParams.get('filter');
    if (filterParam && filterParam !== candidateFilter) {
      setCandidateFilter(filterParam);
      setCurrentPage(1);
    }
  }, [searchParams]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, candidateFilter]);

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

  // State for storing application info per candidate (email -> jobTitle)
  const [candidateApplications, setCandidateApplications] = useState({});

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

  // Redirect to onboarding if company profile is incomplete
  // Redirect to onboarding if company profile is incomplete
  useEffect(() => {
    // Skip check if verified completion just happened
    const params = new URLSearchParams(location.search);
    if (params.get('onboarding') === 'complete') return;

    if (!loading && user && user.user_type === 'employer' && (!user.company_name || !user.company_name.trim())) {
      navigate('/CompanyProfileCompletion');
    }
  }, [user, loading, navigate, location.search]);

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
        // 1. Get current user data directly to ensure fresh email
        const userData = await UserApi.me();
        if (!userData) return;

        console.log('📊 Dashboard: Loading stats for', userData.email);

        // 2. Fetch all jobs for user (like Statistics.jsx)
        const allUserJobs = await Job.filter({ created_by: userData.email });

        // 3. Filter for Active/Paused jobs (like Statistics.jsx)
        const activeStatuses = ['active', 'paused'];
        const activeJobs = allUserJobs.filter(job => activeStatuses.includes(job.status));

        console.log(`📊 Dashboard: Found ${allUserJobs.length} total jobs, ${activeJobs.length} active/paused`);

        // 4. Calculate Views and Applications specifically for these Active Jobs
        // We do this precisely to match the "Active Jobs" view in Statistics
        let realTotalApps = 0;
        let realTotalViews = 0;

        await Promise.all(activeJobs.map(async (job) => {
          const [jobApps, jobViews] = await Promise.all([
            JobApplication.filter({ job_id: job.id }),
            JobView.filter({ job_id: job.id })
          ]);
          realTotalApps += jobApps.length;
          realTotalViews += jobViews.length;
        }));

        console.log(`📊 Dashboard: Calculated - Apps: ${realTotalApps}, Views: ${realTotalViews}`);

        // 5. Get other dashboard data (Activity, etc.)
        const [viewedCandidatesData, dashboardData] = await Promise.all([
          CandidateView.filter({ viewer_email: userData.email }, "-viewed_at", 1000),
          EmployerAnalytics.getDashboardData(userData.email) // Still needed for activity and other stats
        ]);

        // 6. Fetch actual candidate profiles for the "Candidates" tab/list below (retaining previous logic)
        // We can reuse allUserJobs or fetch again. Let's reuse activeJobs for the "Recent Applications" list context if preferred, 
        // OR fetch for ALL jobs if we want to show all candidates. 
        // Typically the candidates list shows *recent* applicants across all jobs.
        // Let's keep the broad fetch for the list but use the focused counts for the cards.

        const myJobIds = allUserJobs.map(j => j.id);
        let applicantProfiles = [];
        if (myJobIds.length > 0) {
          const appsResults = await Promise.all(myJobIds.map(async (jobId) => {
            return await JobApplication.filter({ job_id: jobId });
          }));
          // ... (rest of applicant processing logic remains similar but simplified if needed)
          // For now, retaining the heavy logic below via existing code flow, 
          // but we MUST ensure the counters at the top use our `realTotalApps` and `realTotalViews`.
        }

        // ... (Existing applicant processing logic continues below in the file, we just need to ensure we don't break it)
        // But since we are replacing a block, we need to be careful to reconnect variables.

        // Re-implementing the Applicant Profile Fetching needed for the list (lines 692-748 original)
        // because we are replacing the start of the block.

        const allAppsFlat = (await Promise.all(myJobIds.map(async (jobId) => {
          return await JobApplication.filter({ job_id: jobId });
        }))).flat().sort((a, b) => new Date(b.created_date) - new Date(a.created_date));

        // Build unique candidate list for the TABLE display (not the stats card)
        const candidateRefs = [];
        const seenIds = new Set();
        const seenEmails = new Set();

        for (const app of allAppsFlat) {
          const email = app.applicant_email?.toLowerCase();
          if (app.applicant_id && !seenIds.has(app.applicant_id)) {
            candidateRefs.push({ id: app.applicant_id, email: email });
            seenIds.add(app.applicant_id);
            if (email) seenEmails.add(email);
          } else if (email && !seenEmails.has(email) && !app.applicant_id) {
            candidateRefs.push({ email: email });
            seenEmails.add(email);
          }
          if (candidateRefs.length >= 50) break;
        }

        if (candidateRefs.length > 0) {
          const profiles = await Promise.all(candidateRefs.map(async (ref) => {
            try {
              if (ref.id) {
                const p = await UserProfile.filter({ id: ref.id });
                if (p.length > 0) return p[0];
              }
              if (ref.email) {
                const p = await UserProfile.filter({ email: ref.email });
                if (p.length > 0) return p[0];
              }
            } catch (e) { console.error('Error fetching profile:', e); }
            return null;
          }));
          applicantProfiles = profiles.filter(p => p !== null);
        }

        let notificationsData = [];
        try {
          notificationsData = await Notification.filter({ is_read: false, user_id: userData.id }, "-created_date", 5);
        } catch (err) {
          try {
            notificationsData = await Notification.filter({ is_read: false, email: userData.email }, "-created_date", 5);
          } catch (err2) { }
        }

        const filteredNotifications = notificationsData.filter(notif =>
          EMPLOYER_ALLOWED_NOTIFICATION_TYPES.includes(notif.type)
        );

        // Construct the stats object using our DIRECTLY CALCULATED values
        const enhancedStats = {
          ...dashboardData.stats,
          total_jobs_published: activeJobs.length,      // Active + Paused jobs
          total_applications_received: realTotalApps,   // Sum of apps for Active/Paused jobs
          total_job_views: realTotalViews,              // Sum of views for Active/Paused jobs
          total_candidates_viewed: viewedCandidatesData.length,
          conversion_rate: realTotalViews > 0
            ? ((realTotalApps / realTotalViews) * 100).toFixed(1)
            : 0
        };

        setEmployerStats(enhancedStats);
        setEmployerActivity(dashboardData.recentActivity);
        setNotifications(filteredNotifications);
        setViewedCandidates(viewedCandidatesData);
        setCandidates(applicantProfiles);
      } catch (error) {
        console.error("Error loading employer dashboard:", error);
        toast({
          title: "שגיאה בטעינת נתונים",
          description: `שגיאה: ${error.message || "לא ניתן לטעון את הנתונים"}`,
          variant: "destructive"
        });
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
    // 1. Track Analytics (Non-blocking)
    try {
      if (user?.email) {
        await UserAnalytics.trackAction(user, 'profile_view', { // Pass full user object
          candidate_name: candidate.full_name,
          candidate_email: candidate.email,
          candidate_id: candidate.id
        });
      }
    } catch (analyticsError) {
      console.warn("Analytics tracking failed (non-critical):", analyticsError);
    }

    // 2. Create Candidate View Record (Critical)
    try {
      await CandidateView.create({
        candidate_name: candidate.full_name,
        candidate_role: candidate.experience_level || 'N/A',
        candidate_id: candidate.id, // Add ID
        // viewer_id: user.id, // Removed: Column missing
        viewer_email: user.email,
        viewed_at: new Date().toISOString()
      });

      // Update local state immediately
      const updatedViewed = await CandidateView.filter({ viewer_email: user.email }, "-viewed_at", 1000);
      setViewedCandidates(updatedViewed);
    } catch (error) {
      console.error("Error recording candidate view:", error);
    }
  };

  const handlePrevNotification = () => setCurrentNotificationIndex(prev => prev > 0 ? prev - 1 : (notifications.length - 1 || 0));
  const handleNextNotification = () => setCurrentNotificationIndex(prev => prev < (notifications.length - 1) ? prev + 1 : 0);



  const handleCandidateClick = async (candidate, match) => {
    // Show loading state if desired, or just wait
    await handleViewCandidate(candidate);

    const targetUrl = createPageUrl(`CandidateProfile?id=${candidate.id}&match=${match}`);
    navigate(targetUrl, {
      state: { from: `${location.pathname}?filter=${candidateFilter}` }
    });
  };

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

    const isViewed = viewedCandidates.some(vc => {
      const match = vc.candidate_name?.trim().toLowerCase() === c.full_name?.trim().toLowerCase();
      return match;
    });

    // console.log(`Candidate ${c.full_name} isViewed: ${isViewed}, filter: ${candidateFilter}`);
    return candidateFilter === 'new' ? !isViewed : isViewed;
  });

  // Calculate pagination
  const totalPages = Math.ceil(filteredCandidates.length / ITEMS_PER_PAGE);
  const displayedCandidates = filteredCandidates.slice(
    0,
    currentPage * ITEMS_PER_PAGE
  );

  const observerRef = useRef();

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && displayedCandidates.length < filteredCandidates.length) {
          setCurrentPage((prev) => prev + 1);
        }
      },
      { threshold: 0.1 }
    );

    if (observerRef.current) {
      observer.observe(observerRef.current);
    }

    return () => {
      if (observerRef.current) observer.unobserve(observerRef.current);
    };
  }, [displayedCandidates.length, filteredCandidates.length]);

  if (loading) {
    return (
      <div className="p-8 space-y-8" dir="rtl">
        {Array(4).fill(0).map((_, i) => <div key={i} className="h-32 bg-gradient-to-r from-gray-100 to-gray-200 rounded-2xl animate-pulse" />)}
      </div>
    );
  }

  return (
    <>
      <div className="max-w-7xl w-[72%] mx-auto space-y-4 pt-1 px-4 md:px-6 md:pb-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="text-right px-4 flex justify-between items-center">
          <h1 className="text-lg font-bold text-gray-900 mb-1 mt-2">
            {user.company_name?.trim() ? ` היי ${user.company_name} 👋` : 'היי 👋'}
          </h1>

        </motion.div>

        <div className="space-y-4">
          {/* Enhanced Stats Grid with Real Analytics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-12 employer-stats">
            <EmployerStatsCard
              icon={ActiveJobsIcon}
              title="משרות פעילות"
              value={employerStats?.total_jobs_published || 0}
              color="bg-purple-50 text-purple-600"
            />
            <EmployerStatsCard
              icon={ApplicationsIcon}
              title="מועמדויות שהתקבלו"
              value={employerStats?.total_applications_received || 0}
              color="bg-green-50 text-green-600"
            />
            <EmployerStatsCard
              icon={ViewsIcon}
              title="צפיות במשרות"
              value={employerStats?.total_job_views || 0}
              color="bg-blue-50 text-blue-600"
            />
            <Card className="relative col-span-2 sm:col-span-1 bg-[#84CC9E] text-white border-0 shadow-[0_8px_30px_-8px_rgba(0,0,0,0.12)] hover:shadow-lg transition-all duration-300 rounded-2xl create-job-card">
              <Link to={createPageUrl("CreateJob")}>
                <CardContent className="py-3 px-3 text-center flex flex-col items-center justify-center h-full">
                  <div className="w-[44px] h-[44px] bg-white/30 rounded-full flex items-center justify-center mx-auto mb-2"><Plus className="w-[22px] h-[22px] text-white" /></div>
                  <h3 className="font-bold text-[15px] mb-0.5">פרסום משרה חדשה</h3>
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
            <CardContent className="py-2.5 px-4">
              <div className="flex items-center justify-between">
                <Button variant="ghost" className="rounded-full hover:bg-blue-200/50 flex-shrink-0 w-8 h-8 p-0" onClick={handleNextNotification} disabled={notifications.length <= 1}>
                  <ChevronRight className="w-5 h-5 text-blue-600" />
                </Button>
                <div className="text-center flex items-center gap-3 overflow-hidden">
                  <p className="text-blue-800 font-semibold text-sm sm:text-base whitespace-nowrap">{notifications[currentNotificationIndex]?.message || "אין התראות חדשות"}</p>
                  {notifications.length > 1 && (<div className="hidden sm:flex gap-1.5">{notifications.map((_, index) => (<div key={index} className={`w-2 h-2 rounded-full ${index === currentNotificationIndex ? 'bg-blue-600' : 'bg-gray-300'}`} />))}</div>)}
                </div>
                <Button variant="ghost" className="rounded-full hover:bg-blue-200/50 flex-shrink-0 w-8 h-8 p-0" onClick={handlePrevNotification} disabled={notifications.length <= 1}>
                  <ChevronLeft className="w-5 h-5 text-blue-600" />
                </Button>
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
            <h2 className="text-lg font-bold text-gray-900 mb-2 px-2">מועמדים שהגישו מועמדות</h2>
            {displayedCandidates.length > 0 ? (displayedCandidates.map((candidate, index) => {
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
                <motion.div key={candidate.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: index * 0.1 }}>
                  <Card className="bg-white border border-gray-200/90 shadow-sm hover:shadow-lg transition-all duration-300 rounded-2xl">
                    <CardContent className="p-4">
                      <div className="flex flex-col gap-4">
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex items-center gap-4 flex-1">
                            <div className="w-16 h-16 rounded-full overflow-hidden shadow-md border-2 border-white flex-shrink-0">
                              {candidate.profile_picture ? (
                                <img
                                  src={candidate.profile_picture}
                                  alt={candidate.full_name || "Profile"}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full bg-blue-200 flex items-center justify-center">
                                  <UserIcon className="w-8 h-8 text-blue-500" />
                                </div>
                              )}
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
                                {jobAppliedTo || candidate.experience_level?.replace('_', ' ') || "ללא ניסיון"}
                              </p>
                            </div>
                          </div>

                          <div className="flex-shrink-0">
                            <Button
                              className={`text-white px-6 py-1.5 h-9 rounded-full font-bold w-32 text-sm view-candidate-button transition-colors duration-300 ${match >= 70 ? 'bg-green-400 hover:bg-green-500' : match >= 40 ? 'bg-orange-400 hover:bg-orange-500' : 'bg-red-400 hover:bg-red-500'
                                }`}
                              onClick={() => handleCandidateClick(candidate, match)}
                            >
                              לצפייה
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
                                className={`absolute right-0 top-0 h-full transition-all duration-700 ${match >= 70 ? 'bg-green-400/90' : match >= 40 ? 'bg-orange-400/90' : 'bg-red-400/90'}`}
                                style={{ width: `${match}%` }}
                              ></div>
                              <div className="absolute inset-0 flex items-center justify-center text-[11px] font-bold text-black z-10 pointer-events-none">
                                {match}% התאמה
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })) : (<div className="text-center py-8"><p className="text-gray-600">{candidateFilter === 'new' ? 'אין מועמדים חדשים זמינים כרגע.' : 'לא צפית במועמדים עדיין.'}</p></div>)
            }
          </div>

          {/* Pagination Controls */}
          {/* Infinite Scroll Sentinel */}
          {displayedCandidates.length < filteredCandidates.length && (
            <div ref={observerRef} className="flex justify-center items-center py-4">
              <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
            </div>
          )}
        </div>
      </div >

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

  // Clear onboarding state when reaching dashboard
  const navigate = useNavigate();

  useEffect(() => {
    localStorage.removeItem('onboarding_active');

    // Check if we are finalizing onboarding via a redirect
    const params = new URLSearchParams(window.location.search);
    const isFinalizingOnboarding = params.get('onboarding') === 'complete';

    // Strict Onboarding Check - Allow access if finalizing
    if (!loading && user && !user.is_onboarding_completed && !isFinalizingOnboarding) {
      if (user.user_type === 'job_seeker') {
        // Force back to selection (which auto-opens CV modal)
        navigate('/UserTypeSelection');
      } else if (user.user_type === 'employer') {
        navigate('/CompanyProfileCompletion');
      }
    }
  }, [loading, user, navigate]);

  if (loading) {
    return (
      <div className="p-8 space-y-8 flex justify-center items-center h-screen" dir="rtl">
        <div className="w-10 h-10 border-t-2 border-blue-600 rounded-full animate-spin"></div>
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
