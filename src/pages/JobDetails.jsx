import React, { useState, useEffect, useCallback } from "react";
import { useLocation } from "react-router-dom";
import { Job } from "@/api/entities";
import { JobApplication } from "@/api/entities";
import { User } from "@/api/entities";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";
import { EmployerAnalytics } from "@/components/EmployerAnalytics";
import JobHeader from "@/components/job/JobHeader";
import JobTitle from "@/components/job/JobTitle";
import JobStats from "@/components/job/JobStats";
import JobInfo from "@/components/job/JobInfo";
import JobActions from "@/components/job/JobActions";

export default function JobDetails() {
  const [job, setJob] = useState(null);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const location = useLocation();

  const loadData = useCallback(async () => {
    try {
      const userData = await User.me();
      setUser(userData);

      const params = new URLSearchParams(location.search);
      const jobId = params.get('id');
      
      if (jobId) {
        const jobResults = await Job.filter({ id: jobId });
        if (jobResults.length > 0) {
          setJob(jobResults[0]);
          
          const appResults = await JobApplication.filter({ job_id: jobId });
          setApplications(appResults);
        }
      }
    } catch (error) {
      console.error("Error loading job details:", error);
    } finally {
      setLoading(false);
    }
  }, [location.search]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleStatusChange = async (newStatus) => {
    try {
      const oldStatus = job.status;
      await Job.update(job.id, { status: newStatus });
      setJob(prev => ({ ...prev, status: newStatus }));
      
      if (user) {
        await EmployerAnalytics.trackJobStatusChange(user.email, job, oldStatus, newStatus);
      }
    } catch (error) {
      console.error("Error updating job status:", error);
    }
  };

  useEffect(() => {
    const trackJobView = async () => {
      if (job && user) {
        await EmployerAnalytics.trackJobView(user.email, job);
      }
    };
    
    if (job && user) {
      trackJobView();
    }
  }, [job, user]);

  const statusConfig = {
    active: { label: 'פעילה', color: 'bg-green-100 text-green-800' },
    paused: { label: 'מושהית', color: 'bg-yellow-100 text-yellow-800' },
    closed: { label: 'סגורה', color: 'bg-red-100 text-red-800' },
    filled: { label: 'אוישה', color: 'bg-blue-100 text-blue-800' },
    filled_via_metch: { label: 'אוישה דרך METCH', color: 'bg-purple-100 text-purple-800' },
    draft: { label: 'טיוטה', color: 'bg-gray-100 text-gray-800' }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-screen">טוען...</div>;
  }

  if (!job) {
    return <div className="text-center py-12">משרה לא נמצאה</div>;
  }

  return (
    <div className="p-4 md:p-6" dir="rtl">
      <div className="w-[85vw] mx-auto">
        <Card className="bg-white rounded-2xl md:rounded-[2.5rem] shadow-xl border border-gray-100 overflow-hidden">
          <div className="relative">
            <JobHeader />
            <CardContent className="p-4 sm:p-6 md:p-8 -mt-6 relative z-10">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-8"
              >
                <JobTitle
                  title={job.title}
                  company={job.company}
                  statusConfig={statusConfig}
                  status={job.status}
                />
                <JobStats applications={applications} />
                <JobInfo job={job} />
                <JobActions
                  job={job}
                  handleStatusChange={handleStatusChange}
                  applications={applications}
                />
              </motion.div>
            </CardContent>
          </div>
        </Card>
      </div>
    </div>
  );
}
