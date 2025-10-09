
import React, { useState, useEffect } from "react";
import { useLocation, Link, useNavigate } from "react-router-dom";
import { Job } from "@/api/entities";
import { JobApplication } from "@/api/entities";
import { User } from "@/api/entities";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  ChevronRight, 
  MapPin, 
  Clock, 
  Briefcase,
  Share2,
  Heart,
  Building2,
  Check
} from "lucide-react";
import { motion } from "framer-motion";
import { createPageUrl } from "@/utils";
import { UserAnalytics } from "@/components/UserAnalytics";
import JobStatusBanner from "@/components/jobs/JobStatusBanner";

const JOB_IMAGES = [
  "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=300&h=200&fit=crop",
  "https://images.unsplash.com/photo-1497366216548-37526070297c?w=300&h=200&fit=crop",
  "https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=300&h=200&fit=crop",
  "https://images.unsplash.com/photo-1556761175-b413da4baf72?w=300&h=200&fit=crop",
  "https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=300&h=200&fit=crop",
  "https://images.unsplash.com/photo-1515378791036-0648a814c963?w=300&h=200&fit=crop",
  "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=300&h=200&fit=crop",
];

const MOCK_PERKS = ["משרד מפנק", "רכב חברה", "עבודה במשמרות", "סיבוס"];

export default function JobDetailsSeeker() {
  const [job, setJob] = useState(null);
  const [activeTab, setActiveTab] = useState('about');
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [user, setUser] = useState(null);
  const [isLiked, setIsLiked] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const loadData = React.useCallback(async () => {
    setLoading(true);
    try {
      let userData = null;
      
      try {
        userData = await User.me();
      } catch (error) {
        userData = { 
          full_name: "דניאל (דוגמה)", 
          email: "demo@example.com",
          isDemo: true
        };
      }
      
      setUser(userData);

      const params = new URLSearchParams(location.search);
      const jobId = params.get('id');
      
      if (jobId) {
        let fetchedJob = null;
        
        if (!userData?.isDemo) {
          try {
            const jobResults = await Job.filter({ id: jobId });
            if (jobResults.length > 0) {
              fetchedJob = jobResults[0];
            } else {
               console.log(`Job with ID ${jobId} not found, falling back to mock data.`);
            }
          } catch (error) {
            console.log("Failed to fetch real job data, using mock data", error);
          }
        }
        
        if (!fetchedJob) {
          fetchedJob = {
            id: jobId,
            title: "מנהלת קשרי לקוחות",
            company: "Google",
            company_logo_url: "https://upload.wikimedia.org/wikipedia/commons/2/2f/Google_2015_logo.svg",
            location: "מרכז",
            employment_type: "full_time",
            start_date: "מיידי",
            description: "אנחנו ב-Techwise מחפשים מנהלת קשרי לקוחות מנוסה להצטרף לצוות שלנו. התפקיד כולל ניהול קשרים עם לקוחות עסקיים, טיפול בפניות ומתן שירות ברמה הגבוהה ביותר. תהיה זו הזדמנות מצוינת להשפיע על חוויית הלקוח ולהוביל פרויקטים משמעותיים.",
            structured_requirements: [
              { value: "ניסיון של שנתיים לפחות בשירות לקוחות או מכירות - חובה", type: "required" },
              { value: "ניסיון קודם בתחום הטכנולוגיה או הביטוח או בתחום סמוך - יתרון", type: "advantage" },
              { value: "יכולת עבודה במסגרת לחץ וריבוי משימות (אופציה בטלפונים)", type: "required" },
              { value: "עבודה בצוות (אופציה בטלפונים)", type: "required" },
              { value: "שליטה טובה באנגלית", type: "required" }
            ],
            structured_education: [
              { value: "ניסיון של שנתיים לפחות בחברת הפקות מומלץ - יתרון", type: "advantage" },
              { value: "ניסיון קודם בתחום הרפואה או הביטוח או בתחום סמוך - יתרון", type: "advantage" },
              { value: "יכולת עבודה במסגרת הקשרת מורכבת (אופציה באטלבוקס)", type: "required" },
              { value: "עבודה בצוותי בעלות (אופציה באטלבוקס)", type: "required" },
              { value: "שליטת פרמדים", type: "required" }
            ],
            match_score: 90,
            screening_questions: [
              { text: "מה הניסיון שלך בשירות לקוחות?", type: "text" },
              { text: "האם יש לך ניסיון במכירות?", type: "yes_no" }
            ],
            status: "active",
            // Add a more robust attachments mock for better testing
            attachments: JOB_IMAGES.map(url => ({ name: 'workplace image', url, type: 'image/jpeg', size: 123456 }))
          };
        }
        
        setJob(fetchedJob);
        
        if (userData?.email && !userData?.isDemo) {
          try {
            await UserAnalytics.trackJobView(userData.email, fetchedJob);
          } catch (error) {
            console.log("Failed to track job view for " + userData.email);
          }
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

  const handleApply = async () => {
    if (!job || !user) return;

    const unavailableStatuses = ['filled', 'filled_via_metch', 'closed', 'paused'];
    if (unavailableStatuses.includes(job.status)) {
      return;
    }

    if (user?.email && !user?.isDemo) {
      await UserAnalytics.trackJobApplication(user.email, job);
    }

    if (job.screening_questions && job.screening_questions.length > 0) {
      navigate(createPageUrl(`AnswerQuestionnaire?job_id=${job.id}`));
      return;
    }

    setApplying(true);
    try {
      if (!user?.isDemo) {
        await JobApplication.create({
          job_id: job.id,
          applicant_email: user.email,
          status: 'pending'
        });
      }
      
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
    if (user?.email && job && !user?.isDemo) {
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
            <div 
              className="absolute top-0 left-0 right-0 h-40 bg-no-repeat bg-cover bg-center"
              style={{ 
                backgroundImage: 'url(https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/689c85a409a96fa6a10f1aca/d9fc7bd69_Rectangle6463.png)',
                clipPath: 'ellipse(120% 100% at 50% 0%)'
              }}
            />
            
            <Link 
              to={createPageUrl("JobSearch")} 
              className="absolute top-6 right-6 w-10 h-10 bg-white/30 rounded-full flex items-center justify-center backdrop-blur-sm hover:bg-white/50 transition-colors z-20"
            >
              <ChevronRight className="w-6 h-6 text-gray-800" />
            </Link>

          <CardContent className="relative z-10 px-4 sm:px-8 py-12">
             <div className="w-20 h-20 bg-white rounded-full shadow-lg flex items-center justify-center border-4 border-white mx-auto -mt-4 mb-4">
                {job.company === "Google" ? (
                  <img src="https://upload.wikimedia.org/wikipedia/commons/c/c1/Google_%22G%22_logo.svg" alt="Google" className="w-10 h-10"/>
                ) : (
                  <Building2 className="w-10 h-10 text-gray-600" />
                )}
              </div>

            {isUnavailable && (
              <JobStatusBanner status={job.status} className="mb-6" />
            )}

            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-4">{job.title}</h1>
              
              <div className="flex justify-center items-center gap-6 mb-6">
                <Badge variant="outline" className="text-sm font-medium border-gray-300 text-gray-700 py-1 px-3">
                  <MapPin className="w-4 h-4 ml-1.5" />
                  {job.location}
                </Badge>
                <Badge variant="outline" className="text-sm font-medium border-gray-300 text-gray-700 py-1 px-3">
                  <Briefcase className="w-4 h-4 ml-1.5" />
                  {employmentTypeText[job.employment_type] || 'משרה מלאה'}
                </Badge>
                <Badge variant="outline" className="text-sm font-medium border-gray-300 text-gray-700 py-1 px-3">
                  <Clock className="w-4 h-4 ml-1.5" />
                  {job.start_date}
                </Badge>
              </div>

              <div className="max-w-md mx-auto mb-6">
                <div className="text-center mb-2">
                  <span className="text-lg font-semibold text-gray-700">{job.match_score || 90}% התאמה</span>
                </div>
                <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-green-500 transition-all duration-1000 rounded-full"
                    style={{ width: `${job.match_score || 90}%` }}
                  ></div>
                </div>
              </div>

              <div className="flex justify-center gap-3 md:gap-6 flex-wrap">
                {(job.company_perks || MOCK_PERKS).map((perk, index) => (
                    <div key={index} className="flex items-center gap-2 text-gray-600">
                        <Check className="w-4 h-4 text-green-500"/>
                        <span className="text-sm font-medium">{perk}</span>
                    </div>
                ))}
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {[
                    { title: "על המשרה", content: <p className="text-sm leading-relaxed">{job.description}</p> },
                    { title: "דרישות", content: <ul className="list-disc list-inside space-y-2 text-sm">{job.structured_requirements?.map((req, i) => <li key={i}>{req.value}</li>)}</ul> },
                    { title: "תחומי אחריות", content: <ul className="list-disc list-inside space-y-2 text-sm">{job.structured_education?.map((edu, i) => <li key={i}>{edu.value}</li>)}</ul> }
                ].map(section => (
                    <div key={section.title} className="bg-gray-50/70 border border-gray-200/60 rounded-2xl p-6 text-right">
                        <h3 className="font-bold text-lg mb-4 text-gray-900">{section.title}</h3>
                        <div className="text-gray-700">{section.content}</div>
                    </div>
                ))}
            </div>

            {imageAttachments.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-3 mb-10">
                {imageAttachments.slice(0, 7).map((image, index) => (
                  <div key={index} className="aspect-w-4 aspect-h-3 rounded-lg overflow-hidden shadow-sm">
                    <img 
                      src={image.url} 
                      alt={`Workplace ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                onClick={handleApply}
                disabled={applying || isUnavailable}
                className={`w-full sm:w-auto px-12 py-3 rounded-full font-bold text-lg h-auto ${
                  isUnavailable
                    ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                {isUnavailable ? 'משרה לא זמינה' : applying ? 'שולח...' : 'הגשת מועמדות'}
              </Button>
              
              {!isUnavailable && (
                <Button
                  onClick={handleReject}
                  variant="outline"
                  className="w-full sm:w-auto px-12 py-3 rounded-full border-gray-300 text-gray-700 font-bold text-lg h-auto hover:bg-gray-50"
                >
                  לא מעוניין
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
