import { useState, useEffect, useRef } from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { useUser } from "@/contexts/UserContext";
import { useToast } from "@/components/ui/use-toast";
import ToggleSwitch from "@/components/dashboard/ToggleSwitch";
import { useRequireUserType } from "@/hooks/use-require-user-type";
import { Job, JobView, Notification, UserProfile, CandidateView, CV, JobApplication, User as UserApi, EmployerAction } from "@/api/entities";
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
  Plus,
  Menu,
  Sparkles
} from "lucide-react";
import { motion } from "framer-motion";
import { calculate_match_score } from "@/utils/matchScore";
import { createPageUrl, safeParseJSON } from "@/utils";
import { UserAnalytics } from "@/components/UserAnalytics";
import { EmployerAnalytics } from "@/components/EmployerAnalytics";
import EmployerStatsCard from "@/components/employer/EmployerStatsCard";
import EmployerActivityFeed from "@/components/employer/EmployerActivityFeed";
import JobSeekerGuide from "@/components/guides/JobSeekerGuide";
import EmployerGuide from "@/components/guides/EmployerGuide";
import CareerStageModal from "@/components/dashboard/CareerStageModal";
const EMPLOYER_ALLOWED_NOTIFICATION_TYPES = ['application_submitted', 'new_message'];

const AVAILABILITY_TRANSLATIONS = {
  'immediate': 'מיידית',
  '1_2_weeks': 'שבוע עד שבועיים',
  'two_weeks': 'שבוע עד שבועיים',
  '1_2_months': 'חודש עד חודשיים',
  'months_1_2': 'חודש עד חודשיים',
  'months_2_1': 'חודש עד חודשיים',
  'one_month': 'חודש עד חודשיים',
  'negotiable': 'גמיש/ה',
  'flexible': 'גמיש/ה'
};

const JOB_TYPE_TRANSLATIONS = {
  'full_time': 'משרה מלאה',
  'part_time': 'משרה חלקית',
  'shifts': 'משמרות',
  'flexible': 'גמיש/ה',
  'contract': 'חוזה',
  'freelance': 'פרילנס',
  'internship': 'התמחות'
};

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
  const { toast } = useToast();

  // Check for onboarding triggers - MOVED AFTER GUARDS CHECK
  useEffect(() => {
    // Wait for initial loading and User check
    if (loading || !user) return;

    const params = new URLSearchParams(location.search);
    const forceOnboarding = params.get('onboarding') === 'complete';

    // Cleanup the URL parameter after processing and set local state
    if (forceOnboarding && !hasCompletedOnboardingFlow) {
      setHasCompletedOnboardingFlow(true);
      const newParams = new URLSearchParams(params);
      newParams.delete('onboarding');
      const newSearch = newParams.toString();
      navigate(location.pathname + (newSearch ? `?${newSearch}` : ''), { replace: true });
    }

    if (forceOnboarding || (!user.career_stage && !user.is_onboarding_completed)) {
      setShowCareerModal(true);
      return;
    }

    // GUARD: If we just finished the flow, don't re-evaluate
    if (hasCompletedOnboardingFlow) return;

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

  // Prevent back-navigation to onboarding from Dashboard
  useEffect(() => {
    if (hasCompletedOnboardingFlow) {
      // Create a buffer in history
      window.history.pushState(null, "", window.location.pathname);

      const handlePopState = (event) => {
        // Trap them on the dashboard
        window.history.pushState(null, "", window.location.pathname);
        toast({
          title: "תהליך הרישום הושלם!",
          description: "ברוכים הבאים למחלקת המועמדים. כעת ניתן להתחיל בחיפוש משרות.",
        });
      };

      window.addEventListener("popstate", handlePopState);
      return () => window.removeEventListener("popstate", handlePopState);
    }
  }, [hasCompletedOnboardingFlow, location.pathname, toast]);

  const handleGuideComplete = () => {
    setShowGuide(false);
    if (user?.email) {
      localStorage.setItem(`jobseeker_guide_${user.email}`, 'completed');
    }
  };

  const handleNextNotification = () => {
    setCurrentNotificationIndex((prev) => (prev + 1) % notifications.length);
  };

  const handlePrevNotification = () => {
    setCurrentNotificationIndex((prev) => (prev - 1 + notifications.length) % notifications.length);
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
          Notification.filter({ is_read: 'false', user_id: user.id }, "-created_date", 5), // Change to user_id
          UserAnalytics.getUserStats(user.id),
          Promise.all([
            Notification.filter({ user_id: user.id, type: 'profile_view' }),
            Notification.filter({ email: user.email, type: 'profile_view' }),
            Notification.filter({ user_id: user.id, type: 'resume_view' }),
            Notification.filter({ email: user.email, type: 'resume_view' })
          ]).then(results => {
            // results: [profileByUid, profileByEmail, resumeByUid, resumeByEmail]
            const profileIds = new Set([...results[0], ...results[1]].map(n => n.id));
            const resumeIds = new Set([...results[2], ...results[3]].map(n => n.id));
            return {
              profileCount: profileIds.size,
              resumeCount: resumeIds.size
            };
          }),
          UserProfile.filter({ id: user.id }).then(profiles => profiles[0] || null),
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

        // Calculate match scores for each job in chunks to prevent network/AI stalls
        const jobsWithScores = [];
        const CHUNK_SIZE = 5;

        for (let i = 0; i < jobsData.length; i += CHUNK_SIZE) {
          const chunk = jobsData.slice(i, i + CHUNK_SIZE);
          const chunkResults = await Promise.all(
            chunk.map(async (job) => {
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
          jobsWithScores.push(...chunkResults);
        }

        // Enhance stats with notification view data (which is more reliable than CandidateView right now)
        const { profileCount, resumeCount } = profileViewsData;

        const enhancedStats = statsData ? {
          ...statsData,
          profile_views: profileCount,
          resume_views: resumeCount
        } : {
          profile_views: profileCount,
          resume_views: resumeCount,
          total_applications: applicationsData.length || 0
        };

        // Filter: Show valid match scores (>= 60%) (As requested for run period)
        const qualifiedJobs = jobsWithScores.filter(job => job.match_score >= 60);

        // Sort by match score (descending), treating null as 0
        qualifiedJobs.sort((a, b) => (b.match_score ?? 0) - (a.match_score ?? 0));

        // Apply Limits: Max 30 displayed daily
        let limitedJobs = qualifiedJobs.slice(0, 30);

        // Special case: Add "מלקט/ת" job if it's not already in the top 30
        const likutJob = qualifiedJobs.find(job => job.title?.includes('מלקט'));
        if (likutJob && !limitedJobs.find(job => job.id === likutJob.id)) {
          limitedJobs.push(likutJob);
        }

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

        // Enrich jobs with company logos from employer profiles
        const creatorEmails = [...new Set(limitedJobs.map(j => j.created_by).filter(Boolean))];
        if (creatorEmails.length > 0) {
          try {
            const employerProfiles = await Promise.all(
              creatorEmails.map(email => UserProfile.filter({ email: email.toLowerCase() }))
            );

            const profileMap = employerProfiles.flat().reduce((acc, profile) => {
              if (profile?.email) {
                acc[profile.email.toLowerCase()] = {
                  logo: profile.profile_picture,
                  companyName: profile.company_name
                };
              }
              return acc;
            }, {});

            limitedJobs.forEach(j => {
              const profile = profileMap[j.created_by?.toLowerCase()];
              if (profile) {
                if (!j.company_logo_url) {
                  j.company_logo_url = profile.logo;
                }
                // Override "Your Company" if actual name exists
                if (j.company === "Your Company" && profile.companyName) {
                  j.company = profile.companyName;
                }
              }
            });
          } catch (e) {
            console.error("Error fetching employer profiles for logos:", e);
          }
        }

        setUserStats(enhancedStats);

        // DEBUG: Log all jobs and their match scores
        console.log('=== DEBUG: All Jobs with Scores ===');
        console.log('Total jobs fetched:', jobsWithScores.length);
        jobsWithScores.forEach(job => {
          console.log(`Job: ${job.title} (${job.company}) - Match Score: ${job.match_score}, Status: ${job.status}, Created: ${job.created_date}`);
        });

        console.log('=== DEBUG: Qualified Jobs (after filter) ===');
        console.log('Qualified jobs count:', qualifiedJobs.length);
        qualifiedJobs.forEach(job => {
          console.log(`Job: ${job.title} - Match Score: ${job.match_score}`);
        });

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
    <Card className="bg-white border-[0.5px] md:border border-gray-100 shadow-md md:shadow-[0_8px_30px_-8px_rgba(0,0,0,0.12)] rounded-[8px] md:rounded-2xl w-[148px] md:w-full h-[97px] md:h-full">
      <CardContent className="py-2 md:py-3 px-2 md:px-3 text-center flex flex-col items-center justify-center h-full">
        <div className="w-[32px] md:w-[44px] h-[32px] md:h-[44px] rounded-full border-[1px] md:border-[1.8px] flex items-center justify-center mb-1 md:mb-2" style={{ borderColor: '#2987cd' }}>
          <Icon className="w-[18px] md:w-[22px] h-[18px] md:h-[22px] object-contain" style={{ imageRendering: '-webkit-optimize-contrast', filter: 'contrast(1.05)' }} />
        </div>
        <p className="text-blue-900 font-bold text-[12px] md:text-[15px] mb-0.5 leading-tight">{title}</p>
        <div className="text-[18px] md:text-[22px] text-gray-500 font-normal">{value}</div>
      </CardContent>
    </Card>
  );


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
      <div className="min-h-screen bg-transparent md:bg-transparent" dir="rtl">
        {/* Mobile Header - Pill Shape (Hidden to let Layout.jsx handle it) */}
        <div className="w-full px-4 pt-8 pb-2 hidden sticky top-0 z-50">
          <div className="bg-[#EBF5FF] rounded-full h-[62px] px-6 flex flex-row-reverse items-center justify-between shadow-sm border border-white/50 backdrop-blur-sm">
            <Button variant="ghost" size="icon" className="rounded-full text-[#001D3D] hover:bg-transparent p-0">
              <Menu className="w-8 h-8 stroke-[1.5px]" />
            </Button>
            <div className="flex items-center gap-1.5 direction-ltr" dir="ltr">
              <Sparkles className="w-5 h-5 text-[#2987CD] fill-[#2987CD]/20 stroke-[1.5px]" />
              <span className="text-[25px] font-bold tracking-tight text-[#001D3D] leading-none pb-0.5">
                Metch
              </span>
            </div>
          </div>
        </div>

        <div className="max-w-7xl w-full md:w-[68%] mx-auto space-y-4 pt-4 md:pt-1 px-3 md:px-6 md:pb-6 relative z-10">
          <div className="bg-transparent md:bg-transparent rounded-none md:rounded-none p-4 md:p-0 shadow-none md:shadow-none min-h-[90vh] md:min-h-0">
            {/* Desktop Header */}
            <div className="hidden md:flex justify-between items-center px-4 mt-2 mb-4">
              <h1 className="text-lg font-bold text-gray-900">
                {user.full_name?.trim() ? ` היי ${user.full_name} 👋` : 'היי 👋'}
              </h1>
            </div>

            {/* Mobile Header Title */}
            <div className="flex justify-between items-center px-3 mb-6 md:hidden">
              <h1 className="text-xl font-bold text-[#001D3D]">
                {user.full_name?.trim() ? `היי ${user.full_name.split(' ')[0]} 👋` : 'היי 👋'}
              </h1>
            </div>

            <div className="space-y-6">
              {/* Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-12 stats-grid justify-items-center">
                <StatCard icon={JsRelevantJobsIcon} title="משרות רלוונטיות" value={allJobs.length} />
                <StatCard icon={JsApplicationsIcon} title="מועמדויות שהגשת" value={userStats?.total_applications || 0} />
                <StatCard icon={JsCvIcon} title="קורות חיים שנצפו" value={userStats?.resume_views || 0} />
                <StatCard icon={JsProfileViewsIcon} title="צפו בכרטיס שלי" value={userStats?.profile_views || 0} />
              </div>

              {/* Notification Carousel */}
              <Card className="hidden md:block bg-[#E7F2F7] shadow-none border-0 rounded-lg notification-carousel">
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
              <div className="flex flex-col md:flex-row gap-6 md:gap-4 items-center justify-between">
                <div className="flex justify-center md:justify-end w-full md:w-auto job-filter-buttons order-1 md:order-1">
                  <ToggleSwitch
                    options={[
                      { value: 'viewed', label: 'משרות שצפית' },
                      { value: 'new', label: 'משרות חדשות' },
                    ]}
                    value={jobFilter}
                    onChange={setJobFilter}
                  />
                </div>
                <div className="relative w-full md:w-96 job-search-input order-2 md:order-2">
                  <Input
                    placeholder="אפשר גם לחפש"
                    className="pl-12 pr-4 md:pr-4 py-2 border-0 border-b border-gray-200 md:border md:border-gray-300 focus:ring-0 focus:border-blue-400 rounded-none md:rounded-full h-11 bg-transparent md:bg-white transition-all shadow-none"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  <Search className="absolute left-0 md:left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
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
                      <Card className="bg-white border border-gray-200/90 shadow-[0_8px_30px_-8px_rgba(0,0,0,0.12)] hover:shadow-xl transition-all duration-300 rounded-2xl p-2 md:p-4">
                        <div className="flex flex-col gap-1.5 md:gap-4">
                          {/* Top Row: Info/Logo and Button */}
                          <div className="flex items-center justify-between gap-1.5 md:gap-4">
                            {/* Info and Logo */}
                            <div className="flex items-center gap-2 md:gap-4 flex-1 min-w-0">
                              <div className="w-12 h-12 md:w-16 md:h-16 rounded-full overflow-hidden shadow-md border-2 border-white flex-shrink-0">
                                <img src={job.company_logo_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(job.company)}&background=random`} alt={job.company} className="w-full h-full object-cover" />
                              </div>
                              <div className="text-right flex-1 min-w-0">
                                <h3 className="font-bold text-sm md:text-lg text-gray-900 leading-tight md:truncate">{job.title}</h3>
                                <p className="text-gray-500 text-[11px] md:text-sm mt-0.5 truncate">{job.company}</p>

                                {/* Chips Area (Mobile Only - under info) */}
                                <div className="flex md:hidden flex-row flex-nowrap overflow-hidden gap-0.5 mt-1">
                                  <span className="flex items-center gap-0.5 bg-[#eaf5fc] text-[#001a6e] px-0.5 py-0.5 rounded-md border border-blue-100/50 font-bold text-[6px] whitespace-nowrap">
                                    <Clock className="w-1.5 h-1.5 ml-0.5" />{AVAILABILITY_TRANSLATIONS[job.start_date] || job.start_date || 'מיידית'}
                                  </span>
                                  <span className="flex items-center gap-0.5 bg-[#eaf5fc] text-[#001a6e] px-0.5 py-0.5 rounded-md border border-blue-100/50 font-bold text-[6px] whitespace-nowrap">
                                    <Briefcase className="w-1.5 h-1.5 ml-0.5" />{JOB_TYPE_TRANSLATIONS[job.employment_type] || 'משרה מלאה'}
                                  </span>
                                  <span className="flex items-center gap-0.5 bg-[#eaf5fc] text-[#001a6e] px-0.5 py-0.5 rounded-md border border-blue-100/50 font-bold text-[6px] whitespace-nowrap">
                                    <MapPin className="w-1.5 h-1.5 ml-0.5" />{job.location}
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Button */}
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
                                } px-2 md:px-4 py-1 md:py-1.5 h-6 md:h-9 rounded-full font-bold w-16 md:w-32 text-[9px] md:text-sm view-job-button transition-colors duration-300`}>
                                <Link
                                  to={createPageUrl(`JobDetailsSeeker?id=${job.id}&from=Dashboard`)}
                                  onClick={() => {
                                    if (user?.email) {
                                      UserAnalytics.trackJobView(user, job);
                                      setViewedJobIds(prev => new Set(prev).add(String(job.id)));
                                    }
                                  }}
                                >
                                  {appliedJobIds.has(String(job.id))
                                    ? "הוגשה"
                                    : viewedJobIds.has(String(job.id))
                                      ? "נצפה"
                                      : "צפייה"}
                                </Link>
                              </Button>
                            </div>
                          </div>

                          {/* Bottom Row: Match Bar */}
                          <div className="flex flex-col md:flex-row items-center justify-between gap-1.5 md:gap-4 w-full">
                            {/* Chips Area (Desktop Only) */}
                            <div className="hidden md:flex gap-2 text-xs flex-nowrap">
                              <span className="flex items-center gap-1 bg-[#eaf5fc] text-[#001a6e] px-2.5 py-1 rounded-lg border border-blue-100/50 font-bold whitespace-nowrap">
                                <Clock className="w-3 h-3 ml-1 text-[#001a6e]" />{AVAILABILITY_TRANSLATIONS[job.start_date] || job.start_date || 'מיידית'}
                              </span>
                              <span className="flex items-center gap-1 bg-[#eaf5fc] text-[#001a6e] px-2.5 py-1 rounded-lg border border-blue-100/50 font-bold whitespace-nowrap">
                                <Briefcase className="w-3 h-3 ml-1 text-[#001a6e]" />{JOB_TYPE_TRANSLATIONS[job.employment_type] || 'משרה מלאה'}
                              </span>
                              <span className="flex items-center gap-1 bg-[#eaf5fc] text-[#001a6e] px-2.5 py-1 rounded-lg border border-blue-100/50 font-bold whitespace-nowrap">
                                <MapPin className="w-3 h-3 ml-1 text-[#001a6e]" />{job.location}
                              </span>
                            </div>

                            {/* Match Score Bar */}
                            <div className="relative h-5 md:h-5 bg-gray-200 border border-gray-300/30 rounded-full overflow-hidden shadow-inner w-full md:w-[65%]">
                              <div
                                className={`absolute right-0 top-0 h-full transition-all duration-700 ${(job.match_score ?? 0) >= 70 ? 'bg-green-500' : (job.match_score ?? 0) >= 40 ? 'bg-orange-500' : 'bg-red-500'}`}
                                style={{ width: `${job.match_score ?? 0}%` }}
                              ></div>
                              <div className="absolute inset-0 flex items-center justify-center text-[9px] md:text-[11px] font-bold text-black z-10 pointer-events-none">
                                {job.match_score ?? 0}% התאמה
                              </div>
                            </div>
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

  const handleNextNotification = () => {
    setCurrentNotificationIndex((prev) => (prev + 1) % notifications.length);
  };

  const handlePrevNotification = () => {
    setCurrentNotificationIndex((prev) => (prev - 1 + notifications.length) % notifications.length);
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
        console.log('[Dashboard] allUserJobs found:', allUserJobs.length);

        const activeStatuses = ['active', 'paused'];
        const activeJobs = allUserJobs.filter(job => activeStatuses.includes(job.status));
        console.log('[Dashboard] activeJobs:', activeJobs.length);

        // 5. Get other dashboard data (Activity, etc.)
        const [recentActions, dashboardData] = await Promise.all([
          EmployerAction.filter({
            employer_email: userData.email,
            action_type: 'candidate_view'
          }, "-created_date", 1000),
          EmployerAnalytics.getDashboardData(userData.email)
        ]);

        const myJobIds = allUserJobs.map(j => j.id);

        // Fetch ALL applications and views for ALL user jobs
        const [allAppsFlatUnsorted, allViewsFlat] = await Promise.all([
          (await Promise.all(myJobIds.map(async (jobId) => {
            return await JobApplication.filter({ job_id: jobId });
          }))).flat(),
          (await Promise.all(myJobIds.map(async (jobId) => {
            return await JobView.filter({ job_id: jobId });
          }))).flat()
        ]);

        const allAppsFlat = allAppsFlatUnsorted
          .filter(app => app.status !== 'rejected' && app.status !== 'irrelevant') // Filter out rejected/irrelevant applications
          .sort((a, b) => new Date(b.created_date) - new Date(a.created_date));

        const realTotalApps = allAppsFlat.length;
        const realTotalViews = allViewsFlat.length;
        console.log(`📊 Dashboard: Final Sync - Apps: ${realTotalApps}, Views: ${realTotalViews}`);

        // Map EmployerAction to a format compatible with viewedCandidates state
        const viewedCandidatesData = recentActions.map(action => ({
          candidate_email: action.additional_data?.candidate_email,
          candidate_name: action.additional_data?.candidate_name,
          job_id: action.additional_data?.job_id,
          viewed_at: action.created_date
        }));

        // 6. Fetch actual candidate profiles for the "Candidates" tab/list below (retaining previous logic)
        // We can reuse allUserJobs or fetch again. Let's reuse activeJobs for the "Recent Applications" list context if preferred, 
        // OR fetch for ALL jobs if we want to show all candidates. 
        // Typically the candidates list shows *recent* applicants across all jobs.
        // Let's keep the broad fetch for the list but use the focused counts for the cards.

        let applicantProfiles = [];

        // ... (Existing applicant processing logic continues below in the file, we just need to ensure we don't break it)
        // But since we are replacing a block, we need to be careful to reconnect variables.

        // Re-implementing the Applicant Profile Fetching needed for the list (lines 692-748 original)
        // because we are replacing the start of the block.

        // allAppsFlat is already fetched above
        console.log('[Dashboard] Total apps flat:', allAppsFlat.length);

        // Create job map for easy title lookup
        const myJobMap = allUserJobs.reduce((acc, job) => ({ ...acc, [job.id]: job.title }), {});

        // Build list of applications (NOT deduplicated by candidate)
        const applicationRefs = [];
        const seenJobApps = new Set(); // To avoid truly duplicate applications for the same job

        for (const app of allAppsFlat) {
          const email = app.applicant_email?.toLowerCase();
          const applicantKey = app.applicant_id || email;
          const jobAppKey = `${app.job_id}_${applicantKey}`;

          if (!seenJobApps.has(jobAppKey)) {
            applicationRefs.push({
              applicant_id: app.applicant_id,
              applicant_email: email,
              job_id: app.job_id,
              job_title: myJobMap[app.job_id] || 'משרה לא ידועה',
              application_id: app.id
            });
            seenJobApps.add(jobAppKey);
          }
          if (applicationRefs.length >= 50) break;
        }
        console.log('[Dashboard] applicationRefs created:', applicationRefs.length);

        if (applicationRefs.length > 0) {
          const profiles = await Promise.all(applicationRefs.map(async (ref) => {
            try {
              let p = null;
              if (ref.applicant_id) {
                const results = await UserProfile.filter({ id: ref.applicant_id });
                if (results.length > 0) p = results[0];
              }
              if (!p && ref.applicant_email) {
                let results = await UserProfile.filter({ email: ref.applicant_email });
                if (results.length === 0) {
                  results = await UserProfile.filter({ email: ref.applicant_email.toLowerCase() });
                }
                if (results.length > 0) p = results[0];
              }

              if (p) {
                // Enrich profile with application context
                const profileWithContext = {
                  ...p,
                  applied_job_id: ref.job_id,
                  applied_job_title: ref.job_title,
                  application_id: ref.application_id,
                  // Unique combined ID for React key
                  unique_app_id: `${p.id || p.email}_${ref.job_id}`
                };

                // Calculate Real Match Score
                const job = allUserJobs.find(j => j.id === ref.job_id);
                if (job) {
                  try {
                    // Parse structured fields using safeParseJSON to handle hex strings like JobDetails does
                    const parsedJob = { ...job };
                    if (safeParseJSON) {
                      parsedJob.structured_requirements = safeParseJSON(job.structured_requirements, []);
                      parsedJob.structured_certifications = safeParseJSON(job.structured_certifications, []);
                      parsedJob.structured_education = safeParseJSON(job.structured_education, []);

                      // Also parse standard fields if they are JSON strings
                      parsedJob.requirements = safeParseJSON(job.requirements, []);
                      parsedJob.responsibilities = safeParseJSON(job.responsibilities, []);
                    }

                    if (typeof calculate_match_score === 'function') {
                      const score = await calculate_match_score(p, parsedJob);
                      profileWithContext.match_score = score !== null ? Math.round(score * 100) : 0;
                    } else {
                      console.error("calculate_match_score is not a function");
                      profileWithContext.match_score = 0;
                    }
                  } catch (err) {
                    console.error("Dashboard match calc error:", err);
                    profileWithContext.match_score = 0;
                  }
                }

                return profileWithContext;
              } else {
                console.warn('[Dashboard] Profile not found for ref:', ref.applicant_email);
              }
            } catch (e) { console.error('[Dashboard] Error fetching profile:', e); }
            return null;
          }));
          applicantProfiles = profiles.filter(p => p !== null);
          console.log('[Dashboard] Final applicantProfiles:', applicantProfiles.length);
        }

        let notificationsData = [];
        try {
          notificationsData = await Notification.filter({ is_read: 'false', user_id: userData.id }, "-created_date", 5);
        } catch (err) {
          try {
            notificationsData = await Notification.filter({ is_read: 'false', email: userData.email }, "-created_date", 5);
          } catch (err2) { }
        }

        const filteredNotifications = notificationsData.filter(notif =>
          EMPLOYER_ALLOWED_NOTIFICATION_TYPES.includes(notif.type)
        );

        // Construct the stats object using our DIRECTLY CALCULATED values
        const enhancedStats = {
          ...dashboardData.stats,
          total_jobs_published: activeJobs.length,      // Active + Paused jobs
          total_applications_received: allAppsFlatUnsorted.length,   // SYNC: Use total unfiltered applications count (matches "CVs submitted" statistic)
          total_job_views: realTotalViews,              // Sum of views for Active/Paused jobs
          total_candidates_viewed: viewedCandidatesData.length,
          conversion_rate: realTotalViews > 0
            ? ((applicantProfiles.length / realTotalViews) * 100).toFixed(1)
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

  // Note: Candidate application enrichment is now handled directly in loadData
  // to support multiple applications from the same seeker to different jobs.

  const handleViewCandidate = async (candidate) => {
    // 1. Track Analytics with Job Context
    try {
      if (user?.email) {
        const jobContext = candidate.applied_job_id ? {
          id: candidate.applied_job_id,
          title: candidate.applied_job_title
        } : null;

        await EmployerAnalytics.trackCandidateView(user.email, candidate, jobContext);

        // Update local state by fetching latest candidate_view actions
        // This ensures the "Watched" filter updates immediately
        const recentActions = await EmployerAction.filter(
          {
            employer_email: user.email,
            action_type: 'candidate_view'
          },
          "-created_date",
          1000
        );

        // Map EmployerAction to a format compatible with viewedCandidates state
        const mappedViews = recentActions.map(action => ({
          candidate_email: action.additional_data?.candidate_email,
          candidate_name: action.additional_data?.candidate_name,
          job_id: action.additional_data?.job_id,
          viewed_at: action.created_date
        }));

        setViewedCandidates(mappedViews);
      }
    } catch (error) {
      console.error("[Dashboard] Error tracking candidate view:", error);
    }
  };

  const handleCandidateClick = async (candidate, match) => {
    // Show loading state if desired, or just wait
    await handleViewCandidate(candidate);

    const targetUrl = createPageUrl(`CandidateProfile?id=${candidate.id}&match=${match}&jobId=${candidate.applied_job_id}`);
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
      const matchIdentity = (vc.candidate_email && vc.candidate_email === c.email) ||
        (vc.candidate_name?.trim().toLowerCase() === c.full_name?.trim().toLowerCase());

      if (!matchIdentity) return false;

      // STRICT CHECK: Only mark as viewed for the SPECIFIC job
      return vc.job_id === c.applied_job_id;
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
      <div className="max-w-7xl w-full md:w-[72%] mx-auto space-y-4 pt-4 md:pt-1 px-3 md:px-6 md:pb-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="text-right px-2 md:px-4 flex justify-between items-center">
          <h1 className="text-xl md:text-lg font-bold text-[#001D3D] md:text-gray-900 mb-1 mt-2">
            {user.company_name?.trim() ? ` היי ${user.company_name} 👋` : 'היי 👋'}
          </h1>

        </motion.div>

        <div className="space-y-4">
          {/* Enhanced Stats Grid with Real Analytics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-12 stats-grid justify-items-center">
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
            <Card className="relative col-span-1 bg-[#84CC9E] text-white border-0 shadow-md md:shadow-[0_8px_30px_-8px_rgba(0,0,0,0.12)] hover:shadow-lg transition-all duration-300 rounded-[8px] md:rounded-2xl w-[148px] md:w-full h-[97px] md:h-full create-job-card">
              <Link to={createPageUrl("CreateJob")}>
                <CardContent className="py-2 md:py-3 px-2 md:px-3 text-center flex flex-col items-center justify-center h-full">
                  <div className="w-[32px] md:w-[44px] h-[32px] md:h-[44px] bg-white/30 rounded-full flex items-center justify-center mx-auto mb-1 md:mb-2"><Plus className="w-[18px] md:w-[22px] h-[18px] md:h-[22px] text-white" /></div>
                  <h3 className="font-bold text-[12px] md:text-[15px] mb-0.5 leading-tight">פרסום משרה חדשה</h3>
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
            <h2 className="text-md md:text-lg font-bold text-gray-900 mb-2 px-2">מועמדים שהגישו מועמדות</h2>
            {displayedCandidates.length > 0 ? (displayedCandidates.map((candidate, index) => {
              // Use real calculated match score if available, fallback to 0 (or hide?)
              const match = (candidate.match_score !== undefined && candidate.match_score !== null) ? candidate.match_score : 0;
              const jobAppliedTo = candidateApplications[candidate.email];

              // Use global maps for translations

              return (
                <motion.div key={candidate.unique_app_id || candidate.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: index * 0.1 }}>
                  <Card className="bg-white border border-gray-200/90 shadow-sm hover:shadow-lg transition-all duration-300 rounded-2xl">
                    <CardContent className="p-2 md:p-4">
                      <div className="flex flex-col gap-1.5 md:gap-4">
                        <div className="flex items-center justify-between gap-1.5 md:gap-4">
                          <div className="flex items-center gap-2 md:gap-4 flex-1">
                            <div className="w-12 h-12 md:w-16 md:h-16 rounded-full overflow-hidden shadow-md border-2 border-white flex-shrink-0">
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
                              <h3 className="font-bold text-sm md:text-lg text-gray-900 leading-tight">
                                {(() => {
                                  if (candidate.full_name && candidate.full_name.trim().length > 0) return candidate.full_name;
                                  if (candidate.email) return candidate.email;
                                  return 'מועמד ללא שם';
                                })()}
                              </h3>
                              <p className="text-gray-500 text-[11px] md:text-sm mt-0.5">
                                {candidate.applied_job_title || jobAppliedTo || candidate.experience_level?.replace('_', ' ') || "ללא ניסיון"}
                              </p>
                            </div>
                          </div>

                          <div className="flex-shrink-0">
                            <Button
                              className={`text-white px-2 md:px-6 py-1 md:py-1.5 h-6 md:h-9 rounded-full font-bold w-16 md:w-32 text-[9px] md:text-sm view-candidate-button transition-colors duration-300 ${match >= 70 ? 'bg-green-400 hover:bg-green-500' : match >= 40 ? 'bg-orange-400 hover:bg-orange-500' : 'bg-red-400 hover:bg-red-500'
                                }`}
                              onClick={() => handleCandidateClick(candidate, match)}
                            >
                              {viewedCandidates.some(vc => vc.candidate_email === candidate.email && vc.job_id === candidate.applied_job_id) ? "נצפה" : "לצפייה"}
                            </Button>
                          </div>
                        </div>

                        <div className="flex flex-col sm:flex-row items-center gap-1.5 md:gap-4 w-full">
                          <div className="flex flex-row flex-wrap md:flex-wrap gap-1 md:gap-2 items-center justify-start w-full md:w-auto">
                            <div className="flex items-center gap-0.5 md:gap-1 bg-blue-50 text-blue-700 px-1.5 py-0.5 md:px-2.5 md:py-1 rounded-md md:rounded-lg border border-blue-100/50 text-[9px] md:text-xs font-bold whitespace-nowrap">
                              <MapPin className="w-2.5 h-2.5 md:w-3.5 md:h-3.5" />
                              <span>{candidate.preferred_location || "לא צוין"}</span>
                            </div>

                            <div className="flex items-center gap-0.5 md:gap-1 bg-blue-50 text-blue-700 px-1.5 py-0.5 md:px-2.5 md:py-1 rounded-md md:rounded-lg border border-blue-100/50 text-[9px] md:text-xs font-bold whitespace-nowrap">
                              <Briefcase className="w-2.5 h-2.5 md:w-3.5 md:h-3.5" />
                              <span>
                                {candidate.preferred_job_types?.length > 0
                                  ? (JOB_TYPE_TRANSLATIONS[candidate.preferred_job_types[0]] || candidate.preferred_job_types[0])
                                  : "לא צוין"}
                              </span>
                            </div>

                            <div className="flex items-center gap-0.5 md:gap-1 bg-blue-50 text-blue-700 px-1.5 py-0.5 md:px-2.5 md:py-1 rounded-md md:rounded-lg border border-blue-100/50 text-[9px] md:text-xs font-bold whitespace-nowrap">
                              <Clock className="w-2.5 h-2.5 md:w-3.5 md:h-3.5" />
                              <span>
                                {candidate.availability
                                  ? (AVAILABILITY_TRANSLATIONS[candidate.availability] || candidate.availability)
                                  : "לא צוין"}
                              </span>
                            </div>
                          </div>

                          {match >= 0 && (
                            <div className="w-full md:flex-1 relative h-3.5 bg-gray-200 rounded-full overflow-hidden shadow-inner mt-2 md:mt-0">
                              <div
                                className={`absolute right-0 top-0 h-full transition-all duration-700 ${match >= 70 ? 'bg-green-400/90' : match >= 40 ? 'bg-orange-400/90' : 'bg-red-400/90'}`}
                                style={{ width: `${match}%` }}
                              ></div>
                              <div className="absolute inset-0 flex items-center justify-center text-[9px] font-bold text-black z-10 pointer-events-none">
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