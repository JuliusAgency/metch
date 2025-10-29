import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Job } from "@/api/entities";
import { JobApplication } from "@/api/entities";
import { User } from "@/api/entities";
import { Card, CardContent } from "@/components/ui/card";
import { createPageUrl } from "@/utils";
import { UserAnalytics } from "@/components/UserAnalytics";
import JobStatusBanner from "@/components/jobs/JobStatusBanner";
import SeekerHeader from "@/components/seeker/SeekerHeader";
import SeekerJobTitle from "@/components/seeker/SeekerJobTitle";
import SeekerJobPerks from "@/components/seeker/SeekerJobPerks";
import SeekerJobInfo from "@/components/seeker/SeekerJobInfo";
import SeekerJobImages from "@/components/seeker/SeekerJobImages";
import SeekerJobActions from "@/components/seeker/SeekerJobActions";

export default function JobDetailsSeeker() {
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [user, setUser] = useState(null);
  const location = useLocation();
  const navigate = useNavigate();

  const loadData = React.useCallback(async () => {
    setLoading(true);
    try {
      const userData = await User.me();
      setUser(userData);

      const params = new URLSearchParams(location.search);
      const jobId = params.get('id');
      
      if (jobId) {
        const jobResults = await Job.filter({ id: jobId });
        if (jobResults.length > 0) {
          const fetchedJob = jobResults[0];
          setJob(fetchedJob);
          
          if (userData?.email) {
            try {
              await UserAnalytics.trackJobView(userData.email, fetchedJob);
            } catch (error) {
              console.log("Failed to track job view for " + userData.email);
            }
          }
        } else {
          console.error(`Job with ID ${jobId} not found`);
          navigate(createPageUrl("JobSearch"));
        }
      }
    } catch (error) {
      console.error("Error loading job details:", error);
      navigate(createPageUrl("JobSearch"));
    } finally {
      setLoading(false);
    }
  }, [location.search, navigate]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleApply = async () => {
    if (!job || !user) return;

    const unavailableStatuses = ['filled', 'filled_via_metch', 'closed', 'paused'];
    if (unavailableStatuses.includes(job.status)) {
      return;
    }

    if (user?.email) {
      await UserAnalytics.trackJobApplication(user.email, job);
    }

    if (job.screening_questions && job.screening_questions.length > 0) {
      navigate(createPageUrl(`AnswerQuestionnaire?job_id=${job.id}`));
      return;
    }

    setApplying(true);
    try {
      await JobApplication.create({
        job_id: job.id,
        applicant_email: user.email,
        status: 'pending'
      });
      
      setTimeout(() => {
        navigate(createPageUrl("Dashboard"));
      }, 1500);
    } catch (error) {
      console.error("Error applying to job:", error);
    } finally {
      setApplying(false);
    }
  };

  const handleReject = async () => {
    if (user?.email && job) {
      await UserAnalytics.trackJobRejection(user.email, job);
    }
    navigate(createPageUrl("JobSearch"));
  };

  const employmentTypeText = {
    full_time: 'משרה מלאה',
    part_time: 'משרה חלקית',
    contract: 'חוזה',
    freelance: 'פרילנס',
    internship: 'התמחות'
  };

  if (loading) {
    return <div className="flex justify-center items-center h-screen">טוען...</div>;
  }

  if (!job) {
    return <div className="text-center py-12">משרה לא נמצאה</div>;
  }

  const isUnavailable = ['filled', 'filled_via_metch', 'closed', 'paused'].includes(job.status);
  const imageAttachments = job.attachments?.filter(att => att.type?.startsWith('image/')) || [];

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#DBECF3] via-white to-white" dir="rtl">
      <div className="max-w-5xl mx-auto p-4 md:p-6">
        <Card className="bg-white rounded-3xl shadow-lg overflow-hidden relative">
          <CardContent className="relative z-10 px-4 sm:px-8 py-12">
            <SeekerHeader job={job} />
            {isUnavailable && (
              <JobStatusBanner status={job.status} className="mb-6" />
            )}
            <SeekerJobTitle job={job} employmentTypeText={employmentTypeText} />
            <SeekerJobPerks perks={job.company_perks} />
            <SeekerJobInfo job={job} />
            <SeekerJobImages images={imageAttachments} />
            <SeekerJobActions
              handleApply={handleApply}
              applying={applying}
              isUnavailable={isUnavailable}
              handleReject={handleReject}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
