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
import ApplicationSuccessModal from "@/components/jobs/ApplicationSuccessModal";
import { useRequireUserType } from "@/hooks/use-require-user-type";
import { calculate_match_score } from "@/utils/matchScore";

export default function JobDetailsSeeker() {
  useRequireUserType(); // Ensure user has selected a user type
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [user, setUser] = useState(null);
  const [hasExistingApplication, setHasExistingApplication] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const searchParams = new URLSearchParams(location.search);
  const jobIdParam = searchParams.get('id');
  const rawFromParam = searchParams.get('from') || 'Dashboard';
  const fromParam = rawFromParam.replace(/[^a-z0-9_-]/gi, '') || 'Dashboard';

  const loadData = React.useCallback(async () => {
    setLoading(true);
    try {
      const userData = await User.me();
      setUser(userData);

      const jobId = jobIdParam;

      if (jobId === 'f0000000-0000-0000-0000-000000000001') {
        const mockJob = {
          id: 'f0000000-0000-0000-0000-000000000001',
          title: 'מנהלת קשרי לקוחות',
          company: 'Google',
          location: 'מרכז',
          company_logo_url: 'https://www.google.com/images/branding/googlelogo/2x/googlelogo_color_92x30dp.png',
          match_score: 96,
          start_date: 'מיידית',
          description: 'אנחנו מחפשים מפתח/ת תוכנה ג\'וניור להצטרפות לצוות הפיתוח שלנו. התפקיד מתאים לסטודנטים בשנת לימודים אחרונה או בוגרים טריים, עם רקע טכנולוגי חזק, יכולת למידה גבוהה ורצון להתפתח בעולם הפיתוח.',
          requirements: ['ניסיון של שנתיים לפחות בגיוס טכנולוגי - חובה', 'ניסיון קודם בחברת הייטק או סטארטאפ - יתרון', 'יכולת בין אישית גבוהה ותקשורת מצויינת', 'אנגלית ברמה גבוהה (ראיונות באנגלית)', 'משרה מיידית'],
          responsibilities: ['פיתוח תוכנה כחלק מצוות פיתוח, כתיבת קוד בהתאם לסטנדרטים ארגוניים, עבודה עם מערכות Backend ו-Frontend בשלבי פיתוח שונות.', 'השתתפות בישיבות צוות, Code Reviews ו-Sprint Planning.'],
          metch_analysis: {
            summary: 'בהתאמה למשרה יש חפיפה כמעט מלאה לכל ההיבטים המקצועיים והעדפותיך, במיוחד מבחינת השכלה, דרישות הליבה, אופי וסוג המשרה. החלק בו יש מרווח קטן הוא ניסיון - הניסיון שלך הוא ג\'וניור, שמספיק כאן, אך עדיין בשלבים הראשונים לעומת מועמדים שכבר התנסו בעוד פרויקטים או תפקידים דומים. זה לא פער מקצועי מהותי כי התפקיד מחפש בדיוק מישהו במסלול שלך. שאר העדפות - מיקום, סוג משרה, זמינות - עונות בדיוק למה שחיפשת.',
            reasoning: 'המשרה הזו מתאימה לך כי היא מבוססת בדיוק על שילוב היכולות והניסיון שצברת, הן בלימודים שלך בטכניון, הן במשרת סטודנט כטכנולוגי והן ברקע שלך מחייל ותקשוב. כל הדרישות המרכזיות של התפקיד מופיעות אצלך: ידע בתוכנות מובנה עצמית, ביטון ב-Python, Java ו-SQL, הכרות עם Git ולינוקס, וגם עבודה בצוות ויכולת למידה עצמית. המשרה ממוקמת באזור המרכז, תואמת את הציפיות שלך למשרה מלאה ומיידית, ועונה בדיוק על שלב הקריירה שלך - תחילת הדרך המקצועית בפיתוח, אחרי תואר והכשרה טכנולוגית.'
          },
          company_perks: ['משרד מפנק', 'עבודה במשמרות', 'רכב חברה', 'סיבוס'],
          attachments: [
            'https://images.unsplash.com/photo-1497366216548-37526070a792?auto=format&fit=crop&w=400&h=300',
            'https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=400&h=300',
            'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?auto=format&fit=crop&w=400&h=300'
          ],
          status: 'active',
          created_date: new Date().toISOString()
        };
        setJob(mockJob);

        // Track view for mock job as well
        if (userData?.email) {
          try {
            await UserAnalytics.trackJobView(userData, mockJob);
          } catch (e) {
            console.warn("Analytics error for mock job", e);
          }
        }

        setLoading(false);
        return;
      }

      if (jobId) {
        const jobResults = await Job.filter({ id: jobId });
        if (jobResults.length > 0) {
          const fetchedJob = jobResults[0];

          // Calculate match score client-side for accuracy
          if (userData) {
            try {
              const score = await calculate_match_score(userData, fetchedJob);
              if (score !== null) {
                fetchedJob.match_score = Math.round(score * 100);
              }
            } catch (e) {
              console.error("Error calculating match score:", e);
            }
          }

          // Parse screening_questions if needed
          if (fetchedJob.screening_questions && typeof fetchedJob.screening_questions === 'string') {
            try {
              let jsonStr = fetchedJob.screening_questions;
              // Handle Postgres Bytea Hex format
              if (jsonStr.startsWith('\\x')) {
                const hex = jsonStr.slice(2);
                let str = '';
                for (let i = 0; i < hex.length; i += 2) {
                  str += String.fromCharCode(parseInt(hex.substr(i, 2), 16));
                }
                jsonStr = str;
              }
              fetchedJob.screening_questions = JSON.parse(jsonStr);
            } catch (e) {
              console.warn("Failed to parse screening_questions", e);
              fetchedJob.screening_questions = [];
            }
          }

          // Parse attachments if needed
          if (fetchedJob.attachments && typeof fetchedJob.attachments === 'string') {
            try {
              let jsonStr = fetchedJob.attachments;
              // Handle Postgres Bytea Hex format
              if (jsonStr.startsWith('\\x')) {
                const hex = jsonStr.slice(2);
                let str = '';
                for (let i = 0; i < hex.length; i += 2) {
                  str += String.fromCharCode(parseInt(hex.substr(i, 2), 16));
                }
                jsonStr = str;
              }
              fetchedJob.attachments = JSON.parse(jsonStr);
            } catch (e) {
              console.warn("Failed to parse attachments", e);
              fetchedJob.attachments = [];
            }
          }

          setJob(fetchedJob);

          // Check for existing application
          if (userData?.email) {
            try {
              await UserAnalytics.trackJobView(userData, fetchedJob); // Pass full user object

              // Check if user already applied - Try ID first, fallback to email
              let existingApps = await JobApplication.filter({
                job_id: jobId,
                applicant_id: userData.id
              });

              setHasExistingApplication(existingApps.length > 0);
            } catch (error) {

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
  }, [jobIdParam, navigate]);

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

    if (job.id === 'mock-google-crm') {
      setShowSuccessModal(true);
      return;
    }

    try {
      if (user.email) {
        await UserAnalytics.trackJobApplication(user, job); // Pass full user object
      }
    } catch (error) {

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
        applicant_id: user.id,
        status: 'pending'
      });

      setHasExistingApplication(true);
      setShowSuccessModal(true);
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
      await UserAnalytics.trackJobRejection(user, job); // Pass full user object
    }
    navigate(createPageUrl("Dashboard"));
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
  const attachments = job.attachments;
  const normalizedReturnPage = fromParam || 'Dashboard';
  const baseReturnPath = createPageUrl(normalizedReturnPage);
  const jobAnchorId = job?.id || jobIdParam;
  const returnUrl = jobAnchorId ? `${baseReturnPath}?filter=viewed#job-${jobAnchorId}` : `${baseReturnPath}?filter=viewed`;

  return (
    <div className="h-full relative" dir="rtl">
      <div className="relative h-full overflow-y-auto">
        <div className="p-2 sm:p-4 md:p-6 w-full max-w-5xl mx-auto">
          <SeekerHeader job={job} returnUrl={returnUrl} />
          {isUnavailable && (
            <JobStatusBanner status={job.status} className="mb-4" />
          )}
          <SeekerJobTitle job={job} employmentTypeText={employmentTypeText} />
          <SeekerJobPerks perks={job.company_perks} />
          <SeekerJobInfo job={job} />
          <SeekerJobImages images={attachments} />
          <SeekerJobActions
            handleApply={handleApply}
            applying={applying}
            isUnavailable={isUnavailable}
            hasExistingApplication={hasExistingApplication}
            handleReject={handleReject}
            hasScreeningQuestions={Array.isArray(job.screening_questions) && job.screening_questions.length > 0}
          />
        </div>
      </div>

      <ApplicationSuccessModal
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
      />
    </div>
  );
}
