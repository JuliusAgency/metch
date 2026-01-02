import { useState, useEffect } from "react";
import { User } from "@/api/entities";
import { Job } from "@/api/entities";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import * as SwitchPrimitives from "@radix-ui/react-switch";
import { cn } from "@/lib/utils";
import {
  Plus,
  Edit,
  Copy,
  Briefcase,
  BarChart
} from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { differenceInDays } from "date-fns";
import { useRequireUserType } from "@/hooks/use-require-user-type";
import ToggleSwitch from "@/components/dashboard/ToggleSwitch";
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
  const [, setUser] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState('active'); // 'active' or 'ended'

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true); // Added from outline
    try {
      const userData = await User.me();
      setUser(userData);

      // Load jobs created by the current user
      const jobsData = await Job.filter({ created_by: userData.email }, "-created_date", 50);

      // Sort in memory to ensure most recently updated/created jobs are first
      const sortedJobs = jobsData.sort((a, b) => {
        const dateA = new Date(a.created_date);
        const dateB = new Date(b.created_date);
        return dateB - dateA;
      });

      setJobs(sortedJobs);

      // Removed applications loading as per outline
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (jobId, checked) => {// Modified signature
    const newStatus = checked ? 'active' : 'paused'; // Logic change
    try {
      await Job.update(jobId, { status: newStatus });
      loadData(); // Reload data
    } catch (error) {
      console.error("Error updating job status:", error);
    }
  };

  // handleDeleteJob is removed as per outline

  const handleDuplicateJob = async (job) => {
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
      loadData(); // Reload data
    } catch (error) {
      console.error("Error duplicating job:", error);
    }
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

  const filteredJobs = jobs.filter((job) => // New filtered array
    activeView === 'active' ?
      activeStatuses.includes(job.status) :
      endedStatuses.includes(job.status)
  );

  if (loading) {
    return (
      <div className="p-4 md:p-6" dir="rtl">
        <div className="w-[85vw] mx-auto">
          {Array(3).fill(0).map((_, i) =>
            <div key={i} className="h-32 bg-gradient-to-r from-gray-100 to-gray-200 rounded-2xl animate-pulse mb-4" />
          )}
        </div>
      </div>);

  }

  return (
    <div className="h-full relative" dir="rtl">
      <div className="relative">
        {/* Header */}
        <div className="relative h-32 overflow-hidden w-full">
          <div
            className="absolute inset-0 w-full h-full"
            style={{
              backgroundImage: `url(${settingsHeaderBg})`,
              backgroundSize: '100% 100%',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat'
            }} />
        </div>

        <div className="p-4 sm:p-6 md:p-8 -mt-16 relative z-10 w-full max-w-7xl mx-auto">
          {/* Title */}
          <div className="text-center mb-8">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">ניהול משרות</h1>
          </div>

          {/* Toggle Buttons */}
          <div className="flex justify-center mb-8">
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
          <div className="space-y-4 mb-8">
            {filteredJobs.length > 0 ?
              filteredJobs.map((job, index) => {
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
                    <div className="bg-white border border-gray-200/90 shadow-sm hover:shadow-lg transition-all duration-300 rounded-2xl p-4">
                      {/* Top Section */}
                      <div className="flex items-center justify-between pb-4">
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
                          <Link to={createPageUrl(`CreateJob?id=${job.id}`)}>
                            <Edit className="w-5 h-5 cursor-pointer hover:text-blue-600 font-light" strokeWidth={1.5} />
                          </Link>
                          <Copy
                            className="w-5 h-5 cursor-pointer hover:text-blue-600"
                            strokeWidth={1.5}
                            onClick={() => handleDuplicateJob(job)} />
                        </div>
                      </div>

                      <div className="border-t border-gray-200"></div>

                      {/* Bottom Section */}
                      <div className="flex items-center justify-between pt-4">
                        <div className="text-right">
                          <h3 className="font-bold text-lg text-gray-900">{job.title}</h3>
                          <p className="text-gray-600">{job.location}</p>
                          <p className="text-sm text-gray-400 mt-1">נותרו {daysRemaining} ימים</p>
                        </div>
                        <Link to={createPageUrl(`JobDetails?id=${job.id}`)}>
                          <Button className="bg-[#84CC9E] hover:bg-green-500 text-white px-6 py-2 rounded-full font-bold text-md">
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

          {/* Create New Job & Stats Buttons */}
          <div className="flex flex-col md:flex-row justify-center items-center gap-4">
            <Link to={createPageUrl("Statistics")}>
              <Button variant="outline" className="px-8 py-3 rounded-full font-bold text-lg border-blue-600 text-blue-600 hover:bg-blue-50 shadow-sm">
                <BarChart className="w-5 h-5 ml-2" />
                הסטטיסטיקות שלי
              </Button>
            </Link>

            <Link to={createPageUrl("CreateJob")}>
              <Button className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-full font-bold text-lg shadow-lg">
                <Plus className="w-5 h-5 ml-2" />
                צור משרה חדשה
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>);

}