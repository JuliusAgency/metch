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
import settingsMobileBg from "@/assets/payment_mobile_header.png";

const CustomSwitch = ({ checked, onCheckedChange, disabled, id }) => (
  <SwitchPrimitives.Root
    checked={checked}
    onCheckedChange={onCheckedChange}
    disabled={disabled}
    id={id}
    className={cn(
      "peer inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50",
      checked ? "bg-[#84CC9E]" : "bg-gray-200"
    )}
  >
    <SwitchPrimitives.Thumb
      className={cn(
        "pointer-events-none block h-5 w-5 rounded-full bg-white shadow-lg ring-0 transition-transform",
        checked ? "translate-x-5" : "translate-x-0"
      )}
    />
  </SwitchPrimitives.Root>
);

const statusConfig = {
  active: { label: 'פעילה', dotColor: 'bg-green-500' },
  paused: { label: 'מושהית', dotColor: 'bg-orange-400' },
  closed: { label: 'סגורה', dotColor: 'bg-red-500' },
  draft: { label: 'טיוטה', dotColor: 'bg-gray-400' },
  ended: { label: 'הסתיימה', dotColor: 'bg-gray-500' },
  filled: { label: 'אויישה', dotColor: 'bg-blue-500' },
  filled_via_metch: { label: 'אויישה דרך Metch', dotColor: 'bg-purple-500' }
};

export default function JobManagement() {
  useRequireUserType();
  const { user } = useUser();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [activeView, setActiveView] = useState('active'); // 'active' or 'ended'
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 5;

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    if (!user?.email) return;
    setLoading(true);
    try {
      const userJobs = await Job.filter({ created_by: user.email }, "-created_date");
      setJobs(userJobs || []);
    } catch (error) {
      console.error("Error loading jobs:", error);
      toast({
        title: "שגיאה",
        description: "לא הצלחנו לטעון את המשרות שלך",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (jobId, checked) => {
    try {
      const newStatus = checked ? 'active' : 'paused';
      // Optimistic update
      setJobs(prevJobs => prevJobs.map(job =>
        job.id === jobId ? { ...job, status: newStatus } : job
      ));

      await Job.update(jobId, { status: newStatus });

      toast({
        title: "סטטוס עודכן",
        description: `המשרה הועברה לסטטוס ${newStatus === 'active' ? 'פעיל' : 'מושהה'}`,
      });
    } catch (error) {
      console.error("Error updating status:", error);
      loadData(); // Revert on error
      toast({
        title: "שגיאה",
        description: "לא הצלחנו לעדכן את הסטטוס",
        variant: "destructive",
      });
    }
  };

  const handleDuplicateJob = async (job) => {
    try {
      // Deep copy excluding ID and system fields
      const { id, created_date, updated_date, created_at, updated_at, ...jobData } = job;
      const newJob = {
        ...jobData,
        title: `${job.title} (עותק)`,
        status: 'draft',
        created_by: user.email,
      };

      const created = await Job.create(newJob);
      if (created) {
        toast({ title: "המשרה שוכפלה בהצלחה", description: "נוצרה משרה חדשה במצב טיוטה" });
        loadData();
      }
    } catch (e) {
      console.error("Error duplicating job:", e);
      toast({
        title: "שגיאה",
        description: "לא הצלחנו לשכפל את המשרה",
        variant: "destructive",
      });
    }
  };

  const handleCreateNewJob = () => {
    navigate(createPageUrl('CreateJob'));
  };

  const filteredJobs = jobs.filter(job => {
    if (activeView === 'active') {
      return ['active', 'paused', 'draft'].includes(job.status);
    } else {
      return ['closed', 'filled', 'filled_via_metch', 'ended'].includes(job.status);
    }
  });

  const totalPages = Math.ceil(filteredJobs.length / ITEMS_PER_PAGE);
  const paginatedJobs = filteredJobs.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  return (
    <TooltipProvider delayDuration={0}>
      <div className="h-full relative bg-[#fafafa] md:bg-transparent min-h-screen pb-24 md:pb-0" dir="rtl">
        {/* Mobile-Only Background Image */}
        <div
          className="md:hidden fixed top-0 left-0 right-0 z-0 pointer-events-none"
          style={{
            width: '100%',
            height: '230px',
            backgroundImage: `url(${settingsMobileBg})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat'
          }}
        />

        <div className="relative">
          {/* Desktop Header */}
          <div className="relative h-32 md:h-40 overflow-hidden w-full hidden md:block">
            <div
              className="absolute inset-0 w-full h-full"
              style={{
                backgroundImage: `url(${settingsHeaderBg})`,
                backgroundSize: '100% 100%',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat'
              }} />

            {/* Title - On the curve */}
            <div className="absolute top-6 md:top-8 left-0 right-0 text-center z-20">
              <h1 className="text-2xl md:text-3xl font-bold text-[#001a6e]">ניהול משרות</h1>
            </div>
          </div>

          {/* Mobile Title */}
          <div className="text-center pt-24 pb-8 md:hidden relative z-10">
            <h1 className="text-[22px] font-bold text-[#001a6e]">
              ניהול משרות
            </h1>
          </div>


          <div className="p-4 md:p-6 -mt-12 md:-mt-16 relative z-10 w-full md:w-[70%] mx-auto">
            {/* Toggle Buttons - Centered */}
            <div className="flex justify-center items-center mb-6 gap-4">
              <BarChart className="w-6 h-6 text-[#2987cd] md:hidden" />
              <ToggleSwitch
                options={[
                  { value: 'ended', label: 'משרות שהסתיימו' },
                  { value: 'active', label: 'משרות פעילות' }
                ]}
                value={activeView}
                onChange={setActiveView}
              />
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

                      {/* Desktop Card Structure */}
                      <div className="hidden md:block bg-white border border-gray-200/90 shadow-md hover:shadow-lg transition-all duration-300 rounded-2xl p-4">
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
                              id={`status-switch-desktop-${job.id}`}
                              checked={job.status === 'active'}
                              onCheckedChange={(checked) =>
                                handleStatusChange(job.id, checked)
                              }
                              disabled={job.status !== 'active' && job.status !== 'paused' && job.status !== 'draft'}
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

                      {/* Mobile Card Structure */}
                      <div className="md:hidden bg-white border border-gray-100 shadow-sm rounded-[16px] p-4">
                        {/* Top: Status & Switch */}
                        <div className="flex items-center justify-between pb-3">
                          <span className="text-sm font-medium text-gray-900">
                            {job.status === 'active' ? 'משרה פעילה' : 'משרה הסתיימה'}
                          </span>
                          <CustomSwitch
                            id={`status-switch-mobile-${job.id}`}
                            checked={job.status === 'active'}
                            onCheckedChange={(checked) =>
                              handleStatusChange(job.id, checked)
                            }
                            disabled={job.status !== 'active' && job.status !== 'paused' && job.status !== 'draft'}
                          />
                        </div>

                        <div className="border-t border-gray-100 mb-3"></div>

                        {/* Middle: Info & Icons */}
                        <div className="flex justify-between items-start mb-4">
                          <div className="text-right">
                            <h3 className="font-bold text-lg text-gray-900">{job.title}</h3>
                            <p className="text-gray-500 text-sm">{job.location}</p>
                          </div>
                          <div className="flex gap-3 pt-1">
                            <Link to={createPageUrl(`CreateJob?id=${job.id}`)}>
                              <Edit className="w-5 h-5 text-gray-300" strokeWidth={1.5} />
                            </Link>
                            <Copy
                              className="w-5 h-5 text-gray-300"
                              strokeWidth={1.5}
                              onClick={() => handleDuplicateJob(job)} />
                          </div>
                        </div>

                        {/* Bottom: Button */}
                        <div className="flex justify-end">
                          <Link to={createPageUrl(`JobDetails?id=${job.id}`)}>
                            <Button className="bg-[#84CC9E] hover:bg-green-500 text-white px-6 py-1.5 h-auto rounded-full font-normal text-sm shadow-none">
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

            {/* Pagination Controls - Left Side (Desktop Only for now unless requested) */}
            <div className="flex justify-between items-center mt-6 hidden md:flex">
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

              {/* Create New Job Button - Right Side (Desktop) */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <div>
                    <Button
                      onClick={() => {
                        const hasCredits = (user?.job_credits > 0 || user?.profile?.job_credits > 0);
                        if (hasCredits) {
                          handleCreateNewJob();
                        }
                      }}
                      disabled={!(user?.job_credits > 0 || user?.profile?.job_credits > 0)}
                      className={`px-8 py-3 rounded-full font-bold text-lg shadow-lg ${(user?.job_credits > 0 || user?.profile?.job_credits > 0)
                        ? 'bg-blue-600 hover:bg-blue-700 text-white'
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed hover:bg-gray-300'
                        }`}
                    >
                      <Plus className="w-5 h-5 ml-2" />
                      יצירת משרה חדשה
                    </Button>
                  </div>
                </TooltipTrigger>
                {!(user?.job_credits > 0 || user?.profile?.job_credits > 0) && (
                  <TooltipContent>
                    <p>נגמרה חבילת המשרות שלך</p>
                  </TooltipContent>
                )}
              </Tooltip>
            </div>

            {/* Mobile Create Job Button (Fixed/Sticky or just at bottom) */}
            <div className="fixed md:hidden bottom-8 left-0 right-0 px-6 z-40 transform translate-y-0">
              <Button
                onClick={() => {
                  const hasCredits = (user?.job_credits > 0 || user?.profile?.job_credits > 0);
                  if (hasCredits) {
                    handleCreateNewJob();
                  }
                }}
                disabled={!(user?.job_credits > 0 || user?.profile?.job_credits > 0)}
                className={`w-full py-6 rounded-full font-bold text-xl shadow-[0_4px_14px_0_rgba(0,0,0,0.2)] ${(user?.job_credits > 0 || user?.profile?.job_credits > 0)
                  ? 'bg-[#2987CD] hover:bg-[#2070ab] text-white'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed hover:bg-gray-300'
                  }`}
              >
                צור משרה חדשה +
              </Button>
            </div>

          </div>
        </div>
      </div>
    </TooltipProvider>);

}
