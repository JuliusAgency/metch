import { useState, useEffect, useCallback } from "react";
import { useLocation, Link, useNavigate } from "react-router-dom";
import { Job } from "@/api/entities";
import { JobApplication } from "@/api/entities";
import { JobView } from "@/api/entities";
import { User, UserProfile } from "@/api/entities";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Edit, Eye, Copy, Play, Pause, Users, Briefcase, MapPin, Award } from "lucide-react";
import { createPageUrl } from "@/utils";
import { EmployerAnalytics } from "@/components/EmployerAnalytics";
import { useRequireUserType } from "@/hooks/use-require-user-type";
import { useUser } from "@/contexts/UserContext";
import { useToast } from "@/components/ui/use-toast";

// Import Seeker Components
import SeekerHeader from "@/components/seeker/SeekerHeader";
import SeekerJobTitle from "@/components/seeker/SeekerJobTitle";
import SeekerJobPerks from "@/components/seeker/SeekerJobPerks";
import SeekerJobImages from "@/components/seeker/SeekerJobImages";
import settingsMobileBg from "@/assets/settings_mobile_bg.jpg";
import JobStatusBanner from "@/components/jobs/JobStatusBanner";
import NoCreditsDialog from "@/components/dialogs/NoCreditsDialog";

// Helper to determine match score color
const getMatchScoreColor = (score) => {
  if (score >= 80) return "bg-green-500";
  if (score >= 60) return "bg-yellow-500";
  if (score >= 40) return "bg-orange-400";
  return "bg-red-400";
};

// Helper to generate a stable random score if missing
const getStableMatchScore = (id) => {
  if (!id) return 90;
  let hash = 0;
  const str = String(id);
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return 75 + (Math.abs(hash) % 25);
};

export default function JobDetails() {
  useRequireUserType();
  const [job, setJob] = useState(null);
  const [applications, setApplications] = useState([]);
  const [applicantProfiles, setApplicantProfiles] = useState({});
  const [viewsCount, setViewsCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [showNoCreditsModal, setShowNoCreditsModal] = useState(false);
  const { updateProfile } = useUser();
  const { toast } = useToast();
  const location = useLocation();
  const navigate = useNavigate();

  const loadData = useCallback(async () => {
    try {
      const userData = await User.me();
      setUser(userData);

      const params = new URLSearchParams(location.search);
      const jobId = params.get('id');

      if (jobId) {
        const jobResults = await Job.filter({ id: jobId });
        if (jobResults.length > 0) {
          const fetchedJob = jobResults[0];

          const safeParseJSON = (data, fallback = []) => {
            if (!data) return fallback;
            if (typeof data !== 'string') return data;
            try {
              let jsonStr = data;
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
              return fallback;
            }
          };

          fetchedJob.company_perks = safeParseJSON(fetchedJob.company_perks);
          fetchedJob.attachments = safeParseJSON(fetchedJob.attachments);
          fetchedJob.screening_questions = safeParseJSON(fetchedJob.screening_questions);
          // Parse structured fields
          fetchedJob.structured_requirements = safeParseJSON(fetchedJob.structured_requirements, []);
          fetchedJob.structured_certifications = safeParseJSON(fetchedJob.structured_certifications, []);
          fetchedJob.structured_education = safeParseJSON(fetchedJob.structured_education, []);

          fetchedJob.requirements = safeParseJSON(fetchedJob.requirements, []);
          fetchedJob.responsibilities = safeParseJSON(fetchedJob.responsibilities, []);

          setJob(fetchedJob);

          const views = await JobView.filter({ job_id: jobId });
          setViewsCount(views.length);

          const appResults = await JobApplication.filter({ job_id: jobId });
          setApplications(appResults);

          if (appResults.length > 0) {
            const uniqueIds = [...new Set(appResults.map(a => a.applicant_id).filter(Boolean))];

            const idMap = {};
            await Promise.all(uniqueIds.map(async (id) => {
              try {
                const profiles = await UserProfile.filter({ id });
                if (profiles.length > 0) idMap[id] = profiles[0];
              } catch (e) { console.error(e); }
            }));
            setApplicantProfiles(idMap);
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

  const handleStatusChange = async (newStatus) => {
    try {
      const oldStatus = job.status;
      if (newStatus === 'active' && oldStatus !== 'active' && oldStatus !== 'paused') {
        const userData = await User.me();
        const credits = userData?.job_credits || 0;
        if (credits <= 0) {
          setShowNoCreditsModal(true);
          return;
        }
        await updateProfile({ job_credits: credits - 1 });
        toast({ description: `המשרה פורסמה בהצלחה. יתרת משרות מעודכנת: ${credits - 1}` });
      }

      await Job.update(job.id, { status: newStatus });
      setJob(prev => ({ ...prev, status: newStatus }));
      if (user) EmployerAnalytics.trackJobStatusChange(user.email, job, oldStatus, newStatus);
    } catch (error) {
      console.error("Error updating status:", error);
      toast({ title: "שגיאה", description: "לא ניתן לעדכן את הסטטוס", variant: "destructive" });
    }
  };

  const handleDuplicateJob = async () => {
    try {
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
      if (Array.isArray(duplicatedJob.company_perks)) duplicatedJob.company_perks = JSON.stringify(duplicatedJob.company_perks);
      if (Array.isArray(duplicatedJob.requirements)) duplicatedJob.requirements = JSON.stringify(duplicatedJob.requirements);
      if (Array.isArray(duplicatedJob.responsibilities)) duplicatedJob.responsibilities = JSON.stringify(duplicatedJob.responsibilities);

      if (Array.isArray(duplicatedJob.structured_requirements)) duplicatedJob.structured_requirements = JSON.stringify(duplicatedJob.structured_requirements);
      if (Array.isArray(duplicatedJob.structured_certifications)) duplicatedJob.structured_certifications = JSON.stringify(duplicatedJob.structured_certifications);
      if (Array.isArray(duplicatedJob.structured_education)) duplicatedJob.structured_education = JSON.stringify(duplicatedJob.structured_education);

      if (Array.isArray(duplicatedJob.attachments)) duplicatedJob.attachments = JSON.stringify(duplicatedJob.attachments);
      if (Array.isArray(duplicatedJob.screening_questions)) duplicatedJob.screening_questions = JSON.stringify(duplicatedJob.screening_questions);

      await Job.create(duplicatedJob);
      toast({ description: "המשרה שוכפלה בהצלחה כטיוטה" });
      navigate(createPageUrl("JobManagement"));
    } catch (error) {
      console.error("Error duplicating job:", error);
    }
  };

  useEffect(() => {
    if (job && user) {
      EmployerAnalytics.trackJobView(user.email, job).catch(console.error);
    }
  }, [job, user]);

  if (loading) return <div className="flex justify-center items-center h-screen">טוען...</div>;
  if (!job) return <div className="text-center py-12">משרה לא נמצאה</div>;

  const employmentTypeText = {
    full_time: 'משרה מלאה',
    part_time: 'משרה חלקית',
    shifts: 'משמרות',
    contract: 'חוזה',
    freelance: 'פרילנס',
    internship: 'התמחות',
    flexible: 'גמיש/ה'
  };

  const isUnavailable = ['filled', 'filled_via_metch', 'closed', 'paused'].includes(job.status);
  const returnUrl = createPageUrl('JobManagement');

  const renderList = (items) => {
    if (!items) return null;
    if (typeof items === 'string') return <p className="text-[#4a5568] text-[15px] leading-relaxed whitespace-pre-wrap">{items}</p>;
    if (Array.isArray(items) && items.length > 0) {
      const validItems = items.filter(i => (typeof i === 'string' && i.trim() !== '') || (typeof i === 'object' && (i.value || i.label)));
      if (validItems.length === 0) return null;

      return (
        <ul className="space-y-3 pt-2">
          {validItems.map((item, i) => {
            const text = typeof item === 'string' ? item : (item.value || item.label);
            const type = typeof item === 'object' ? item.type : null;

            return (
              <li key={i} className="flex items-start gap-3 text-[#4a5568] text-[15px]">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-2 shrink-0" />
                <span className="leading-relaxed">
                  {text}
                  {type === 'required' && ' - חובה'}
                  {type === 'advantage' && ' - יתרון'}
                </span>
              </li>
            );
          })}
        </ul>
      );
    }
    return null;
  };

  const requirementsData = (job.structured_requirements && job.structured_requirements.length > 0)
    ? job.structured_requirements
    : job.requirements;

  const certificationsData = (job.structured_certifications && job.structured_certifications.length > 0)
    ? job.structured_certifications
    : null;

  return (
    <div className="h-full relative" dir="rtl">
      {/* Background */}
      <div className="md:hidden fixed top-0 left-0 right-0 pointer-events-none" style={{ width: '100%', height: '320px', backgroundImage: `url(${settingsMobileBg})`, backgroundSize: 'cover', backgroundPosition: 'top center', zIndex: '0' }} />

      <div className="relative h-full md:overflow-y-auto overflow-visible pb-12 w-full md:w-[98%] mx-auto md:bg-white md:rounded-[32px] md:shadow-[0_30px_70px_rgba(0,0,0,0.18)] md:overflow-hidden md:min-h-[88vh]">
        <div className="w-full mx-auto">
          {isUnavailable && (
            <div className="px-4 md:px-0">
              <JobStatusBanner status={job.status} className="mb-4" />
            </div>
          )}

          <div className="md:hidden h-[80px]" />

          {/* Mobile SeekerHeader - Positioned above the container to avoid clipping */}
          <div className="md:hidden relative z-30 -mb-12">
            <SeekerHeader job={job} returnUrl={returnUrl} />
          </div>

          <div className="bg-white w-full mt-[-60px] md:mt-0 [border-top-left-radius:50%_40px] [border-top-right-radius:50%_40px] md:rounded-none px-4 py-8 md:p-6 relative z-20 origin-top">
            <div className="max-w-6xl mx-auto space-y-8">
              <div className="hidden md:block"><SeekerHeader job={job} returnUrl={returnUrl} /></div>

              <SeekerJobTitle job={job} employmentTypeText={employmentTypeText} showMatchScore={false} />

              <SeekerJobPerks perks={job.company_perks} />

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-fr">

                {/* 1. About (Right in RTL) */}
                <Card className="bg-white border border-gray-100 shadow-sm rounded-2xl md:rounded-[24px] overflow-hidden hover:shadow-md transition-all h-full">
                  <CardContent className="p-6 md:p-8 flex flex-col h-full">
                    <div className="flex items-center gap-3 mb-4 shrink-0">
                      <h3 className="font-bold text-xl text-[#001a6e]">על המשרה</h3>
                    </div>
                    <div className="text-[#4a5568] text-[15px] leading-relaxed whitespace-pre-wrap flex-grow">
                      {job.description || "אין תיאור למשרה זו."}
                    </div>
                  </CardContent>
                </Card>

                {/* 2. Requirements (Middle) */}
                <Card className="bg-white border border-gray-100 shadow-sm rounded-2xl md:rounded-[24px] overflow-hidden hover:shadow-md transition-all h-full">
                  <CardContent className="p-6 md:p-8 flex flex-col h-full">
                    <div className="flex items-center gap-3 mb-4 shrink-0">
                      <h3 className="font-bold text-xl text-[#001a6e]">דרישות</h3>
                    </div>
                    <div className="flex-grow">
                      {renderList(requirementsData) || <p className="text-gray-400">לא צוינו דרישות.</p>}
                    </div>
                  </CardContent>
                </Card>

                {/* 3. Certifications (Left in RTL) */}
                <Card className="bg-white border border-gray-100 shadow-sm rounded-2xl md:rounded-[24px] overflow-hidden hover:shadow-md transition-all h-full">
                  <CardContent className="p-6 md:p-8 flex flex-col h-full">
                    <div className="flex items-center gap-3 mb-4 shrink-0">
                      <h3 className="font-bold text-xl text-[#001a6e]">הסמכות</h3>
                    </div>
                    <div className="flex-grow">
                      {renderList(certificationsData) || <p className="text-gray-400">לא צוינו הסמכות.</p>}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <SeekerJobImages images={job.attachments} />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-12 mb-6 border-t border-gray-100 pt-12">

                {/* STATS SECTION WRAPPER - Increased Shadow, BG Color, No Icons */}
                <div className="bg-white border border-gray-200 shadow-[0_4px_24px_rgba(0,0,0,0.08)] rounded-2xl p-6">
                  <h3 className="font-bold text-xl text-[#001a6e] mb-6 text-center md:text-right">סטטיסטיקות משרה</h3>
                  <div className="flex gap-6 justify-center md:justify-start">
                    <div className="flex-1 bg-[#ecf5f8] border border-blue-100 shadow-sm rounded-2xl p-6 text-center hover:border-blue-300 transition-all flex flex-col items-center justify-center gap-2">
                      <div className="text-gray-600 font-medium text-lg">צפיות</div>
                      <div className="text-4xl font-black text-[#001a6e]">{viewsCount}</div>
                    </div>
                    <Link to={createPageUrl(`JobApplications?job_id=${job.id}`)} className="flex-1 bg-[#ecf5f8] border border-blue-100 shadow-sm rounded-2xl p-6 text-center hover:border-blue-300 hover:shadow-md transition-all cursor-pointer group flex flex-col items-center justify-center gap-2">
                      <div className="text-gray-600 font-medium text-lg">מועמדויות</div>
                      <div className="text-4xl font-black text-[#001a6e]">{applications.length}</div>
                    </Link>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="font-bold text-xl text-[#001a6e]">מועמדים שהגישו למשרה זו</h3>
                    <Link to={createPageUrl(`JobApplications?job_id=${job.id}`)} className="text-sm text-blue-600 font-bold hover:underline">
                      לכל המועמדים ({applications.length})
                    </Link>
                  </div>

                  <div className="bg-gray-50/50 rounded-2xl p-4 border border-gray-100 space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                    {applications.length > 0 ? (
                      applications.slice(0, 5).map((app, idx) => {
                        const profile = applicantProfiles[app.applicant_id];
                        const matchScore = app.match_score || getStableMatchScore(app.applicant_id || app.applicant_email);
                        const displayName = profile?.full_name || app.applicant_email || 'מועמד/ת';
                        const displayTitle = profile?.job_title || profile?.title || 'מועמד/ת';
                        const city = profile?.city || 'מרכז';
                        const type = profile?.job_type || 'משרה מלאה';

                        // Candidate Card Style - Correct RTL Order
                        return (
                          <div key={app.id || idx} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm hover:border-blue-300 transition-colors relative">

                            {/* Top Row: Standard RTL Flex */}
                            <div className="flex items-center justify-between mb-3">

                              {/* Right: Info Group */}
                              <div className="flex items-center gap-3 text-right">
                                <div className="w-12 h-12 rounded-full bg-gray-200 overflow-hidden shrink-0 border border-white shadow-sm">
                                  {profile?.profile_picture ? (
                                    <img src={profile.profile_picture} alt="" className="w-full h-full object-cover" />
                                  ) : (
                                    <Users className="w-6 h-6 text-gray-400 m-3" />
                                  )}
                                </div>
                                <div>
                                  <h4 className="font-bold text-gray-900 text-lg leading-tight">{displayName}</h4>
                                  <p className="text-gray-500 text-sm mt-0.5">{displayTitle}</p>
                                </div>
                              </div>

                              {/* Left: Button */}
                              <Link to={createPageUrl(`CandidateProfile?id=${profile?.id || ''}`)}>
                                <Button variant="ghost" size="sm" className="bg-[#8be29d] text-[#1c5f2b] hover:bg-[#7ad68d] rounded-full h-8 px-5 text-sm font-bold shadow-sm">
                                  לצפייה
                                </Button>
                              </Link>
                            </div>

                            {/* Bottom Row: Standard RTL Flex */}
                            <div className="flex items-center gap-3">
                              {/* Right: Badges */}
                              <div className="flex items-center gap-2 shrink-0">
                                <div className="bg-blue-50 text-blue-700 px-2 py-1 rounded-md text-[11px] font-medium flex items-center gap-1 whitespace-nowrap">
                                  <MapPin className="w-3 h-3" />
                                  {city}
                                </div>
                                <div className="bg-blue-50 text-blue-700 px-2 py-1 rounded-md text-[11px] font-medium flex items-center gap-1 whitespace-nowrap">
                                  <Briefcase className="w-3 h-3" />
                                  {type}
                                </div>
                              </div>

                              {/* Left: Match Bar */}
                              <div className="flex-1 bg-gray-100 rounded-full h-6 relative overflow-hidden">
                                <div
                                  className={`h-full flex items-center justify-center text-[10px] md:text-xs font-bold text-white ${getMatchScoreColor(matchScore)}`}
                                  style={{ width: `${matchScore}%` }}
                                >
                                  {matchScore}% התאמה
                                </div>
                              </div>
                            </div>

                          </div>
                        );
                      })
                    ) : (
                      <div className="text-center py-8 text-gray-400 text-sm">
                        עדיין לא הוגשו מועמדויות
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 flex justify-center w-full px-4 mb-6">
            <div className="bg-white/95 backdrop-blur-md border border-gray-200 shadow-[0_8px_30px_rgba(0,0,0,0.12)] rounded-full p-2 md:p-3 flex flex-row gap-2 md:gap-4 items-center max-w-[90%] md:max-w-none overflow-x-auto no-scrollbar">

              <Link to={createPageUrl(`JobApplications?job_id=${job?.id}`)} className="shrink-0">
                <Button className="rounded-full bg-[#2987CD] hover:bg-[#2070ab] text-white font-bold h-10 md:h-12 px-4 md:px-6 shadow-md whitespace-nowrap text-sm md:text-base">
                  <Users className="w-4 h-4 md:w-5 md:h-5 ml-2" />
                  צפייה במועמדים
                </Button>
              </Link>

              <div className="w-px h-8 bg-gray-200 hidden md:block" />

              <Button
                onClick={handleDuplicateJob}
                variant="ghost"
                className="rounded-full bg-blue-50 text-blue-700 hover:bg-blue-100 font-medium h-10 md:h-12 px-3 md:px-6 whitespace-nowrap text-sm md:text-base">
                <Copy className="w-4 h-4 md:w-4 md:h-4 ml-2" />
                שכפל משרה
              </Button>

              {job?.status === 'active' ? (
                <Button
                  onClick={() => handleStatusChange('paused')}
                  variant="ghost"
                  className="rounded-full bg-yellow-50 text-yellow-700 hover:bg-yellow-100 font-medium h-10 md:h-12 px-3 md:px-6 whitespace-nowrap text-sm md:text-base">
                  <Pause className="w-4 h-4 md:w-4 md:h-4 ml-2" />
                  השהה משרה
                </Button>
              ) : (
                <Button
                  onClick={() => handleStatusChange('active')}
                  variant="ghost"
                  className="rounded-full bg-green-50 text-green-700 hover:bg-green-100 font-medium h-10 md:h-12 px-3 md:px-6 whitespace-nowrap text-sm md:text-base">
                  <Play className="w-4 h-4 md:w-4 md:h-4 ml-2" />
                  פרסם משרה
                </Button>
              )}

              <Link to={createPageUrl(`CreateJob?id=${job?.id}`)} className="shrink-0">
                <Button variant="ghost" className="rounded-full bg-gray-100 text-gray-700 hover:bg-gray-200 font-medium h-10 md:h-12 px-3 md:px-6 whitespace-nowrap text-sm md:text-base">
                  <Edit className="w-4 h-4 md:w-4 md:h-4 ml-2" />
                  עריכת משרה
                </Button>
              </Link>
            </div>
          </div>

        </div>
      </div>
      <NoCreditsDialog
        open={showNoCreditsModal}
        onOpenChange={setShowNoCreditsModal}
      />
    </div>
  );
}
