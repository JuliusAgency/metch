
import React, { useState, useEffect } from "react";
import { User } from "@/api/entities";
import { Job } from "@/api/entities";
import { JobApplication } from "@/api/entities";
import { Notification } from "@/api/entities";
import { CandidateView } from "@/api/entities";
import { JobView } from "@/api/entities";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Link } from "react-router-dom";
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
  Briefcase,
  FileText,
  Sparkles,
  MapPin,
  Clock,
  Bell
} from "lucide-react";
import { motion } from "framer-motion";
import { UserAnalytics } from "@/components/UserAnalytics";

// --- MOCK DATA FOR JOB SEEKER DASHBOARD (NO LONGER USED FOR JOBS) ---
const MOCK_NOTIFICATIONS_SEEKER = [
  { id: 1, message: "מישהו בארומה צפה בקורות החיים שלך" },
  { id: 2, message: "התקבלה מועמדותך למשרת מנהל/ת מוצר ב-Wix" },
  { id: 3, message: "תזכורת: יש לך 5 משרות חדשות שמתאימות לך" },
];

const MOCK_STATS = {
    relevant_jobs: 6,
    applications_submitted: 3,
    cv_viewed: 8,
    profile_viewed: 10
};

// --- JOB SEEKER DASHBOARD COMPONENT (New) ---
const JobSeekerDashboard = ({ user }) => {
  const [jobFilter, setJobFilter] = useState('new');
  const [currentNotificationIndex, setCurrentNotificationIndex] = useState(0);
  const [allJobs, setAllJobs] = useState([]); // Renamed 'jobs' to 'allJobs'
  const [viewedJobIds, setViewedJobIds] = useState(new Set()); // New state for viewed job IDs
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => { // Renamed loadJobs to loadData
      setLoading(true);
      if (!user) return; // Ensure user is available before fetching
      try {
        let jobsData = [];
        let jobViewsData = [];

        // Try to fetch real data first
        if (!user.isDemo) {
          try {
            [jobsData, jobViewsData] = await Promise.all([
              Job.filter({ status: 'active' }, "-created_date", 50), // Fetch more jobs initially
              JobView.filter({ user_email: user.email }) // Fetch user's job views
            ]);
          } catch (error) {
            console.log("Failed to fetch real data for job seeker, using demo data");
          }
        }

        // Use demo data if real data failed or for demo users
        if (jobsData.length === 0) {
          jobsData = [
            {
              id: "demo-job-1",
              title: "מנהל/ת מכירות",
              company: "חברת SaaS מובילה",
              location: "תל אביב",
              employment_type: "full_time",
              start_date: "מיידי",
              match_score: 92,
              company_logo_url: "https://ui-avatars.com/api/?name=SaaS&background=random"
            },
            {
              id: "demo-job-2",
              title: "מפתח Frontend",
              company: "סטארט-אפ טכנולוגי",
              location: "הרצליה",
              employment_type: "full_time",
              start_date: "תוך חודש",
              match_score: 88,
              company_logo_url: "https://ui-avatars.com/api/?name=Tech&background=random"
            },
            {
              id: "demo-job-3",
              title: "מעצב UX/UI",
              company: "סטודיו עיצוב דיגיטלי",
              location: "רמת גן",
              employment_type: "full_time",
              start_date: "גמיש",
              match_score: 85,
              company_logo_url: "https://ui-avatars.com/api/?name=Design&background=random"
            }
          ];
        }

        setAllJobs(jobsData);
        setViewedJobIds(new Set(jobViewsData.map(view => view.job_id)));

        // This tracking call is removed to prevent potential network issues on load.
        // Analytics for job views are still tracked when a user clicks on a job.

      } catch (error) {
        console.error("Error loading jobs for seeker:", error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [user]);

  const StatCard = ({ icon: Icon, title, value, color = "bg-blue-50" }) => (
    <Card className="bg-white border-gray-200/80 shadow-sm hover:shadow-md transition-all duration-300 rounded-2xl">
      <CardContent className="p-6 text-center">
        <div className={`w-12 h-12 ${color} rounded-full flex items-center justify-center mx-auto mb-3`}>
          <Icon className="w-6 h-6 text-blue-600" />
        </div>
        <div className="text-2xl font-bold text-gray-900 mb-2">{value}</div>
        <p className="text-gray-600 font-medium text-sm">{title}</p>
      </CardContent>
    </Card>
  );

  const handlePrevNotification = () => setCurrentNotificationIndex(prev => prev > 0 ? prev - 1 : MOCK_NOTIFICATIONS_SEEKER.length - 1);
  const handleNextNotification = () => setCurrentNotificationIndex(prev => prev < MOCK_NOTIFICATIONS_SEEKER.length - 1 ? prev + 1 : 0);

  // Filter jobs based on the current jobFilter state
  const displayedJobs = allJobs.filter(job => {
    if (jobFilter === 'new') {
      return !viewedJobIds.has(job.id);
    }
    if (jobFilter === 'viewed') {
      return viewedJobIds.has(job.id);
    }
    return true; // Should not happen with 'new'/'viewed' filters
  });

  return (
    <div className="p-4 md:p-6" dir="rtl">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex justify-between items-center px-2">
            <h1 className="text-xl font-bold text-gray-900 mb-2">👋 היי {user.full_name?.split(' ')[0] || 'דניאל'}!</h1>
            <div className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-yellow-500"/>
                <span className="text-sm text-gray-600">התראות חדשות</span>
            </div>
        </div>

        <Card className="bg-white rounded-2xl md:rounded-[2.5rem] shadow-xl p-4 sm:p-6 md:p-8 space-y-8 border border-gray-100">
          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard icon={Briefcase} title="משרות רלוונטיות" value={allJobs.length} /> {/* Changed to allJobs.length */}
            <StatCard icon={Eye} title="צפו בקורות חיים שלי" value={MOCK_STATS.cv_viewed} />
            <StatCard icon={FileText} title="מועמדויות שהגשתי" value={MOCK_STATS.applications_submitted} />
            <StatCard icon={UserIcon} title="צפו בפרופיל שלי" value={MOCK_STATS.profile_viewed} />
          </div>

          {/* Notification Carousel */}
          <Card className="bg-[#E7F2F7] shadow-none border-0 rounded-lg">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <Button variant="ghost" size="icon" className="rounded-full hover:bg-blue-200/50 flex-shrink-0" onClick={handleNextNotification}><ChevronRight className="w-6 h-6 text-blue-600" /></Button>
                  <div className="text-center flex items-center gap-3 overflow-hidden">
                    <p className="text-blue-800 font-semibold text-sm sm:text-base whitespace-nowrap">{MOCK_NOTIFICATIONS_SEEKER[currentNotificationIndex].message}</p>
                    <div className="hidden sm:flex gap-1.5">{MOCK_NOTIFICATIONS_SEEKER.map((_, index) => (<div key={index} className={`w-2.5 h-2.5 rounded-full ${index === currentNotificationIndex ? 'bg-blue-600' : 'bg-gray-300'}`}/>))}</div>
                  </div>
                  <Button variant="ghost" size="icon" className="rounded-full hover:bg-blue-200/50 flex-shrink-0" onClick={handlePrevNotification}><ChevronLeft className="w-6 h-6 text-blue-600" /></Button>
                </div>
              </CardContent>
          </Card>

          {/* Filter Toggle */}
          <div className="flex flex-col-reverse md:flex-row-reverse gap-4 items-center justify-between">
              <div className="flex gap-2 bg-gray-100 p-1 rounded-full w-full md:w-auto">
                <Button className={`px-6 py-2 rounded-full font-semibold flex-1 md:flex-none transition-colors ${jobFilter === 'new' ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-transparent text-gray-700'}`} onClick={() => setJobFilter('new')}>משרות חדשות</Button>
                <Button className={`px-6 py-2 rounded-full font-semibold flex-1 md:flex-none transition-colors ${jobFilter === 'viewed' ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-transparent text-gray-700'}`} onClick={() => setJobFilter('viewed')}>משרות שצפיתי</Button>
              </div>
              <div className="relative w-full md:w-96">
                <Search className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" /><Input placeholder="אפשר גם לחפש" className="pr-12 pl-4 py-2 border-gray-300 focus:border-blue-400 rounded-full h-11" />
              </div>
          </div>

          {/* Jobs List */}
          <div className="space-y-4">
              {loading ? (
                 <div className="text-center py-8 text-gray-500">טוען משרות...</div>
              ) : displayedJobs.length > 0 ? ( // Changed to displayedJobs
                  displayedJobs.map((job, index) => (
                  <motion.div key={job.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: index * 0.1 }}>
                    <Card className="bg-white border border-gray-200/90 shadow-sm hover:shadow-lg transition-all duration-300 rounded-2xl p-4">
                      <div className="flex items-center justify-between gap-4">
                          <Button asChild className="bg-[#84CC9E] hover:bg-green-500 text-white px-5 py-2 rounded-full font-bold w-28">
                              <Link
                                to={createPageUrl(`JobDetailsSeeker?id=${job.id}`)}
                                onClick={() => {
                                  // Track job view when user clicks to view details
                                  if (user?.email && !user.isDemo) { // Only track if not a demo user
                                    UserAnalytics.trackJobView(user.email, job);
                                  }
                                }}
                              >
                                לצפייה
                              </Link>
                          </Button>
                          <div className="flex-1 text-right">
                              <div className="text-sm text-gray-600 mb-1.5">{job.match_score || (Math.floor(Math.random() * 15) + 80)}% התאמה</div>
                              <div dir="ltr" className="w-full h-2.5 bg-gray-200 rounded-full overflow-hidden">
                                <div className={`h-full transition-all duration-500 ${job.match_score >= 80 ? 'bg-green-400' : 'bg-orange-400'}`} style={{ width: `${job.match_score || (Math.floor(Math.random() * 15) + 80)}%` }}></div>
                              </div>
                          </div>
                          <div className="text-right">
                              <h3 className="font-bold text-lg text-gray-900">{job.title}</h3>
                              <p className="text-gray-600 text-sm">{job.company}</p>
                              <div className="flex gap-4 text-xs text-gray-500 mt-1">
                                  <span className="flex items-center gap-1"><MapPin className="w-3 h-3"/>{job.location}</span>
                                  <span className="flex items-center gap-1"><Briefcase className="w-3 h-3"/>משרה מלאה</span>
                                  <span className="flex items-center gap-1"><Clock className="w-3 h-3"/>{job.start_date || 'מיידי'}</span>
                              </div>
                          </div>
                          <div className="w-16 h-16 rounded-full overflow-hidden shadow-md border-2 border-white flex-shrink-0">
                            <img src={job.company_logo_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(job.company)}&background=random`} alt={job.company} className="w-full h-full object-cover" />
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
        </Card>
      </div>
    </div>
  );
};

// --- EMPLOYER DASHBOARD COMPONENT ---
const EmployerDashboard = ({ user }) => {
  const [jobs, setJobs] = useState([]);
  const [viewedCandidates, setViewedCandidates] = useState([]);
  const [candidates, setCandidates] = useState([]);
  const [currentNotificationIndex, setCurrentNotificationIndex] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [candidateFilter, setCandidateFilter] = useState('new');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        let jobsData = [];
        let notificationsData = [];
        let candidatesData = [];
        let viewedCandidatesData = [];

        // Try to fetch real data first
        if (!user?.isDemo) {
          try {
            [jobsData, notificationsData, viewedCandidatesData, candidatesData] = await Promise.all([
              Job.list("-created_date", 20),
              Notification.filter({ is_read: false }, "-created_date", 5),
              CandidateView.filter({ viewer_email: user.email }, "-created_date", 50),
              User.filter({ user_type: 'job_seeker' }, "-created_date", 10)
            ]);
          } catch (error) {
            console.log("Failed to fetch real data for employer, using demo data");
          }
        }

        // Use demo data if real data failed or for demo users
        if (jobsData.length === 0) {
          jobsData = [
            {
              id: "demo-employer-job-1",
              title: "מנהל מכירות",
              company: user?.company_name || "החברה שלי",
              status: "active",
              created_date: new Date().toISOString()
            }
          ];
        }

        if (notificationsData.length === 0) {
          notificationsData = [
            { id: "demo-notif-1", message: "יש לך 3 מועמדויות חדשות" },
            { id: "demo-notif-2", message: "המשרה שלך קיבלה 15 צפיות השבוע" }
          ];
        }

        if (candidatesData.length === 0) {
          candidatesData = [
            {
              id: "demo-candidate-1",
              full_name: "דניאל כהן",
              email: "daniel@example.com",
              experience_level: "mid_level",
              skills: ["JavaScript", "React", "Node.js"]
            },
            {
              id: "demo-candidate-2",
              full_name: "שרה לוי",
              email: "sarah@example.com",
              experience_level: "senior_level",
              skills: ["Marketing", "SEO", "Analytics"]
            }
          ];
        }

        setJobs(jobsData);
        setNotifications(notificationsData);
        setViewedCandidates(viewedCandidatesData);
        setCandidates(candidatesData);
      } catch (error) {
        console.error("Error loading employer dashboard:", error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [user]);

  const handleViewCandidate = async (candidate) => {
    try {
      // Track candidate profile view
      if (user?.email && !user.isDemo) { // Only track if not a demo user
        await UserAnalytics.trackAction(user.email, 'profile_view', {
          candidate_name: candidate.full_name,
          candidate_email: candidate.email
        });
      }

      if (!user?.isDemo) { // Only create view record if not a demo user
        await CandidateView.create({
          candidate_name: candidate.full_name,
          candidate_role: candidate.experience_level || 'N/A',
          viewer_email: user.email,
          viewed_at: new Date().toISOString()
        });
        const updatedViewed = await CandidateView.filter({ viewer_email: user.email }, "-created_date", 50);
        setViewedCandidates(updatedViewed);
      }
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
    <div className="p-4 md:p-6" dir="rtl">
      <div className="max-w-7xl mx-auto space-y-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="text-right px-2">
          <h1 className="text-xl font-bold text-gray-900 mb-2">👋 היי {user.full_name?.split(' ')[0] || 'רפאל'}!</h1>
        </motion.div>
        <Card className="bg-white rounded-2xl md:rounded-[2.5rem] shadow-xl p-4 sm:p-6 md:p-8 space-y-8 border border-gray-100">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              <Card className="col-span-2 sm:col-span-1 bg-[#84CC9E] text-white border-0 shadow-md hover:shadow-lg transition-all duration-300 rounded-2xl">
                <CardContent className="p-4 sm:p-6 text-center flex flex-col items-center justify-center h-full">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/30 rounded-full flex items-center justify-center mx-auto mb-3"><Plus className="w-5 h-5 sm:w-6 sm:h-6 text-white" /></div>
                  <h3 className="font-bold text-base sm:text-lg">פרסום משרה חדשה</h3>
                </CardContent>
              </Card>
              <Card className="bg-white border border-gray-200/80 shadow-sm hover:shadow-md transition-all duration-300 rounded-2xl">
                <CardContent className="p-4 sm:p-6 text-center">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4"><Eye className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" /></div>
                  <div className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">10</div><p className="text-gray-600 font-medium text-sm sm:text-base">צפיות במשרות</p>
                </CardContent>
              </Card>
              <Card className="bg-white border border-gray-200/80 shadow-sm hover:shadow-md transition-all duration-300 rounded-2xl">
                <CardContent className="p-4 sm:p-6 text-center">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4"><Users className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" /></div>
                  <div className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">3</div><p className="text-gray-600 font-medium text-sm sm:text-base">מועמדויות שהתקבלו</p>
                </CardContent>
              </Card>
              <Card className="bg-white border border-gray-200/80 shadow-sm hover:shadow-md transition-all duration-300 rounded-2xl">
                <CardContent className="p-4 sm:p-6 text-center">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4"><TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" /></div>
                  <div className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">6</div><p className="text-gray-600 font-medium text-sm sm:text-base">משרות פעילות</p>
                </CardContent>
              </Card>
            </div>
            <Card className="bg-[#E7F2F7] shadow-none border-0 rounded-lg">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <Button variant="ghost" size="icon" className="rounded-full hover:bg-blue-200/50 flex-shrink-0" onClick={handleNextNotification} disabled={notifications.length <= 1}><ChevronRight className="w-6 h-6 text-blue-600" /></Button>
                  <div className="text-center flex items-center gap-3 overflow-hidden">
                    <p className="text-blue-800 font-semibold text-sm sm:text-base whitespace-nowrap">{notifications[currentNotificationIndex]?.message || "אין התראות חדשות"}</p>
                    {notifications.length > 1 && (<div className="hidden sm:flex gap-1.5">{notifications.map((_, index) => (<div key={index} className={`w-2.5 h-2.5 rounded-full ${index === currentNotificationIndex ? 'bg-blue-600' : 'bg-gray-300'}`}/>))}</div>)}
                  </div>
                  <Button variant="ghost" size="icon" className="rounded-full hover:bg-blue-200/50 flex-shrink-0" onClick={handlePrevNotification} disabled={notifications.length <= 1}><ChevronLeft className="w-6 h-6 text-blue-600" /></Button>
                </div>
              </CardContent>
            </Card>
            <div className="flex flex-col-reverse md:flex-row-reverse gap-4 items-center justify-between">
              <div className="flex gap-2 w-full md:w-auto">
                <Button className={`px-6 py-2 rounded-full font-semibold flex-1 md:flex-none transition-colors ${candidateFilter === 'new' ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-700'}`} onClick={() => setCandidateFilter('new')}>מועמדים חדשים</Button>
                <Button className={`px-6 py-2 rounded-full font-semibold flex-1 md:flex-none transition-colors ${candidateFilter === 'watched' ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-700'}`} onClick={() => setCandidateFilter('watched')}>מועמדים שצפיתי</Button>
              </div>
              <div className="relative w-full md:w-96">
                <Search className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" /><Input placeholder="אפשר גם לחפש" className="pr-12 pl-4 py-2 border-gray-300 focus:border-blue-400 rounded-full h-11" />
              </div>
            </div>
            <div className="space-y-4">
              {filteredCandidates.length > 0 ? (filteredCandidates.map((candidate, index) => { const match = Math.floor(Math.random() * 24) + 75; return (
                  <motion.div key={candidate.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: index * 0.1 }}>
                    <Card className="bg-white border border-gray-200/90 shadow-sm hover:shadow-lg transition-all duration-300 rounded-2xl">
                      <CardContent className="p-4">
                        <div className="flex flex-col-reverse gap-4 md:flex-row md:items-center md:justify-between">
                          <div className="flex flex-col sm:flex-row items-center gap-4 md:gap-6 w-full md:w-auto">
                            <Button asChild className="bg-[#84CC9E] hover:bg-green-500 text-white px-5 py-2 rounded-full font-bold w-full sm:w-auto"><Link to={createPageUrl(`CandidateProfile?id=${candidate.id}`)} onClick={() => handleViewCandidate(candidate)}>לצפייה</Link></Button>
                            <div className="w-full sm:w-48 text-right"><div className="text-sm text-gray-600 mb-1.5">{match}% התאמה</div><div dir="ltr" className="w-full h-2.5 bg-gray-200 rounded-full overflow-hidden"><div className={`h-full transition-all duration-500 ${match >= 80 ? 'bg-green-400' : 'bg-orange-400'}`} style={{ width: `${match}%` }}></div></div></div>
                            <div className="flex flex-wrap gap-2 justify-center sm:justify-start">{candidate.skills?.slice(0, 3).map((skill, i) => (<Badge key={i} variant="outline" className="border-blue-200 text-blue-700 bg-blue-50/50 text-xs">{skill}</Badge>))}</div>
                          </div>
                          <div className="flex items-center gap-4 self-end md:self-center">
                            <div className="text-right"><h3 className="font-bold text-lg text-gray-900">{candidate.full_name}</h3><p className="text-gray-600">{candidate.experience_level?.replace('_', ' ')}</p></div>
                            <div className="w-16 h-16 rounded-full overflow-hidden shadow-md border-2 border-white flex-shrink-0"><div className="w-full h-full bg-blue-200 flex items-center justify-center"><UserIcon className="w-8 h-8 text-blue-500"/></div></div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );})) : (<div className="text-center py-8"><p className="text-gray-600">{candidateFilter === 'new' ? 'אין מועמדים חדשים זמינים כרגע.' : 'לא צפית במועמדים עדיין.'}</p></div>)
              }
            </div>
        </Card>
      </div>
    </div>
  );
};

// --- MAIN DASHBOARD ROUTER ---
export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const userData = await User.me();
        setUser(userData);
      } catch (e) {
        console.log("User not authenticated, using demo mode");
        // Fallback demo user
        setUser({
          user_type: 'job_seeker',
          full_name: 'דניאל (דוגמה)',
          email: 'demo@example.com',
          isDemo: true
        });
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, []);

  if (loading) {
    return (
      <div className="p-8 space-y-8 flex justify-center items-center h-screen" dir="rtl">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    // This case should ideally not be reached if the catch block always sets a demo user on failure.
    // However, keeping it as a safeguard.
    return <div className="p-8 text-center" dir="rtl">נראה שאתה לא מחובר. <Button onClick={() => User.login()}>התחבר</Button></div>;
  }

  // Use user_type to decide which dashboard to render
  if (user.user_type === 'job_seeker') {
    return <JobSeekerDashboard user={user} />;
  } else {
    // If user_type is 'employer' or any other type not 'job_seeker'
    // For demo purposes, if the initial demo user is a job_seeker, this won't be hit immediately.
    // If you need an employer demo user, you could adjust the catch block or add logic to switch.
    // For now, assuming if `user.isDemo` it's a job seeker unless explicitly changed elsewhere.
    return <EmployerDashboard user={user} />;
  }
}
