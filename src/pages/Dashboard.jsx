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
  Sparkles,
  ChevronDown
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
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

const JsProfileViewsIcon = (props) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <path d="M12 4.5C7 4.5 2.73 7.61 1 12C2.73 16.39 7 19.5 12 19.5C17 19.5 21.27 16.39 23 12C21.27 7.61 17 4.5 12 4.5ZM12 17C9.24 17 7 14.76 7 12C7 9.24 9.24 7 12 7C14.76 7 17 9.24 17 12C17 14.76 14.76 17 12 17ZM12 9C10.34 9 9 10.34 9 12C9 13.66 10.34 15 12 15C13.66 15 15 13.66 15 12C15 10.34 13.66 9 12 9Z" fill="currentColor" />
  </svg>
);

// --- ACCORDION COMPONENT ---
const AccordionItem = ({ id, title, children, isOpen, onClick }) => {
  return (
    <div className="w-full bg-white rounded-3xl overflow-hidden shadow-[0_4px_24px_-8px_rgba(0,0,0,0.06)] border border-gray-100/50" id={id}>
      <button
        className="w-full px-6 py-5 flex items-center justify-between flex-row"
        onClick={onClick}
      >
        <h3 className="text-[18px] font-bold text-[#001D3D]">{title}</h3>
        <ChevronDown className={`w-6 h-6 text-[#001D3D]/40 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="px-6 pb-6 text-right">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

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
  const [allJobs, setAllJobs] = useState([]);
  const [viewedJobIds, setViewedJobIds] = useState(new Set());
  const [appliedJobIds, setAppliedJobIds] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [showGuide, setShowGuide] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [userStats, setUserStats] = useState(null);
  const [showCareerModal, setShowCareerModal] = useState(false);
  const [hasCV, setHasCV] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasCompletedOnboardingFlow, setHasCompletedOnboardingFlow] = useState(false);
  const [currentJobIndex, setCurrentJobIndex] = useState(0);
  const [activeTab, setActiveTab] = useState('about');
  const ITEMS_PER_PAGE = 10;
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  useEffect(() => {
    if (loading || !user) return;
    if (hasCompletedOnboardingFlow) return;

    const params = new URLSearchParams(location.search);
    const forceOnboarding = params.get('onboarding') === 'complete';

    if (forceOnboarding) {
      setHasCompletedOnboardingFlow(true);
      const newParams = new URLSearchParams(params);
      newParams.delete('onboarding');
      navigate(location.pathname + (newParams.toString() ? `?${newParams.toString()}` : ''), { replace: true });
    }

    if (forceOnboarding || (!user.career_stage && !user.is_onboarding_completed)) {
      setShowCareerModal(true);
      return;
    }

    if (!hasCV) return;

    const hasSeenGuide = localStorage.getItem(`jobseeker_guide_${user?.email}`);
    if (!hasSeenGuide) {
      setShowGuide(true);
    }
  }, [user, loading, hasCV, hasCompletedOnboardingFlow]);

  useEffect(() => {
    if (hasCompletedOnboardingFlow) {
      window.history.pushState(null, "", window.location.pathname);
      const handlePopState = () => {
        window.history.pushState(null, "", window.location.pathname);
        toast({
          title: "תהליך הרישום הושלם!",
          description: "ברוכים הבאים למחלקת המועמדים. כעת ניתן להתחיל בחיפוש משרות.",
        });
      };
      window.addEventListener("popstate", handlePopState);
      return () => window.removeEventListener("popstate", handlePopState);
    }
  }, [hasCompletedOnboardingFlow, toast]);

  const handleGuideComplete = () => {
    setShowGuide(false);
    if (user?.email) localStorage.setItem(`jobseeker_guide_${user.email}`, 'completed');
  };

  const handleNextJob = () => {
    setCurrentJobIndex((prev) => (prev + 1) % displayedJobs.length);
    setActiveTab('about');
  };

  const handlePrevJob = () => {
    setCurrentJobIndex((prev) => (prev - 1 + displayedJobs.length) % displayedJobs.length);
    setActiveTab('about');
  };

  const handleNextNotification = () => {
    setCurrentNotificationIndex((prev) => (prev + 1) % notifications.length);
  };

  const handlePrevNotification = () => {
    setCurrentNotificationIndex((prev) => (prev - 1 + notifications.length) % notifications.length);
  };

  const handleCareerStageComplete = () => {
    setHasCompletedOnboardingFlow(true);
    setShowCareerModal(false);
    const params = new URLSearchParams(location.search);
    if (params.get('onboarding') === 'complete') {
      navigate(location.pathname, { replace: true });
      setTimeout(() => setShowGuide(true), 500);
    } else if (!localStorage.getItem(`jobseeker_guide_${user?.email}`)) {
      setShowGuide(true);
    }
  };

  const handleGuideSkip = () => {
    setShowGuide(false);
    if (user?.email) localStorage.setItem(`jobseeker_guide_${user.email}`, 'skipped');
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      if (!user) return;
      try {
        const [jobsData, jobViewsData, notificationsData, statsData, profileViewsData, userProfile, applicationsData, userCv] = await Promise.all([
          Job.filter({ status: 'active' }, "-created_date", 100),
          JobView.filter({ viewer_id: user.id }),
          Notification.filter({ user_id: user.id }, "-created_date", 5),
          UserAnalytics.getUserStats(user.id),
          CandidateView.filter({ candidate_id: user.id }),
          UserProfile.filter({ id: user.id }).then(p => p[0] || null),
          JobApplication.filter({ applicant_id: user.id }),
          CV.filter({ user_email: user.email }).then(c => c[0] || null)
        ]);

        const enhancedProfile = { ...userProfile, ...(userCv || {}) };
        const jobsWithScores = await Promise.all(jobsData.map(async (job) => {
          let score = 0;
          if (enhancedProfile) {
            try {
              score = await calculate_match_score(enhancedProfile, job, { prefers_no_career_change: enhancedProfile.prefers_no_career_change });
            } catch (e) { console.error(e); }
          }
          return { ...job, match_score: score !== null ? Math.round(score * 100) : 0 };
        }));

        jobsWithScores.sort((a, b) => b.match_score - a.match_score);
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

        setAllJobs([mockJob, ...jobsWithScores.slice(0, 30)]);
        setViewedJobIds(new Set(jobViewsData.map(v => String(v.job_id))));
        setAppliedJobIds(new Set(applicationsData.map(a => String(a.job_id))));
        setNotifications(notificationsData.filter(n => ['new_message', 'profile_view'].includes(n.type)));
        setUserStats({ ...statsData, profile_views: profileViewsData.length, resume_views: profileViewsData.length });
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    loadData();
  }, [user]);

  const StatCard = ({ icon: Icon, title, value }) => (
    <Card className="bg-white border border-gray-100 shadow-md rounded-2xl w-full">
      <CardContent className="py-4 px-3 text-center flex flex-col items-center justify-center h-full">
        <div className="w-11 h-11 rounded-full border-[1.8px] flex items-center justify-center mb-2" style={{ borderColor: '#2987cd' }}>
          <Icon className="w-5 h-5 text-[#2987cd]" />
        </div>
        <p className="text-blue-900 font-bold text-sm mb-0.5">{title}</p>
        <div className="text-xl text-gray-500 font-normal">{value}</div>
      </CardContent>
    </Card>
  );

  const displayedJobs = allJobs.filter(job => {
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      return job.title?.toLowerCase().includes(term) || job.company?.toLowerCase().includes(term);
    }
    if (jobFilter === 'new') return !viewedJobIds.has(String(job.id));
    if (jobFilter === 'viewed') return viewedJobIds.has(String(job.id));
    return true;
  });

  const paginatedJobs = displayedJobs.slice(0, currentPage * ITEMS_PER_PAGE);
  const observerRef = useRef();

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && paginatedJobs.length < displayedJobs.length) {
        setCurrentPage((prev) => prev + 1);
      }
    }, { threshold: 0.1 });
    if (observerRef.current) observer.observe(observerRef.current);
    return () => { if (observerRef.current) observer.unobserve(observerRef.current); };
  }, [paginatedJobs.length, displayedJobs.length]);

  return (
    <>
      <div className="min-h-screen bg-transparent md:bg-transparent" dir="rtl">
        <div className="md:hidden flex flex-col min-h-screen bg-[#F8FBFF] overflow-x-hidden">
          <div className="fixed top-0 left-0 right-0 z-[100] px-6 pt-10 pointer-events-none">
            <div className="bg-white/90 rounded-full h-[62px] px-6 flex flex-row-reverse items-center justify-between shadow-sm border border-white/50 backdrop-blur-md pointer-events-auto max-w-md mx-auto">
              <Button variant="ghost" size="icon" className="rounded-full text-[#001D3D] p-0">
                <Menu className="w-8 h-8 stroke-[1.5px]" />
              </Button>
              <div className="flex items-center gap-1.5 direction-ltr" dir="ltr">
                <Sparkles className="w-5 h-5 text-[#2987CD] fill-[#2987CD]/20" />
                <span className="text-[25px] font-bold tracking-tight text-[#001D3D]">Metch</span>
              </div>
            </div>
          </div>

          <div className="relative w-full h-[300px] bg-gradient-to-b from-[#EBF5FF] to-[#D0E9FF] overflow-visible">
            <div className="absolute bottom-0 left-[-25%] w-[150%] h-40 bg-[#F8FBFF] rounded-[50%_50%_0_0] z-10 translate-y-[1px]"></div>
            <div className="absolute top-[150px] left-0 right-0 px-6 flex justify-between z-50 pointer-events-none">
              <Button variant="secondary" size="icon" className="w-10 h-10 rounded-full shadow-lg bg-white/95 pointer-events-auto active:scale-90" onClick={handlePrevJob}>
                <ChevronLeft className="w-6 h-6 text-[#2987CD]/60" />
              </Button>
              <Button variant="secondary" size="icon" className="w-10 h-10 rounded-full shadow-lg bg-white/95 pointer-events-auto active:scale-90" onClick={handleNextJob}>
                <ChevronRight className="w-6 h-6 text-[#2987CD]/80" />
              </Button>
            </div>
          </div>

          <div className="flex-1 bg-[#F8FBFF] relative z-20 -mt-20">
            {!loading && displayedJobs.length > 0 && (
              <div className="relative">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={displayedJobs[currentJobIndex]?.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3 }}
                    className="flex flex-col items-center"
                    onAnimationComplete={() => {
                      const currentJob = displayedJobs[currentJobIndex];
                      if (currentJob && currentJob.id && !String(currentJob.id).startsWith('f0000000')) {
                        UserAnalytics.trackJobView(user, currentJob);
                      }
                    }}
                  >
                    <div className="w-24 h-24 rounded-full overflow-hidden shadow-xl border-4 border-white mb-6 bg-white flex-shrink-0 -mt-12 z-30">
                      <img
                        src={displayedJobs[currentJobIndex]?.company_logo_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(displayedJobs[currentJobIndex]?.company)}&background=random`}
                        alt={displayedJobs[currentJobIndex]?.company}
                        className="w-full h-full object-contain p-2"
                      />
                    </div>

                    <div className="w-full px-6 flex flex-col items-center">
                      <h2 className="text-[22px] font-bold text-[#001D3D] mb-4 text-center leading-tight">{displayedJobs[currentJobIndex]?.title}</h2>
                      <div className="flex flex-wrap justify-center gap-2 mb-6">
                        <span className="bg-[#EBF5FF] text-[#2987CD] px-3.5 py-1.5 rounded-lg flex items-center gap-2 font-bold text-[13px]"><MapPin className="w-3.5 h-3.5" />מרכז</span>
                        <span className="bg-[#EBF5FF] text-[#2987CD] px-3.5 py-1.5 rounded-lg flex items-center gap-2 font-bold text-[13px]"><Briefcase className="w-3.5 h-3.5" />משרה מלאה</span>
                        <span className="bg-[#EBF5FF] text-[#2987CD] px-3.5 py-1.5 rounded-lg flex items-center gap-2 font-bold text-[13px]"><Clock className="w-3.5 h-3.5" />מיידי</span>
                      </div>

                      <div className="w-full max-w-[300px] mb-8">
                        <div className="relative h-4 bg-gray-100 rounded-full overflow-hidden border border-gray-100">
                          <div className="absolute right-0 top-0 h-full bg-[#56D48F] transition-all duration-700" style={{ width: `${displayedJobs[currentJobIndex]?.match_score ?? 0}%` }}></div>
                          <div className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-[#001D3D] z-10 pointer-events-none">{displayedJobs[currentJobIndex]?.match_score ?? 0}% התאמה</div>
                        </div>
                      </div>

                      <div className="w-full flex justify-between px-2 mb-8 border-b border-gray-100/50 overflow-x-auto no-scrollbar">
                        {['על המשרה', 'דרישות', 'תחומי אחריות', 'הגשת מועמדויות'].map((tab, i) => {
                          const tabIds = ['about', 'requirements', 'responsibilities', 'apply'];
                          return (
                            <button
                              key={tabIds[i]}
                              onClick={() => {
                                setActiveTab(tabIds[i]);
                                const el = document.getElementById(`accordion-${tabIds[i]}`);
                                if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                              }}
                              className={`pb-3 text-[14px] font-bold transition-all relative whitespace-nowrap px-2 ${activeTab === tabIds[i] ? 'text-[#2987CD]' : 'text-gray-400'}`}
                            >
                              {tab}
                              {activeTab === tabIds[i] && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#2987CD]" />}
                            </button>
                          );
                        })}
                      </div>

                      <div className="grid grid-cols-4 gap-1.5 w-full px-1 mb-10">
                        {['משרד מפנק', 'עבודה במשמרות', 'רכב חברה', 'סיבוס', 'עובד חברה', 'סיבוס', 'טלפון אישי', 'שעות גמישות'].map((label, i) => (
                          <div key={i} className="flex items-center gap-1 bg-white border border-gray-100/50 px-2 py-1.5 rounded-full shadow-sm justify-center">
                            <CheckCircle className="w-3 h-3 text-[#56D48F]" />
                            <span className="text-[10px] font-bold text-[#001D3D]/80 whitespace-nowrap">{label}</span>
                          </div>
                        ))}
                      </div>

                      <div className="w-full space-y-4 px-2 mb-8 text-right">
                        <AccordionItem id="accordion-about" title="על המשרה" isOpen={activeTab === 'about'} onClick={() => setActiveTab(activeTab === 'about' ? '' : 'about')}>
                          <div className="text-right text-[15px] leading-relaxed text-[#001D3D]/70">{displayedJobs[currentJobIndex]?.description || "פרטי המשרה..."}</div>
                        </AccordionItem>
                        <AccordionItem id="accordion-requirements" title="דרישות" isOpen={activeTab === 'requirements'} onClick={() => setActiveTab(activeTab === 'requirements' ? '' : 'requirements')}>
                          <ul className="text-right pr-6 list-disc text-[15px] space-y-2 text-[#001D3D]/70">
                            {displayedJobs[currentJobIndex]?.requirements?.map((req, i) => <li key={i}>{req}</li>) || <li>דרישות המשרה...</li>}
                          </ul>
                        </AccordionItem>
                        <AccordionItem id="accordion-responsibilities" title="תחומי אחריות" isOpen={activeTab === 'responsibilities'} onClick={() => setActiveTab(activeTab === 'responsibilities' ? '' : 'responsibilities')}>
                          <ul className="text-right pr-6 list-disc text-[15px] space-y-2 text-[#001D3D]/70">
                            {displayedJobs[currentJobIndex]?.responsibilities?.map((res, i) => <li key={i}>{res}</li>) || <li>תחומי אחריות...</li>}
                          </ul>
                        </AccordionItem>
                      </div>

                      <div className="w-full px-4 mb-32">
                        <div className="bg-white rounded-[32px] p-8 border border-gray-100 shadow-sm relative overflow-hidden">
                          <div className="flex items-center gap-2 mb-6 justify-center">
                            <Sparkles className="w-5 h-5 text-[#2987CD]" />
                            <h3 className="text-[20px] font-bold text-[#001D3D]">מה מאץ׳ חושב על ההתאמה?</h3>
                          </div>
                          <div className="text-right text-[15px] leading-relaxed text-[#001D3D]/70 space-y-4">
                            <p>המשרה הזו מתאימה לך כי היא מבוססת בדיוק על שילוב היכולות והניסיון שצברת...</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                </AnimatePresence>
              </div>
            )}
          </div>
        </div>

        <div className="hidden md:block max-w-7xl w-full md:w-[68%] mx-auto pt-0 md:pt-1 md:px-6 md:pb-6 relative z-10">
          <div className="bg-transparent rounded-none min-h-[90vh] md:min-h-0">
            <div className="space-y-6">
              <div className="hidden md:grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-12 stats-grid justify-items-center">
                <StatCard icon={JsRelevantJobsIcon} title="משרות רלוונטיות" value={allJobs.length} />
                <StatCard icon={JsCvIcon} title="מועמדויות שהגשת" value={userStats?.total_applications || 0} />
                <StatCard icon={JsApplicationsIcon} title="קורות חיים שנצפו" value={userStats?.resume_views || userStats?.profile_views || 0} />
                <StatCard icon={JsProfileViewsIcon} title="צפו בכרטיס שלי" value={userStats?.profile_views || 0} />
              </div>

              <Card className="hidden md:block bg-[#E7F2F7] shadow-none border-0 rounded-lg">
                <CardContent className="py-2.5 px-4">
                  <div className="flex items-center justify-between">
                    <Button variant="ghost" className="rounded-full w-8 h-8 p-0" onClick={handleNextNotification} disabled={notifications.length <= 1}><ChevronRight className="w-5 h-5 text-blue-600" /></Button>
                    <div className="text-center flex items-center gap-3 overflow-hidden">
                      <p className="text-blue-800 font-semibold text-sm sm:text-base whitespace-nowrap">{notifications[currentNotificationIndex]?.message || "אין התראות חדשות"}</p>
                      {notifications.length > 1 && (<div className="flex gap-1.5">{notifications.map((_, index) => (<div key={index} className={`w-2 h-2 rounded-full ${index === currentNotificationIndex ? 'bg-blue-600' : 'bg-gray-300'}`} />))}</div>)}
                    </div>
                    <Button variant="ghost" className="rounded-full w-8 h-8 p-0" onClick={handlePrevNotification} disabled={notifications.length <= 1}><ChevronLeft className="w-5 h-5 text-blue-600" /></Button>
                  </div>
                </CardContent>
              </Card>

              <div className="hidden md:flex flex-col md:flex-row gap-6 md:gap-4 items-center justify-between">
                <ToggleSwitch options={[{ value: 'viewed', label: 'משרות שצפית' }, { value: 'new', label: 'משרות חדשות' }]} value={jobFilter} onChange={setJobFilter} />
                <div className="relative w-full md:w-96">
                  <Input placeholder="אפשר גם לחפש" className="pl-12 pr-4 md:pr-4 py-2 border-0 border-b border-gray-200 md:border md:border-gray-300 rounded-full h-11 bg-white transition-all shadow-none" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                  <Search className="absolute left-0 md:left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                </div>
              </div>

              <div className="job-list relative">
                {loading ? (
                  <div className="text-center py-8 text-gray-500">טוען משרות...</div>
                ) : displayedJobs.length > 0 ? (
                  <div className="hidden md:block space-y-4">
                    {paginatedJobs.map((job) => (
                      <motion.div key={job.id} id={`job-${job.id}`} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
                        <Card className="bg-white border border-gray-200/90 shadow-sm hover:shadow-xl transition-all duration-300 rounded-2xl p-4">
                          <div className="flex flex-col gap-4">
                            <div className="flex items-center justify-between gap-4">
                              <div className="flex items-center gap-4 flex-1">
                                <div className="w-16 h-16 rounded-full overflow-hidden shadow-md border-2 border-white flex-shrink-0">
                                  <img src={job.company_logo_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(job.company)}&background=random`} alt={job.company} className="w-full h-full object-cover" />
                                </div>
                                <div className="text-right flex-1 min-w-0">
                                  <h3 className="font-bold text-lg text-gray-900 leading-tight truncate">{job.title}</h3>
                                  <p className="text-gray-500 text-sm mt-0.5 truncate">{job.company}</p>
                                </div>
                              </div>
                              <Button asChild className={`${appliedJobIds.has(String(job.id)) ? 'bg-gray-200 text-gray-700' : 'bg-[#2987CD] text-white'} px-4 py-1.5 h-9 rounded-full font-bold w-32`}>
                                <Link to={createPageUrl(`JobDetailsSeeker?id=${job.id}&from=Dashboard`)} onClick={() => { if (job.id && !String(job.id).startsWith('f0000000')) UserAnalytics.trackJobView(user, job); setViewedJobIds(prev => new Set(prev).add(String(job.id))); }}>
                                  {appliedJobIds.has(String(job.id)) ? "הוגשה" : viewedJobIds.has(String(job.id)) ? "נצפה" : "צפייה"}
                                </Link>
                              </Button>
                            </div>
                            <div className="flex flex-col md:flex-row items-center gap-4 w-full">
                              <div className="flex gap-2 text-xs">
                                <span className="bg-blue-50 text-blue-700 px-2.5 py-1 rounded-lg"><Clock className="w-3 h-3 ml-1" />{job.start_date || 'מיידית'}</span>
                                <span className="bg-blue-50 text-blue-700 px-2.5 py-1 rounded-lg"><Briefcase className="w-3 h-3 ml-1" />משרה מלאה</span>
                                <span className="bg-blue-50 text-blue-700 px-2.5 py-1 rounded-lg"><MapPin className="w-3 h-3 ml-1" />{job.location}</span>
                              </div>
                              <div className="relative h-5 bg-gray-200 rounded-full overflow-hidden w-full">
                                <div className={`absolute right-0 top-0 h-full ${(job.match_score ?? 0) >= 70 ? 'bg-green-500' : 'bg-orange-500'}`} style={{ width: `${job.match_score ?? 0}%` }}></div>
                                <div className="absolute inset-0 flex items-center justify-center text-[11px] font-bold text-black z-10 pointer-events-none">{job.match_score ?? 0}% התאמה</div>
                              </div>
                            </div>
                          </div>
                        </Card>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">{jobFilter === 'new' ? 'אין משרות חדשות.' : 'לא צפית במשרות.'}</div>
                )}
              </div>
              {paginatedJobs.length < displayedJobs.length && (
                <div ref={observerRef} className="flex justify-center items-center py-4">
                  <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <JobSeekerGuide isActive={showGuide} onComplete={handleGuideComplete} onSkip={handleGuideSkip} />
      <CareerStageModal isOpen={showCareerModal} onComplete={handleCareerStageComplete} />
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
        console.log('[Dashboard] allUserJobs found:', allUserJobs.length);

        const activeStatuses = ['active', 'paused'];
        const activeJobs = allUserJobs.filter(job => activeStatuses.includes(job.status));
        console.log('[Dashboard] activeJobs:', activeJobs.length);

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
        console.log('[Dashboard] Stats - Apps:', realTotalApps, 'Views:', realTotalViews);

        console.log(`📊 Dashboard: Calculated - Apps: ${realTotalApps}, Views: ${realTotalViews}`);

        // 5. Get other dashboard data (Activity, etc.)
        const [recentActions, dashboardData] = await Promise.all([
          EmployerAction.filter({
            employer_email: userData.email,
            action_type: 'candidate_view'
          }, "-created_date", 1000),
          EmployerAnalytics.getDashboardData(userData.email)
        ]);

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
                const results = await UserProfile.filter({ email: ref.applicant_email });
                if (results.length > 0) p = results[0];
              }

              if (p) {
                // Enrich profile with application context
                return {
                  ...p,
                  applied_job_id: ref.job_id,
                  applied_job_title: ref.job_title,
                  application_id: ref.application_id,
                  // Unique combined ID for React key
                  unique_app_id: `${p.id || p.email}_${ref.job_id}`
                };
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

  const handlePrevNotification = () => setCurrentNotificationIndex(prev => prev > 0 ? prev - 1 : (notifications.length - 1 || 0));
  const handleNextNotification = () => setCurrentNotificationIndex(prev => prev < (notifications.length - 1) ? prev + 1 : 0);



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
                <motion.div key={candidate.unique_app_id || candidate.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: index * 0.1 }}>
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
                                {candidate.applied_job_title || jobAppliedTo || candidate.experience_level?.replace('_', ' ') || "ללא ניסיון"}
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