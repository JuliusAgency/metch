import { useState, useEffect } from "react";
import { User } from "@/api/entities";
import { Job } from "@/api/entities";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import * as SwitchPrimitives from "@radix-ui/react-switch";
import { cn } from "@/lib/utils";
import {
  Plus,
  Edit,
  Copy,
  Briefcase,
  BarChart,
  ChevronRight,
  ChevronLeft
} from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { differenceInDays } from "date-fns";
import { useRequireUserType } from "@/hooks/use-require-user-type";
import ToggleSwitch from "@/components/dashboard/ToggleSwitch";
import { useUser } from "@/contexts/UserContext";
import { useToast } from "@/components/ui/use-toast";
import { useNavigate } from "react-router-dom";
import settingsHeaderBg from "@/assets/settings_header_bg.png";

const CustomSwitch = ({ checked, onCheckedChange, disabled, id }) => (
  <SwitchPrimitives.Root
    checked={checked}
    onCheckedChange={onCheckedChange}
    disabled={disabled}
    id={id}
    dir="ltr"
    className={cn(
      "peer inline-flex h-[24px] w-[44px] shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50",
      "bg-gray-100 data-[state=checked]:bg-gray-100 border border-gray-200"
    )}
  >
    <SwitchPrimitives.Thumb
      className={cn(
        "pointer-events-none block h-5 w-5 rounded-full shadow-md ring-0 transition-transform data-[state=checked]:translate-x-5 data-[state=unchecked]:translate-x-0",
        "bg-gray-200 data-[state=checked]:bg-[#4ADE80]"
      )}
    />
  </SwitchPrimitives.Root>
);

export default function JobManagement() {
  useRequireUserType(); // Ensure user has selected a user type
  const [activeView, setActiveView] = useState('active'); // 'active' or 'ended'
  const { user, updateProfile } = useUser();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 2;

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    setCurrentPage(1); // Reset to page 1 when switching views
  }, [activeView]);

  const loadData = async () => {
    setLoading(true); // Added from outline
    try {
      const userData = await User.me();

      // Load jobs created by the current user
      const jobsData = await Job.filter({ created_by: userData.email }, "-created_date", 50);

      // Sort in memory to ensure most recently updated/created jobs are first
      const sortedJobs = jobsData.sort((a, b) => {
        const dateA = new Date(a.created_date);
        const dateB = new Date(b.created_date);
        return dateB - dateA;
      });

      // Check for expired jobs and update them in database
      const now = new Date();
      const expiredJobs = sortedJobs.filter(job => {
        if (job.status !== 'active' && job.status !== 'paused') return false;
        const daysSinceCreation = differenceInDays(now, new Date(job.created_date));
        return daysSinceCreation > 30;
      });

      if (expiredJobs.length > 0) {
        console.log("Found expired jobs, updating status to closed:", expiredJobs.map(j => j.id));
        await Promise.all(expiredJobs.map(job =>
          Job.update(job.id, { status: 'closed' })
        ));

        // Update local state to reflect the changes immediately
        const updatedJobs = sortedJobs.map(job => {
          if (expiredJobs.find(ej => ej.id === job.id)) {
            return { ...job, status: 'closed' };
          }
          return job;
        });
        setJobs(updatedJobs);
      } else {
        setJobs(sortedJobs);
      }

      // Removed applications loading as per outline
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (jobId, checked) => {
    const newStatus = checked ? 'active' : 'paused';

    // Optimistic update
    setJobs(prevJobs => prevJobs.map(job =>
      job.id === jobId ? { ...job, status: newStatus } : job
    ));

    try {
      await Job.update(jobId, { status: newStatus });
    } catch (error) {
      console.error("Error updating job status:", error);
      // Revert change on error
      setJobs(prevJobs => prevJobs.map(job =>
        job.id === jobId ? { ...job, status: !checked ? 'active' : 'paused' } : job
      ));
      toast({
        title: "שגיאה",
        description: "לא ניתן היה לעדכן את סטטוס המשרה",
        variant: "destructive"
      });
    }
  };

  // handleDeleteJob is removed as per outline

  const checkCredits = () => {
    const credits = user?.profile?.job_credits || 0;
    if (credits <= 0) {
      toast({
        title: "אין יתרת משרות לפרסום",
        description: "נגמרה חבילת המשרות שלך. ניתן לרכוש משרות נוספות בעמוד התשלומים.",
        variant: "destructive",
        action: <Button variant="outline" className="text-black border-white hover:bg-white/90" onClick={() => navigate('/payments')}>לרכישה</Button>
      });
      return false;
    }
    return true;
  };

  const handleDuplicateJob = async (job) => {
    // No credit check needed for duplication (Rule #2) - creates as draft

    try {
      // Get current user data to set created_by fields
      const userData = await User.me();

      const now = new Date().toISOString();
      const duplicatedJob = {
        ...job,
        title: `${job.title} (עותק)`,
        status: 'draft',
        applications_count: 0,
        created_by: userData.email,
        created_by_id: userData.id,
        created_date: now,
        updated_date: now
      };
      delete duplicatedJob.id;

      await Job.create(duplicatedJob);

      // No credit deduction - saved as draft.

      loadData(); // Reload data
      toast({ description: "המשרה שוכפלה בהצלחה כטיוטה" });

    } catch (error) {
      console.error("Error duplicating job:", error);
    }
  };

  const handleCreateNewJob = () => {
    navigate(createPageUrl("CreateJob"));
  };

  // getJobApplicationCount and getJobStats are removed as per outline

  const statusConfig = { // Updated as per outline
    active: { label: 'משרה פעילה', dotColor: 'bg-green-500' },
    paused: { label: 'מושהית', dotColor: 'bg-yellow-500' },
    closed: { label: 'סגורה', dotColor: 'bg-red-500' },
    filled: { label: 'אוישה', dotColor: 'bg-blue-500' },
    filled_via_metch: { label: 'אוישה דרך METCH', dotColor: 'bg-purple-500' },
    draft: { label: 'טיוטה', dotColor: 'bg-gray-400' }
  };

  // employmentTypeMap is removed as it's no longer displayed in the card.

  const activeStatuses = ['active', 'paused', 'draft']; // New array
  const endedStatuses = ['closed', 'filled', 'filled_via_metch']; // New array

  const filteredJobs = jobs.filter((job) => {
    // First, check if the job is actually expired (fallback for UI consistency)
    const isExpired = differenceInDays(new Date(), new Date(job.created_date)) > 30;
    const effectiveStatus = (isExpired && (job.status === 'active' || job.status === 'paused')) ? 'closed' : job.status;

    if (activeView === 'active') {
      return activeStatuses.includes(effectiveStatus);
    } else {
      return endedStatuses.includes(effectiveStatus);
    }
  });

  // Pagination calculations
  const totalPages = Math.ceil(filteredJobs.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedJobs = filteredJobs.slice(startIndex, endIndex);

  if (loading) {
    return (
      <div className="p-4 md:p-6" dir="rtl">
        <div className="w-[85vw] mx-auto">
          {Array(2).fill(0).map((_, i) =>
            <div key={i} className="h-32 bg-gradient-to-r from-gray-100 to-gray-200 rounded-2xl animate-pulse mb-4" />
          )}
        </div>
      </div>);

  }

  return (
    <TooltipProvider delayDuration={0}>
      <div className="h-full relative" dir="rtl">
        <div className="relative">
          {/* Header */}
          <div className="relative h-40 overflow-hidden w-full">
            <div
              className="absolute inset-0 w-full h-full"
              style={{
                backgroundImage: `url(${settingsHeaderBg})`,
                backgroundSize: '100% 100%',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat'
              }} />

            {/* Title - On the curve */}
            <div className="absolute top-8 left-0 right-0 text-center z-20">
              <h1 className="text-3xl font-bold text-[#001a6e]">ניהול משרות</h1>
            </div>
          </div>

          <div className="p-2 sm:p-4 md:p-6 -mt-16 relative z-10 w-[70%] mx-auto">
            {/* Toggle Buttons - with Stats Icon on right edge */}
            <div className="flex justify-between items-center mb-4">
              <div className="w-6"></div> {/* Spacer for symmetry */}
              <ToggleSwitch
                options={[
                  { value: 'ended', label: 'משרות שהסתיימו' },
                  { value: 'active', label: 'משרות פעילות' }
                ]}
                value={activeView}
                onChange={setActiveView}
              />
              <Link to={createPageUrl("Statistics")}>
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  className="text-blue-600 hover:text-blue-700 cursor-pointer transition-colors"
                >
                  <rect x="3" y="14" width="3" height="7" rx="1" fill="currentColor" />
                  <rect x="8" y="10" width="3" height="11" rx="1" fill="currentColor" />
                  <rect x="13" y="6" width="3" height="15" rx="1" fill="currentColor" />
                  <rect x="18" y="3" width="3" height="18" rx="1" fill="currentColor" />
                </svg>
              </Link>
            </div>

            {/* Jobs List */}
            <div className="space-y-3 mb-4">
              {paginatedJobs.length > 0 ?
                paginatedJobs.map((job, index) => {
                  const config = statusConfig[job.status] || statusConfig.draft;
                  const daysSinceCreation = differenceInDays(new Date(), new Date(job.created_date));
                  const daysRemaining = Math.max(0, 30 - daysSinceCreation);

                  return (
                    <motion.div
                      key={job.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.1 }}>

                      {/* Updated Card Structure */}
                      <div className="bg-white border border-gray-200/90 shadow-md hover:shadow-lg transition-all duration-300 rounded-2xl p-4">
                        {/* Top Section */}
                        <div className="flex items-center justify-between pb-3">
                          {/* Right Side (Status) */}
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-gray-800">{config.label}</p>
                            <div className={`w-3 h-3 ${config.dotColor} rounded-full`}></div>
                          </div>

                          {/* Left Side (Actions) */}
                          <div className="flex items-center gap-4 text-gray-400">
                            <CustomSwitch
                              id={`status-switch-${job.id}`}
                              checked={job.status === 'active'}
                              onCheckedChange={(checked) =>
                                handleStatusChange(job.id, checked)
                              }
                              disabled={job.status !== 'active' && job.status !== 'paused'}
                            />
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Link to={createPageUrl(`CreateJob?id=${job.id}`)}>
                                  <Edit className="w-5 h-5 cursor-pointer hover:text-blue-600 font-light" strokeWidth={1.5} />
                                </Link>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>עריכת משרה</p>
                              </TooltipContent>
                            </Tooltip>

                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Copy
                                  className="w-5 h-5 cursor-pointer hover:text-blue-600"
                                  strokeWidth={1.5}
                                  onClick={() => handleDuplicateJob(job)} />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>שכפול משרה</p>
                              </TooltipContent>
                            </Tooltip>
                          </div>
                        </div>

                        <div className="border-t border-gray-200"></div>

                        {/* Bottom Section */}
                        <div className="flex items-center justify-between pt-3">
                          <div className="text-right">
                            <h3 className="font-bold text-lg text-gray-900">{job.title}</h3>
                            <p className="text-gray-600">{job.location}</p>
                            <p className="text-sm text-gray-400 mt-1">נותרו {daysRemaining} ימים</p>
                          </div>
                          <Link to={createPageUrl(`JobDetails?id=${job.id}`)}>
                            <Button className="bg-[#84CC9E] hover:bg-green-500 text-white px-6 py-2 rounded-full font-bold text-sm">
                              צפייה במשרה
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </motion.div>);

                }) :

                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Briefcase className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">עדיין לא פרסמת משרות</h3>
                  <p className="text-gray-600 mb-4">התחל לפרסם משרות כדי למצוא מועמדים מתאימים</p>
                </div>
              }
            </div>

            {/* Bottom Row: Pagination (Left) and Create Button (Right) */}
            <div className="flex justify-between items-center mt-6">
              {/* Pagination Controls - Left Side */}
              <div className="flex items-center gap-3">
                {totalPages > 1 && (
                  <>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      className="rounded-full w-10 h-10 p-0 border-blue-200 hover:bg-blue-50 disabled:opacity-30"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </Button>
                    <div className="text-sm font-medium text-gray-600 min-w-[100px] text-center">
                      עמוד {currentPage} מתוך {totalPages}
                    </div>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                      className="rounded-full w-10 h-10 p-0 border-blue-200 hover:bg-blue-50 disabled:opacity-30"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </Button>
                  </>
                )}
              </div>

              {/* Create New Job Button - Right Side */}
              <Button
                onClick={handleCreateNewJob}
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-full font-bold text-lg shadow-lg"
              >
                <Plus className="w-5 h-5 ml-2" />
                צור משרה חדשה
              </Button>
            </div>
          </div>
        </div>
      </div>
    </TooltipProvider>);

}
