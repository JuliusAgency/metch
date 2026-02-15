import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Job, UserProfile, CV, Notification } from "@/api/entities";
import { JobApplication } from "@/api/entities";
import { User, UserAction } from "@/api/entities";
import { BrainCircuit, Sparkles, CheckCircle2 } from "lucide-react";
import { Core } from "@/api/integrations";
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
import settingsMobileBg from "@/assets/settings_mobile_bg.jpg";
import { calculate_match_score, calculate_match_breakdown } from "@/utils/matchScore";

export default function JobDetailsSeeker() {
  useRequireUserType(); // Ensure user has selected a user type
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [cvData, setCvData] = useState(null);
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [matchBreakdown, setMatchBreakdown] = useState(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
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

      let fetchedProfiles = [];
      if (userData?.id) {
        // Fetch Profile and CV for AI context
        const [profiles, cvs] = await Promise.all([
          UserProfile.filter({ id: userData.id }),
          CV.filter({ user_email: userData.email })
        ]);
        fetchedProfiles = profiles;
        setProfile(profiles[0] || null);
        setCvData(cvs[0] || null);
      }

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
              // Construct complete candidate profile merging Auth, UserProfile (Prefs) and CV data
              const candidateProfile = {
                ...userData,
                ...(fetchedProfiles[0] || {}),
                ...(cvData || {}),
                certifications: cvData?.certifications || []
              };

              // Use breakdown to get both score and detailed stats for AI
              const breakdown = await calculate_match_breakdown(candidateProfile, fetchedJob);
              if (breakdown) {
                fetchedJob.match_score = breakdown.total_score; // breakdown returns 0-100
                setMatchBreakdown(breakdown);
              }
            } catch (e) {
              console.error("Error calculating match score:", e);
            }
          }

          // Helper to safely parse JSON from DB
          const safeParseJSON = (data, fallback = []) => {
            if (!data) return fallback;
            if (typeof data !== 'string') return data;

            try {
              let jsonStr = data;
              // Handle Postgres Bytea Hex format
              if (jsonStr.startsWith('\\x')) {
                const hex = jsonStr.slice(2);
                let str = '';
                for (let i = 0; i < hex.length; i += 2) {
                  str += String.fromCharCode(parseInt(hex.substr(i, 2), 16));
                }
                jsonStr = str;
              }
              return JSON.parse(jsonStr);
            } catch (e) {
              console.warn("Failed to parse JSON field", e);
              return fallback;
            }
          };

          // Parse all relevant structured fields
          fetchedJob.screening_questions = safeParseJSON(fetchedJob.screening_questions);
          fetchedJob.attachments = safeParseJSON(fetchedJob.attachments);
          fetchedJob.company_perks = safeParseJSON(fetchedJob.company_perks);
          fetchedJob.structured_requirements = safeParseJSON(fetchedJob.structured_requirements);
          fetchedJob.structured_education = safeParseJSON(fetchedJob.structured_education);
          fetchedJob.structured_certifications = safeParseJSON(fetchedJob.structured_certifications);

          // Also handle responsibilities/requirements if they might be stored as JSON strings
          if (typeof fetchedJob.responsibilities === 'string' && fetchedJob.responsibilities.trim().startsWith('[')) {
            fetchedJob.responsibilities = safeParseJSON(fetchedJob.responsibilities);
          }
          if (typeof fetchedJob.requirements === 'string' && fetchedJob.requirements.trim().startsWith('[')) {
            fetchedJob.requirements = safeParseJSON(fetchedJob.requirements);
          }

          setJob(fetchedJob);

          // Fetch company logo from employer profile
          if (fetchedJob.created_by) {
            try {
              const employerProfiles = await UserProfile.filter({ email: fetchedJob.created_by.toLowerCase() });
              if (employerProfiles.length > 0 && employerProfiles[0].profile_picture) {
                setJob(prev => ({ ...prev, company_logo_url: employerProfiles[0].profile_picture }));
              }
            } catch (e) {
              console.error("Error fetching employer logo:", e);
            }
          }

          // Check for existing application
          if (userData?.email) {
            try {
              await UserAnalytics.trackJobView(userData, fetchedJob); // Pass full user object

              // Check if user already applied - Check by ID OR Email for robustness
              const existingAppsById = await JobApplication.filter({
                job_id: jobId,
                applicant_id: userData.id
              });

              let existingAppsByEmail = [];
              if (userData.email) {
                existingAppsByEmail = await JobApplication.filter({
                  job_id: jobId,
                  applicant_email: userData.email
                });
              }

              const hasApplied = existingAppsById.length > 0 || (existingAppsByEmail && existingAppsByEmail.length > 0);
              setHasExistingApplication(hasApplied);
            } catch (error) {
              console.error("Error checking existing application:", error);
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
  }, [jobIdParam, navigate]); // Closing loadData

  useEffect(() => {
    loadData();
  }, [loadData]);

  // AI Analysis Effect
  useEffect(() => {
    const generateAnalysis = async () => {
      if (!job || !user || !profile || !cvData || aiAnalysis || isAiLoading) return;

      // Unique cache key for this user + job combo - Updated to v2 for CV integration
      const cacheKey = `metch_job_insight_v2_${user.id}_${job.id}`;

      // 1. Try to load from DB (UserAction) first - Cross-device persistence
      // 1. Try to load from DB (UserAction) first - Cross-device persistence
      try {
        // Optimized query: Search for specific job_id within the JSON column
        const actions = await UserAction.filter({
          user_id: user.id,
          action_type: 'job_match_analysis',
          'additional_data->>job_id': job.id // Direct DB filtering
        });

        if (actions.length > 0) {
          // Sort by creation date descending to get the latest if duplicates exist
          const latestAction = actions.sort((a, b) => new Date(b.created_date) - new Date(a.created_date))[0];

          if (latestAction?.additional_data?.analysis) {
            const dbAnalysis = latestAction.additional_data.analysis;
            if (dbAnalysis.why_suitable && dbAnalysis.match_analysis) {
              console.log("[JobDetails] Loaded AI analysis from DB (Persisted)");
              setAiAnalysis(dbAnalysis);
              // Update local cache too for faster subsequent loads on this device
              localStorage.setItem(cacheKey, JSON.stringify(dbAnalysis));
              return;
            }
          }
        }
      } catch (dbError) {
        console.warn("Failed to load analysis from DB", dbError);
      }

      // 2. Try to load from local cache (fallback)
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        try {
          const parsedCache = JSON.parse(cached);
          if (parsedCache.why_suitable && parsedCache.match_analysis) {
            console.log("[JobDetails] Loaded AI analysis from cache");
            setAiAnalysis(parsedCache);
            return;
          }
        } catch (e) {
          localStorage.removeItem(cacheKey);
        }
      }

      // If mock job, use partial mock data (and cache it if needed, or just set it)
      if (job.id === 'f0000000-0000-0000-0000-000000000001' && job.metch_analysis) {
        // Adapt mock structure
        setAiAnalysis({
          why_suitable: job.metch_analysis.reasoning || job.metch_analysis.summary,
          match_analysis: [
            "התאמה מלאה בדרישות הליבה (Python, Java)",
            "מיקום המשרה תואם את העדפותיך (מרכז)",
            "השכלה רלוונטית מהטכניון",
            "חפיפה בסוג המשרה (מלאה, מיידית)"
          ]
        });
        return;
      }

      setIsAiLoading(true);
      try {
        const assistantId = import.meta.env.VITE_JOB_SUMMARY;
        if (!assistantId) {
          console.warn("VITE_JOB_SUMMARY env var is missing");
          setIsAiLoading(false);
          return;
        }

        const prompt = `
          Analyze the match between the candidate and the job.
          
          Candidate CV Data (Parsed/Analyzed):
          ${cvData.parsed_content || cvData.summary || cvData.raw_text || "No CV content available. Please analyze based on other provided fields."}
          
          Skills: ${Array.isArray(cvData.skills) ? cvData.skills.join(', ') : ''}
          Experience Summary: ${Array.isArray(cvData.work_experience) ? cvData.work_experience.map(e => e.title || e.role).join(', ') : ''}
          Education: ${Array.isArray(cvData.education) ? cvData.education.map(e => e.field || e.degree).join(', ') : ''}
          
          Candidate Preferences:
          Role: ${profile.job_titles ? profile.job_titles.join(', ') : 'Not specified'}
          Location: ${profile.preferred_locations ? profile.preferred_locations.join(', ') : 'Not specified'}
          Job Type: ${profile.job_types ? profile.job_types.join(', ') : 'Not specified'}
          Career Stage: ${profile.career_stage || 'Not specified'}
          Availability: ${profile.availability || 'Not specified'}
          
          Job Details:
          Title: ${job.title}
          Company: ${job.company}
          Description: ${job.description}
          Requirements: ${Array.isArray(job.requirements) ? job.requirements.join(', ') : job.requirements}
          Location: ${job.location}
          
          Match Algorithm Breakdown:
          ${matchBreakdown ? JSON.stringify(matchBreakdown, null, 2) : 'Not available'}

          Please output a valid JSON object with detailed Hebrew content:
          {
            "why_suitable": "פסקה מפורטת (3-4 משפטים) שמסבירה למועמד למה המשרה מתאימה לו, בהתבסס על ניתוח ההתאמה ונתוני קורות החיים.",
            "match_analysis": [
              "נקודה ראשונה: התייחסות להשכלה/ניסיון (למשל: 'השכלה רלוונטית בהנדסת תוכנה...')",
              "נקודה שניה: התייחסות לכישורים/טכנולוגיות (למשל: 'שליטה ב-React ו-Node.js...')",
              "נקודה שלישית: התייחסות למיקום/סוג משרה (למשל: 'מיקום המשרה בתל אביב תואם את העדפותיך...')",
              "נקודה רביעית: התייחסות לחוזקה נוספת או התאמה אישיותית"
            ]
          }
          
          Guidelines:
          - "why_suitable": Should be encouraging and professional. Explain the "Why".
          - "match_analysis": Should be a list of 4-5 bullet points strings. Each point should highlight a specific match area (Education, Experience, Skills, Location/Type).
          - Use the "Match Algorithm Breakdown" data to support your points (e.g. if 'location' score is high, mention it).
          
          Ensure the response is strictly valid JSON without Markdown formatting.
        `;

        const response = await Core.InvokeAssistant({
          assistantId,
          prompt
        });

        if (response.content) {
          let clean = response.content.trim();
          // Cleanup markdown code blocks if present
          clean = clean.replace(/^```json\s*/g, '').replace(/^```\s*/g, '').replace(/\s*```$/g, '');

          try {
            const parsed = JSON.parse(clean);
            if (parsed.why_suitable && parsed.match_analysis) {
              setAiAnalysis(parsed);

              // 3. Save to DB (UserAction)
              try {
                await UserAction.create({
                  user_id: user.id,
                  action_type: 'job_match_analysis',
                  additional_data: {
                    job_id: job.id,
                    analysis: parsed,
                    created_at: new Date().toISOString()
                  },
                  created_date: new Date().toISOString()
                });
                console.log("[JobDetails] Saved AI analysis to DB");
              } catch (saveError) {
                console.error("Failed to save analysis to DB:", saveError);
              }

              // 4. Save to local cache
              localStorage.setItem(cacheKey, JSON.stringify(parsed));
              console.log("[JobDetails] Generated and cached AI analysis");
            }
          } catch (e) {
            console.error("Failed to parse AI response", e);
          }
        }
      } catch (error) {
        console.error("Error generating AI analysis:", error);
      } finally {
        setIsAiLoading(false);
      }
    };

    generateAnalysis();
  }, [job, user, profile, cvData]);

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
        status: 'pending',
        created_date: new Date().toISOString()
      });

      // Track application in analytics
      try {
        if (user.email) {
          const { UserAnalytics } = await import("@/components/UserAnalytics");
          await UserAnalytics.trackJobApplication(user, job);
        }
      } catch (error) {
        console.warn("Analytics error", error);
      }

      // Create notification for employer
      try {
        await Notification.create({
          type: 'application_submitted',
          user_id: job.created_by_id || job.employer_id || null, // Ensure UUID or null
          email: job.created_by,
          title: 'הוגשה מועמדות חדשה',
          message: `מועמד הגיש מועמדות למשרת ${job.title}`,
          is_read: false,
          data: {
            applicant_email: user.email,
            job_id: job.id
          },
          created_date: new Date().toISOString()
        });
        console.log('[JobDetailsSeeker] Notification created for employer:', job.created_by);
      } catch (e) {
        console.error("Error creating notification for employer:", e);
      }

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
    shifts: 'משמרות',
    contract: 'חוזה',
    freelance: 'פרילנס',
    internship: 'התמחות',
    flexible: 'גמיש/ה'
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
      {/* MOBILE FIXED BACKGROUND - Matches Settings/Profile pattern */}
      <div
        className="md:hidden fixed top-0 left-0 right-0 pointer-events-none"
        style={{
          width: '100%',
          height: '320px',
          backgroundImage: `url(${settingsMobileBg})`,
          backgroundSize: 'cover',
          backgroundPosition: 'top center',
          backgroundRepeat: 'no-repeat',
          zIndex: '0'
        }}
      />

      <div className="relative h-full overflow-y-auto">
        <div className="w-full mx-auto">
          {isUnavailable && (
            <div className="px-4 md:px-0">
              <JobStatusBanner status={job.status} className="mb-4" />
            </div>
          )}

          <div className="md:hidden h-[100px]" />

          <div className="bg-white mx-0 mt-[-30px] md:mt-0 rounded-t-[40px] [border-top-left-radius:80%_55px] [border-top-right-radius:80%_55px] px-4 py-8 md:p-6 md:shadow-[0_-15px_45px_rgba(0,0,0,0.06)] relative z-20 min-h-screen">
            <div className="max-w-6xl mx-auto">
              <div className="md:hidden -mt-14 mb-6">
                <SeekerHeader job={job} returnUrl={returnUrl} />
              </div>
              <div className="hidden md:block">
                <SeekerHeader job={job} returnUrl={returnUrl} />
              </div>
              <SeekerJobTitle job={job} employmentTypeText={employmentTypeText} />
              <div className="hidden md:block">
                <SeekerJobPerks perks={job.company_perks} />
              </div>

              <SeekerJobInfo
                job={job}
                aiAnalysis={aiAnalysis}
                isAiLoading={isAiLoading}
                perks={job.company_perks}
              />

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
        </div>
      </div>

      <ApplicationSuccessModal
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
      />
    </div>
  );
}
