import { useState, useEffect } from "react";
import { Job } from "@/api/entities";
import { JobView } from "@/api/entities";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Link, useSearchParams } from "react-router-dom";
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
        const [jobsData, jobViewsData] = await Promise.all([
          Job.filter({ status: 'active' }, "-created_date", 50),
          JobView.filter({ user_email: user.email })
        ]);

        setAllJobs(jobsData);
        setViewedJobIds(new Set(jobViewsData.map(view => view.job_id)));

      } catch (error) {
        console.error("Error loading jobs for seeker:", error);
        setAllJobs([]);
        setViewedJobIds(new Set());
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [user]);

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
            <h1 className="text-xl font-bold text-gray-900 mb-2">👋 היי {user.full_name?.split(' ')[0]}!</h1>
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
              <span className="text-sm text-gray-600">התראות חדשות</span>
              <Bell className="w-5 h-5 text-yellow-500" />
            </div>
          </div>

          <Card className="bg-white rounded-2xl md:rounded-[2.5rem] shadow-xl p-4 sm:p-6 md:p-8 space-y-8 border border-gray-100">
            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 stats-grid">
              <StatCard icon={Briefcase} title="משרות רלוונטיות" value={allJobs.length} /> {/* Changed to allJobs.length */}
            </div>

            {/* Filter Toggle */}
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
              <div className="relative w-full md:w-96 job-search-input">
                <Input placeholder="אפשר גם לחפש" className="pl-12 pr-4 py-2 border-gray-300 focus:border-blue-400 rounded-full h-11" />
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              </div>
              <div className="flex gap-2 bg-gray-100 p-1 rounded-full w-full md:w-auto job-filter-buttons">
                <Button className={`px-6 py-2 rounded-full font-semibold flex-1 md:flex-none transition-colors ${jobFilter === 'viewed' ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-transparent text-gray-700'}`} onClick={() => setJobFilter('viewed')}>משרות שנצפוי</Button>
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
                        <Button asChild className="bg-[#59df8a] hover:bg-[#4bc77b] text-black px-5 py-2 rounded-full font-medium text-base w-28 view-job-button">
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
