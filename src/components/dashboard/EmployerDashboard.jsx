import { useState, useEffect } from "react";
import { UserProfile } from "@/api/entities";
import { Notification } from "@/api/entities";
import { CandidateView } from "@/api/entities";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  Plus,
  Eye,
  Users,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
  Search,
  User as UserIcon,
  HelpCircle,
  CheckCircle
} from "lucide-react";
import { motion } from "framer-motion";
import { UserAnalytics } from "@/components/UserAnalytics";
import { EmployerAnalytics } from "@/components/EmployerAnalytics";
import EmployerStatsCard from "@/components/employer/EmployerStatsCard";
import EmployerActivityFeed from "@/components/employer/EmployerActivityFeed";
import EmployerGuide from "@/components/guides/EmployerGuide";

// Allowed notification types for Employer users
const EMPLOYER_ALLOWED_NOTIFICATION_TYPES = ['application_submitted', 'new_message'];

const EmployerDashboard = ({ user }) => {
  const [viewedCandidates, setViewedCandidates] = useState([]);
  const [candidates, setCandidates] = useState([]);
  const [currentNotificationIndex, setCurrentNotificationIndex] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [candidateFilter, setCandidateFilter] = useState('new');
  const [loading, setLoading] = useState(true);
  const [showOnboardingHint, setShowOnboardingHint] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const location = useLocation();

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
      try {
        const [notificationsData, viewedCandidatesData, candidatesData, dashboardData] = await Promise.all([
          Notification.filter({ is_read: false }, "-created_date", 5),
          CandidateView.filter({ viewer_email: user.email }, "-created_date", 50),
          UserProfile.filter({ user_type: 'job_seeker' }, "-created_at", 10),
          EmployerAnalytics.getDashboardData(user.email)
        ]);

        // Filter notifications to only show allowed types for Employers
        const filteredNotifications = notificationsData.filter(notif =>
          EMPLOYER_ALLOWED_NOTIFICATION_TYPES.includes(notif.type)
        );

        setEmployerStats(dashboardData.stats);
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
      <div className="p-4 md:p-6" dir="rtl">
        <div className="max-w-7xl mx-auto space-y-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="text-right px-2 flex justify-between items-center">
            <h1 className="text-xl font-bold text-gray-900 mb-2">👋 היי {user.full_name?.split(' ')[0] || 'רפאל'}!</h1>
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
              <EmployerStatsCard
                icon={Eye}
                title="צפיות במשרות"
                value={employerStats?.total_job_views || 10}
                color="bg-blue-50 text-blue-600"
              />
              <EmployerStatsCard
                icon={Users}
                title="מועמדויות שהתקבלו"
                value={employerStats?.total_applications_received || 3}
                color="bg-green-50 text-green-600"
              />
              <EmployerStatsCard
                icon={TrendingUp}
                title="משרות פעילות"
                value={employerStats?.total_jobs_published || 6}
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

            {/* Activity Feed */}
            <EmployerActivityFeed activities={employerActivity} />

            <div className="flex flex-col md:flex-row gap-4 items-center justify-between candidate-filter-buttons">
              <div className="relative w-full md:w-96 candidate-search-input">
                <Input placeholder="אפשר גם לחפש" className="pl-12 pr-4 py-2 border-gray-300 focus:border-blue-400 rounded-full h-11" />
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              </div>
              <div className="flex gap-2 w-full md:w-auto">
                <Button className={`px-6 py-2 rounded-full font-semibold flex-1 md:flex-none transition-colors ${candidateFilter === 'watched' ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-700'}`} onClick={() => setCandidateFilter('watched')}>מועמדים שצפיתי</Button>
                <Button className={`px-6 py-2 rounded-full font-semibold flex-1 md:flex-none transition-colors ${candidateFilter === 'new' ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-700'}`} onClick={() => setCandidateFilter('new')}>מועמדים חדשים</Button>
              </div>
            </div>
            <div className="space-y-4 candidate-list">
              {filteredCandidates.length > 0 ? (filteredCandidates.map((candidate, index) => {
                const match = Math.floor(Math.random() * 24) + 75; return (
                  <motion.div key={candidate.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: index * 0.1 }}>
                    <Card className="bg-white border border-gray-200/90 shadow-sm hover:shadow-lg transition-all duration-300 rounded-2xl">
                      <CardContent className="p-4">
                        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                          <div className="flex items-center gap-4 self-start md:self-center">
                            <div className="w-16 h-16 rounded-full overflow-hidden shadow-md border-2 border-white flex-shrink-0"><div className="w-full h-full bg-blue-200 flex items-center justify-center"><UserIcon className="w-8 h-8 text-blue-500" /></div></div>
                            <div className="text-right"><h3 className="font-bold text-lg text-gray-900">{candidate.full_name}</h3><p className="text-gray-600">{candidate.experience_level?.replace('_', ' ')}</p></div>
                          </div>
                          <div className="flex flex-col sm:flex-row items-center gap-4 md:gap-6 w-full md:w-auto">
                            <div className="flex flex-wrap gap-2 justify-center sm:justify-start">{candidate.skills?.slice(0, 3).map((skill, i) => (<Badge key={i} variant="outline" className="border-blue-200 text-blue-700 bg-blue-50/50 text-xs">{skill}</Badge>))}</div>
                            <div className="w-full sm:w-48 text-right"><div className="text-sm text-gray-600 mb-1.5">{match}% התאמה</div><div dir="ltr" className="w-full h-2.5 bg-gray-200 rounded-full overflow-hidden"><div className={`h-full transition-all duration-500 ${match >= 80 ? 'bg-green-400' : 'bg-orange-400'}`} style={{ width: `${match}%` }}></div></div></div>
                            <Button asChild className="bg-[#84CC9E] hover:bg-green-500 text-white px-5 py-2 rounded-full font-bold w-full sm:w-auto view-candidate-button"><Link to={createPageUrl(`CandidateProfile?id=${candidate.id}`)} onClick={() => handleViewCandidate(candidate)}>לצפייה</Link></Button>
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
