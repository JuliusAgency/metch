import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/api/supabaseClient";
import { Job, CV, Notification } from "@/api/entities";
import { JobView } from "@/api/entities";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  Eye,
  ChevronLeft,
  ChevronRight,
  Search,
  Briefcase,
  MapPin,
  Clock,
  Bell,
  HelpCircle,
} from "lucide-react";
import { motion } from "framer-motion";
import { UserAnalytics } from "@/components/UserAnalytics";
import JobSeekerGuide from "@/components/guides/JobSeekerGuide";
import StatCard from "./StatCard";

const JobSeekerDashboard = ({ user }) => {
  const [searchParams] = useSearchParams();
  const [jobFilter, setJobFilter] = useState(searchParams.get('filter') === 'viewed' ? 'viewed' : 'new');
  const [currentNotificationIndex, setCurrentNotificationIndex] = useState(0);
  const [allJobs, setAllJobs] = useState([]); // Renamed 'jobs' to 'allJobs'
  const [viewedJobIds, setViewedJobIds] = useState(new Set()); // New state for viewed job IDs
  const [loading, setLoading] = useState(true);
  const [showGuide, setShowGuide] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [seekerStats, setSeekerStats] = useState({});
  const navigate = useNavigate();

  // Check if user needs onboarding guide
  useEffect(() => {
    const hasSeenGuide = localStorage.getItem(`jobseeker_guide_${user?.email}`);
    if (!hasSeenGuide) {
      setShowGuide(true);
    }
  }, [user]);

  const handleGuideComplete = () => {
    setShowGuide(false);
    if (user?.email) {
      localStorage.setItem(`jobseeker_guide_${user.email}`, 'completed');
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
        const [jobsData, jobViewsData, cvList] = await Promise.all([
          Job.filter({ status: 'active' }, "-created_date", 100), // Fetch more to filter down
          JobView.filter({ user_email: user.email }),
          CV.filter({ user_email: user.email })
        ]);

        const userCv = cvList.length > 0 ? cvList[0] : {};
        // Use CV data for matching if available, otherwise fallback to user object
        // The calculate_match_score utility expects a flat profile structure somewhat, 
        // or a structure matching what CVGenerator produces. 
        // We'll pass the merged profile to be safe.
        // But calculate_match_score expects e.g. 'education' as array. 
        // If userCv is empty, matching might be poor. 

        const candidateProfile = userCv.id ? userCv : user;

        // Calculate matches and filter
        const scoredJobs = await Promise.all(jobsData.map(async (job) => {
          const score = await import('@/utils/matchScore').then(m => m.calculate_match_score(candidateProfile, job, user));
          return { ...job, match_score: Math.round(score * 100) };
        }));

        // Filter: Match >= 60% (As requested for run period)
        const qualifiedJobs = scoredJobs.filter(job => job.match_score >= 60);

        // Sort by match score (descending)
        qualifiedJobs.sort((a, b) => b.match_score - a.match_score);

        // Apply Limits: Max 30 displayed daily
        const limitedJobs = qualifiedJobs.slice(0, 30);

        setAllJobs(limitedJobs);
        setViewedJobIds(new Set(jobViewsData.map(view => view.job_id)));

        // Fetch seeker dashboard data (stats + notifications)
        const [dashData, byUserId, byEmail, byCreatedBy] = await Promise.all([
          UserAnalytics.getUserDashboardData(user.id, user.email),
          Notification.filter({ user_id: user.id }, "-created_date"),
          Notification.filter({ email: user.email }, "-created_date"),
          Notification.filter({ created_by: user.id }, "-created_date")
        ]);

        const mergedNotifs = [...(byUserId || []), ...(byEmail || []), ...(byCreatedBy || [])]
          .reduce((acc, current) => {
            if (!acc.find(item => item.id === current.id)) return acc.concat([current]);
            return acc;
          }, [])
          .sort((a, b) => new Date(b.created_date || b.created_at) - new Date(a.created_at || a.created_date));

        const SEEKER_ALLOWED_NOTIFICATION_TYPES = ['profile_view', 'new_message'];
        const filteredNotifications = mergedNotifs.filter(n =>
          SEEKER_ALLOWED_NOTIFICATION_TYPES.includes(n.type)
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

        setSeekerStats(dashData.stats);
        setNotifications(deduplicatedNotifications);

      } catch (error) {
        console.error("Error loading jobs for seeker:", error);
        setAllJobs([]);
        setViewedJobIds(new Set());
        setNotifications([]);
        setSeekerStats({});
      } finally {
        setLoading(false);
      }
    };
    loadData();

    // Set up Realtime subscription for Notifications to refresh dashboard list
    let notificationSubscription = null;
    if (user?.id || user?.email) {
      notificationSubscription = supabase
        .channel('seeker_dashboard:Notification')
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

  const handleNextNotification = () => {
    setCurrentNotificationIndex((prev) => (prev + 1) % notifications.length);
  };

  const handlePrevNotification = () => {
    setCurrentNotificationIndex((prev) => (prev - 1 + notifications.length) % notifications.length);
  };

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
    <>
      <div className="p-4 md:p-6" dir="rtl">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="flex justify-between items-center px-2">
            <h1 className="text-xl font-bold text-gray-900 mb-2 mt-2">👋 היי {user.full_name?.split(' ')[0]}!</h1>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowGuide(true)}
                className="rounded-full px-3 py-1 text-xs"
              >
                מדריך
                <HelpCircle className="w-3 h-3 mr-1" />
              </Button>
            </div>
          </div>

          <Card className="bg-white rounded-2xl md:rounded-[2.5rem] shadow-xl p-4 sm:p-6 md:p-8 space-y-8 border border-gray-100">
            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 stats-grid">
              <StatCard icon={Briefcase} title="משרות רלוונטיות" value={allJobs.length} />
              <StatCard icon={Eye} title="צפיות בפרופיל" value={seekerStats?.total_profile_views || 0} />
              <StatCard icon={Bell} title="מועמדויות שנשלחו" value={seekerStats?.total_applications_sent || 0} />
            </div>

            {/* Notification Carousel */}
            <Card className="bg-[#E7F2F7] shadow-none border-0 rounded-lg notification-carousel">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <Button variant="ghost" size="icon" className="rounded-full hover:bg-blue-200/50 flex-shrink-0" onClick={handleNextNotification} disabled={notifications.length <= 1}>
                    <ChevronRight className="w-6 h-6 text-blue-600" />
                  </Button>
                  <div
                    className="text-center flex items-center gap-3 overflow-hidden cursor-pointer hover:opacity-80 transition-opacity"
                    onClick={() => {
                      const notif = notifications[currentNotificationIndex];
                      if (notif) {
                        navigate(createPageUrl("Notifications"), { state: { selectedNotificationId: notif.id } });
                      }
                    }}
                  >
                    <p className="text-blue-800 font-semibold text-sm sm:text-base whitespace-nowrap">
                      {notifications[currentNotificationIndex]?.message || "אין התראות חדשות"}
                    </p>
                    {notifications.length > 1 && (
                      <div className="hidden sm:flex gap-1.5">
                        {notifications.map((_, index) => (
                          <div
                            key={index}
                            className={`w-2.5 h-2.5 rounded-full ${index === currentNotificationIndex ? 'bg-blue-600' : 'bg-gray-300'}`}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                  <Button variant="ghost" size="icon" className="rounded-full hover:bg-blue-200/50 flex-shrink-0" onClick={handlePrevNotification} disabled={notifications.length <= 1}>
                    <ChevronLeft className="w-6 h-6 text-blue-600" />
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Filter Toggle */}
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
              <div className="relative w-full md:w-96 job-search-input">
                <Input placeholder="אפשר גם לחפש" className="pl-12 pr-4 py-2 border-gray-300 focus:border-blue-400 rounded-full h-11" />
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              </div>
              <div className="flex gap-2 bg-gray-100 p-1 rounded-full w-full md:w-auto job-filter-buttons">
                <Button className={`px-6 py-2 rounded-full font-semibold flex-1 md:flex-none transition-colors ${jobFilter === 'viewed' ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-transparent text-gray-700'}`} onClick={() => setJobFilter('viewed')}>משרות שצפיתי</Button>
                <Button className={`px-6 py-2 rounded-full font-semibold flex-1 md:flex-none transition-colors ${jobFilter === 'new' ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-transparent text-gray-700'}`} onClick={() => setJobFilter('new')}>משרות חדשות</Button>
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
                            <span className="flex items-center gap-1"><Clock className="w-3 h-3 ml-1" />{job.start_date || 'מיידית'}</span>
                          </div>
                        </div>
                        {job.match_score !== null && (
                          <div className="flex-1 text-right">
                            <div className="text-sm text-gray-600 mb-1.5">{job.match_score}% התאמה</div>
                            <div dir="ltr" className="w-full h-2.5 bg-gray-200 rounded-full overflow-hidden">
                              <div className={`h-full transition-all duration-500 ${job.match_score >= 70 ? 'bg-green-400' : job.match_score >= 40 ? 'bg-orange-400' : 'bg-red-500'}`} style={{ width: `${job.match_score}%` }}></div>
                            </div>
                          </div>
                        )}
                        <Button asChild className="bg-[#84CC9E] hover:bg-green-500 text-white px-5 py-2 rounded-full font-bold w-28 view-job-button">
                          <Link
                            to={createPageUrl(`JobDetailsSeeker?id=${job.id}`)}
                            onClick={() => {
                              // Track job view when user clicks to view details
                              if (user?.email) {
                                UserAnalytics.trackJobView(user.email, job);
                              }
                            }}
                          >
                            לצפייה
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
          </Card>
        </div>
      </div>

      <JobSeekerGuide
        isActive={showGuide}
        onComplete={handleGuideComplete}
        onSkip={handleGuideSkip}
      />
    </>
  );
};

export default JobSeekerDashboard;
