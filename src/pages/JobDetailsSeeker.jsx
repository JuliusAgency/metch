import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Job } from "@/api/entities";
import { JobApplication } from "@/api/entities";
import { User } from "@/api/entities";
import { Card, CardContent } from "@/components/ui/card";
import { createPageUrl } from "@/utils";
import { UserAnalytics } from "@/components/UserAnalytics";
import { useToast } from "@/components/ui/use-toast";
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
  const [hasExistingApplication, setHasExistingApplication] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();

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
          
          // Check for existing application
          if (userData?.email) {
            try {
              await UserAnalytics.trackJobView(userData.email, fetchedJob);
              
              // Check if user already applied
              const existingApps = await JobApplication.filter({ 
                job_id: jobId,
                applicant_email: userData.email 
              });
              setHasExistingApplication(existingApps.length > 0);
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
    if (!job || !user) {
      toast({
        title: "שגיאה",
        description: "לא ניתן להגיש מועמדות. נא לרענן את הדף ולנסות שוב.",
        variant: "destructive",
      });
      return;
    }

    if (!user.email) {
      toast({
        title: "שגיאה",
        description: "לא ניתן לזהות את המשתמש. נא להתחבר מחדש.",
        variant: "destructive",
      });
      return;
    }

    const unavailableStatuses = ['filled', 'filled_via_metch', 'closed', 'paused'];
    if (unavailableStatuses.includes(job.status)) {
      toast({
        title: "משרה לא זמינה",
        description: "משרה זו אינה זמינה עוד להגשת מועמדות.",
        variant: "destructive",
      });
      return;
    }

    if (hasExistingApplication) {
      toast({
        title: "מועמדות קיימת",
        description: "כבר הגשת מועמדות למשרה זו. ניתן לראות את הסטטוס בלוח הבקרה.",
        variant: "destructive",
      });
      return;
    }

    try {
      if (user.email) {
        await UserAnalytics.trackJobApplication(user.email, job);
      }
    } catch (error) {
      console.log("Failed to track job application:", error);
    }

    if (Array.isArray(job.screening_questions) && job.screening_questions.length > 0) {
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
      
      toast({
        title: "מועמדות הוגשה בהצלחה!",
        description: "המועמדות שלך נשלחה למעסיק. תקבל עדכון על הסטטוס.",
      });
      
      setHasExistingApplication(true);
      
      setTimeout(() => {
        navigate(createPageUrl("Dashboard"));
      }, 1500);
    } catch (error) {
      console.error("Error applying to job:", error);
      toast({
        title: "שגיאה בהגשת מועמדות",
        description: error?.message || "אירעה שגיאה בעת הגשת המועמדות. נא לנסות שוב.",
        variant: "destructive",
      });
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
  const imageAttachments = Array.isArray(job.attachments) 
    ? job.attachments.filter(att => att.type?.startsWith('image/')) 
    : [];

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
              hasExistingApplication={hasExistingApplication}
              handleReject={handleReject}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
