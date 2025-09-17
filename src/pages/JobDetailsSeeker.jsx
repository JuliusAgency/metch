
import React, { useState, useEffect } from "react";
import { useLocation, Link, useNavigate } from "react-router-dom";
import { Job } from "@/api/entities";
import { JobApplication } from "@/api/entities";
import { User } from "@/api/entities";
// Removed JobView import as it's no longer used for tracking
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
  Building2
} from "lucide-react";
import { motion } from "framer-motion";
import { createPageUrl } from "@/utils";
import { UserAnalytics } from "@/components/UserAnalytics"; // Changed import for UserAnalytics

// Mock job images for the gallery
const JOB_IMAGES = [
  "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=300&h=200&fit=crop",
  "https://images.unsplash.com/photo-1497366216548-37526070297c?w=300&h=200&fit=crop",
  "https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=300&h=200&fit=crop",
  "https://images.unsplash.com/photo-1556761175-b413da4baf72?w=300&h=200&fit=crop"
];

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
      
      // Try to get authenticated user first
      try {
        userData = await User.me();
      } catch (error) {
        // Use demo user for non-authenticated access
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
        
        // Try to fetch real job data first if not a demo user
        if (!userData?.isDemo) {
          try {
            const jobResults = await Job.filter({ id: jobId });
            if (jobResults.length > 0) {
              fetchedJob = jobResults[0];
            }
          } catch (error) {
            console.log("Failed to fetch real job data, using mock data for " + (userData?.email || "anonymous user"));
          }
        }
        
        // Use mock job data if real data failed or for demo users
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
              { value: "ניסיון של שנתיים לפחות בשירות לקוחות או מכירות - יתרון", type: "required" },
              { value: "ניסיון קודם בתחום הטכנולוגיה או הביטוח או בתחום סמוך - יתרון", type: "advantage" },
              { value: "יכולת עבודה במסגרת לחץ וריבוי משימות (אופציה בטלפונים)", type: "required" },
              { value: "עבודה בצוות (אופציה בטלפונים)", type: "required" },
              { value: "שליטה טובה באנגלית", type: "required" }
            ],
            structured_education: [
              { value: "תואר ראשון בתחום רלוונטי - יתרון", type: "advantage" },
              { value: "השכלה תיכונית מלאה", type: "required" },
              { value: "קורסים בשירות לקוחות - יתרון", type: "advantage" }
            ],
            match_score: 90,
            screening_questions: [
              { text: "מה הניסיון שלך בשירות לקוחות?", type: "text" },
              { text: "איך אתה מתמודד עם לקוחות קשים?", type: "text" }
            ]
          };
        }
        
        setJob(fetchedJob);
        
        // Track job view only for authenticated users (not demo)
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

    // Track application attempt only for authenticated users
    if (user?.email && !user?.isDemo) {
      await UserAnalytics.trackJobApplication(user.email, job);
    } else {
      console.log("Demo user - application tracking skipped.");
    }

    // Check if job has screening questions
    if (job.screening_questions && job.screening_questions.length > 0) {
      navigate(createPageUrl(`AnswerQuestionnaire?job_id=${job.id}`));
      return;
    }

    // Direct application without screening
    setApplying(true);
    try {
      // Allow demo users to simulate application, but don't call backend if it's a demo
      if (!user?.isDemo) {
        await JobApplication.create({
          job_id: job.id,
          applicant_email: user.email,
          status: 'pending'
        });
      } else {
        console.log("Demo user - application submitted (simulated).");
      }
      
      // Show success message and navigate
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
    // Track job rejection only for authenticated users
    if (user?.email && job && !user?.isDemo) {
      await UserAnalytics.trackJobRejection(user.email, job);
    } else {
      console.log("Demo user - job rejection tracking skipped.");
    }
    // Navigate back or show rejection confirmation
    navigate(createPageUrl("JobSearch"));
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: job.title,
          text: `בדוק את המשרה הזו: ${job.title} ב${job.company}`,
          url: window.location.href,
        });
      } catch (err) {
        console.log('Error sharing:', err);
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href);
    }
  };

  const handleLike = async () => { // Renamed from toggleSave to handleLike as per outline
    if (!user?.email || !job) return;
    const newLikedState = !isLiked;
    setIsLiked(newLikedState);

    // Track save/unsave only for authenticated users
    if (!user?.isDemo) {
      if (newLikedState) {
        await UserAnalytics.trackJobSave(user.email, job);
      } else {
        await UserAnalytics.trackJobUnsave(user.email, job);
      }
    } else {
      console.log("Demo user - job save/unsave tracking skipped.");
    }
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

  const tabContent = {
    about: (
      <div className="text-right space-y-4">
        <p className="text-gray-700 leading-relaxed">{job.description}</p>
      </div>
    ),
    requirements: (
      <div className="text-right space-y-3">
        {job.structured_requirements?.map((req, index) => (
          <div key={index} className="flex items-start gap-2">
            <span className="text-gray-600 mt-1">•</span>
            <p className="text-gray-700 text-sm">{req.value}</p>
          </div>
        ))}
      </div>
    ),
    training: (
      <div className="text-right space-y-3">
        {job.structured_education?.map((edu, index) => (
          <div key={index} className="flex items-start gap-2">
            <span className="text-gray-600 mt-1">•</span>
            <p className="text-gray-700 text-sm">{edu.value}</p>
          </div>
        ))}
      </div>
    )
  };

  return (
    <div className="p-4 md:p-6" dir="rtl">
      <div className="w-[85vw] mx-auto">
        <Card className="bg-white rounded-2xl md:rounded-[2.5rem] shadow-xl border border-gray-100 overflow-hidden">
          <div className="relative">
            {/* Header */}
            <div className="relative h-32 overflow-hidden -m-px">
              <div 
                className="absolute inset-0 w-full h-full [clip-path:ellipse(120%_100%_at_50%_100%)]"
                style={{
                  backgroundImage: 'url(https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/689c85a409a96fa6a10f1aca/d9fc7bd69_Rectangle6463.png)',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  backgroundRepeat: 'no-repeat'
                }}
              />
              <Link 
                to={createPageUrl("JobSearch")} 
                className="absolute top-4 right-6 w-10 h-10 bg-white/30 rounded-full flex items-center justify-center backdrop-blur-sm hover:bg-white/50 transition-colors z-10"
              >
                <ChevronRight className="w-6 h-6 text-gray-800 rotate-180" />
              </Link>
            </div>

            <CardContent className="p-4 sm:p-6 md:p-8 -mt-16 relative z-10">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-8"
              >
                {/* Company Logo */}
                <div className="text-center">
                  <div className="w-20 h-20 mx-auto mb-4 bg-white rounded-full shadow-lg flex items-center justify-center">
                    {job.company === "Google" ? (
                      <div className="w-12 h-12 bg-gradient-to-r from-blue-500 via-red-500 via-yellow-500 to-green-500 rounded-full flex items-center justify-center">
                        <span className="text-white font-bold text-lg">G</span>
                      </div>
                    ) : (
                      <Building2 className="w-10 h-10 text-gray-600" />
                    )}
                  </div>
                  <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">{job.title}</h1>
                </div>

                {/* Job Info Badges */}
                <div className="flex justify-center items-center gap-4 mb-6">
                  <Badge className="bg-blue-50 text-blue-700 border border-blue-200 px-4 py-2 rounded-full flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    {job.start_date}
                  </Badge>
                  <Badge className="bg-blue-50 text-blue-700 border border-blue-200 px-4 py-2 rounded-full flex items-center gap-2">
                    <Briefcase className="w-4 h-4" />
                    {employmentTypeText[job.employment_type] || 'משרה מלאה'}
                  </Badge>
                  <Badge className="bg-blue-50 text-blue-700 border border-blue-200 px-4 py-2 rounded-full flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    {job.location}
                  </Badge>
                </div>

                {/* Match Score */}
                <div className="text-center mb-8">
                  <div className="text-lg font-semibold text-gray-700 mb-2">{job.match_score || 90}% התאמה</div>
                  <div className="w-full max-w-md mx-auto h-3 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-green-500 transition-all duration-1000"
                      style={{ width: `${job.match_score || 90}%` }}
                    ></div>
                  </div>
                </div>

                {/* Company Perks */}
                <div className="flex justify-center gap-2 mb-8 flex-wrap">
                  <Badge className="bg-green-100 text-green-800 border-0 px-4 py-2">סביבה טובה</Badge>
                  <Badge className="bg-green-100 text-green-800 border-0 px-4 py-2">רכב חברה</Badge>
                  <Badge className="bg-green-100 text-green-800 border-0 px-4 py-2">עבודה בטכנולוגיה</Badge>
                  <Badge className="bg-green-100 text-green-800 border-0 px-4 py-2">משכר מעלה</Badge>
                </div>

                {/* Tab Navigation */}
                <div className="flex justify-center gap-2 mb-8">
                  <Button
                    variant={activeTab === 'about' ? 'default' : 'outline'}
                    onClick={() => setActiveTab('about')}
                    className="rounded-full px-6 py-2"
                  >
                    על המשרה
                  </Button>
                  <Button
                    variant={activeTab === 'requirements' ? 'default' : 'outline'}
                    onClick={() => setActiveTab('requirements')}
                    className="rounded-full px-6 py-2"
                  >
                    דרישות
                  </Button>
                  <Button
                    variant={activeTab === 'training' ? 'default' : 'outline'}
                    onClick={() => setActiveTab('training')}
                    className="rounded-full px-6 py-2"
                  >
                    חומרי אימון
                  </Button>
                </div>

                {/* Tab Content */}
                <div className="bg-gray-50/80 rounded-2xl p-6 min-h-[200px]">
                  {tabContent[activeTab]}
                </div>

                {/* Image Gallery */}
                <div className="grid grid-cols-4 gap-2 mb-8">
                  {JOB_IMAGES.map((image, index) => (
                    <div key={index} className="aspect-video rounded-lg overflow-hidden">
                      <img 
                        src={image} 
                        alt={`Workplace ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button
                    onClick={handleApply}
                    disabled={applying}
                    className="w-full sm:w-auto px-8 py-3 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-lg"
                  >
                    {applying ? 'שולח...' : 'הגשת מועמדות'}
                  </Button>
                  <Button
                    onClick={handleReject}
                    variant="outline"
                    className="w-full sm:w-auto px-8 py-3 rounded-full border-gray-300 text-gray-700 font-bold text-lg"
                  >
                    לא מעוניין
                  </Button>
                </div>

                {/* Share and Like Actions */}
                <div className="flex justify-center gap-4 pt-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleShare}
                    className="text-gray-500 hover:text-blue-600"
                  >
                    <Share2 className="w-5 h-5 ml-2" />
                    שתף
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleLike} // Changed from toggleSave to handleLike
                    className={`${isLiked ? 'text-red-500' : 'text-gray-500'} hover:text-red-600`}
                  >
                    <Heart className={`w-5 h-5 ml-2 ${isLiked ? 'fill-current' : ''}`} />
                    {isLiked ? 'נשמר' : 'שמור'}
                  </Button>
                </div>
              </motion.div>
            </CardContent>
          </div>
        </Card>
      </div>
    </div>
  );
}
