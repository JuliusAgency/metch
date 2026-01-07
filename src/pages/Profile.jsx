
import { useState, useEffect, useRef } from 'react';
import { FileText, UploadCloud, Replace, Edit, Trash2, ChevronLeft, Loader2, Compass, ChevronRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { CV } from '@/api/entities';
import { UploadFile } from '@/api/integrations';
import { User as UserEntity } from '@/api/entities';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { useUser } from '@/contexts/UserContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useRequireUserType } from '@/hooks/use-require-user-type';
import CareerStageModal from '@/components/dashboard/CareerStageModal';
import Lottie from 'lottie-react';
import confettiAnimation from '../../Confetti banner.json';
import settingsHeaderBg from "@/assets/settings_header_bg.png";

export default function Profile() {
  useRequireUserType(); // Ensure user has selected a user type
  const { toast } = useToast();
  const [cvData, setCvData] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isLookingForJob, setIsLookingForJob] = useState(true);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [isCareerStageModalOpen, setIsCareerStageModalOpen] = useState(false);
  const [statusModalStep, setStatusModalStep] = useState(1);
  const [showConfetti, setShowConfetti] = useState(false);
  const fileInputRef = useRef(null);
  const navigate = useNavigate();
  const { signOut, user: contextUser } = useUser();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const userData = await UserEntity.me();
        setUser(userData);
        setIsLookingForJob(userData.available_for_work !== false);

        // Only fetch CVs for job seekers
        if (contextUser?.user_type === 'job_seeker' || !contextUser?.user_type) {
          const cvs = await CV.filter({ user_email: userData.email });
          if (cvs.length > 0) {
            setCvData({
              ...cvs[0],
              file_name: cvs[0].file_name || 'אלון כהן...מעבדה ux ui סביון קורץ 2025.pdf',
              last_modified: cvs[0].last_modified || '2025-05-30T11:30:00Z',
              file_size_kb: cvs[0].file_size_kb || 867,
            });
          }
        }
      } catch (error) {
        console.error("Error fetching profile data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [contextUser]);

  const performStatusUpdate = async (checked, reason = null) => {
    setIsLookingForJob(checked);
    try {
      await UserEntity.updateMyUserData({ available_for_work: checked });
    } catch (error) {
      console.error("Error updating user status:", error);
      setIsLookingForJob(!checked);
      toast({
        variant: "warning",
        title: "שגיאה בעדכון סטטוס",
        description: "אירעה שגיאה בעת עדכון הסטטוס. אנא נסה שנית.",
      });
    }
  };

  const handleFoundViaMatch = async () => {
    setShowConfetti(true);
    // Update status immediately in background
    performStatusUpdate(false, 'found_via_match');

    // Wait 1.5s before closing
    setTimeout(() => {
      setShowConfetti(false);
      setIsStatusModalOpen(false);
    }, 1500);
  };

  const handleToggleLookingForJob = async (checked) => {
    if (!user) return;

    if (!checked) {
      // User is turning OFF the switch - show modal
      setStatusModalStep(1);
      setIsStatusModalOpen(true);
      return;
    }

    // User is turning ON the switch - proceed directly
    performStatusUpdate(checked);
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setLoading(true);
    try {
      // 1. Upload file
      // Sanitize filename to avoid "Invalid key" errors with special characters
      const cleanFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const { publicUrl, file_url } = await UploadFile({
        file,
        bucket: 'public-files',
        path: `${Date.now()}-${cleanFileName}`
      });

      const resumeUrl = publicUrl || file_url;

      // 2. Update User entity
      await UserEntity.updateMyUserData({ resume_url: resumeUrl });

      // 3. Update CV entity
      const existingCvs = await CV.filter({ user_email: user.email });
      const cvMetadata = {
        user_email: user.email,
        file_name: file.name,
        file_size_kb: String(Math.round(file.size / 1024)),
        last_modified: new Date().toISOString(),
      };

      let updatedCv;
      if (existingCvs.length > 0) {
        updatedCv = await CV.update(existingCvs[0].id, cvMetadata);
      } else {
        updatedCv = await CV.create(cvMetadata);
      }

      // 4. Update local state
      setCvData({
        ...updatedCv,
        file_name: file.name,
        file_size_kb: Math.round(file.size / 1024),
        last_modified: new Date().toISOString(),
      });

      toast({
        variant: "success",
        title: "הפרופיל הושלם בהצלחה",
        description: "פרטים אישיים נשמרו בהצלחה לקריאה",
      });

    } catch (error) {
      console.error("Error uploading file:", error);
      toast({
        variant: "warning",
        title: "שגיאה בהעלאת הקובץ",
        description: error.message.includes("Bucket not found")
          ? "שגיאת מערכת: באקט האחסון לא קיים. אנא פנה לתמיכה."
          : error.message.includes("row-level security policy")
            ? "שגיאת הרשאה: אין לך הרשאה להעלות קבצים. אנא וודא שהוגדרה מדיניות (Policy) מתאימה ב-Supabase Storage."
            : "אירעה שגיאה בעת העלאת הקובץ. אנא נסה שנית.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteFile = async () => {
    if (!cvData?.id) return;

    setLoading(true);
    try {
      await CV.delete(cvData.id);
      await UserEntity.updateMyUserData({ resume_url: null });

      // Clear the local storage draft so next generation starts fresh
      if (user?.email) {
        localStorage.removeItem(`cv_draft_${user.email}`);
      }

      setCvData(null);

      toast({
        variant: "success",
        title: "הפרופיל עודכן",
        description: "פרטים אישיים נשמרו בהצלחה לקריאה",
      });
    } catch (error) {
      console.error("Error deleting file:", error);
      toast({
        variant: "warning",
        title: "שגיאה במחיקת הקובץ",
        description: "אירעה שגיאה בעת מחיקת הקובץ. אנא נסה שנית.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut();
      navigate(createPageUrl('Login'));
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const NoCvView = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div
        className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center cursor-pointer hover:border-blue-500 hover:bg-gray-50 transition-colors flex flex-col items-center justify-center min-h-[200px]"
        onClick={() => fileInputRef.current?.click()}
      >
        <UploadCloud className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900">העלה קורות חיים</h3>
        <p className="mt-1 text-sm text-gray-500">גרור קובץ או לחץ כדי לבחור (PDF, DOCX)</p>
      </div>

      <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center flex flex-col items-center justify-center min-h-[200px] hover:border-blue-500 hover:bg-gray-50 transition-colors">
        <FileText className="mx-auto h-12 w-12 text-blue-500 mb-4" />
        <h3 className="text-lg font-medium text-gray-900">אין לך קורות חיים?</h3>
        <p className="mt-1 text-sm text-gray-500 mb-4">צור קורות חיים מקצועיים בקלות</p>
        <Button asChild className="bg-blue-600 hover:bg-blue-700 text-white rounded-full">
          <Link to={createPageUrl('CVGenerator')}>
            צור קורות חיים
          </Link>
        </Button>
      </div>
    </div>
  );

  const FileManagementCard = () => (
    <div className="w-full">
      {/* Dashed File Info Card */}
      <div className="bg-[#f8fafd] border-2 border-dashed border-[#E2E8F0] rounded-2xl p-6 mb-4">
        <div className="flex items-center gap-6">
          <div className="flex-shrink-0">
            <img src="/pdf_icon.png" alt="PDF" className="w-12 h-auto" />
          </div>
          <div className="text-right flex-1">
            <p className="font-semibold text-gray-900 text-lg" title={cvData.file_name}>
              {cvData.file_name}
            </p>
            <p className="text-sm text-gray-400 mt-1">
              {format(new Date(cvData.last_modified), 'dd.MM.yyyy HH:mm')}
              <span className="mx-2">|</span>
              {cvData.file_size_kb} KB
            </p>
          </div>
        </div>
      </div>

      {/* Action Buttons Row - Aligned Left (justify-end in RTL) */}
      <div className="flex items-center justify-end gap-6 text-sm font-medium px-2">
        <button
          onClick={handleDeleteFile}
          className="flex items-center gap-2 text-[#FF4D4D] hover:text-red-700 transition-colors"
        >
          <Trash2 className="w-4 h-4" />
          מחק קובץ
        </button>

        {cvData.personal_details && (
          <>
            <div className="w-px h-4 bg-gray-300"></div>

            <Link
              to={createPageUrl('CVGenerator')}
              className="flex items-center gap-2 text-[#4D8EFF] hover:text-blue-700 transition-colors"
            >
              <img src="/edit_icon.png" alt="Edit" className="w-4 h-4" />
              ערוך קובץ
            </Link>
          </>
        )}

        <div className="w-px h-4 bg-gray-300"></div>

        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-2 text-[#4D8EFF] hover:text-blue-700 transition-colors"
        >
          <img src="/replace_icon.png" alt="Replace" className="w-4 h-4" />
          החלף קובץ
        </button>
      </div>
    </div>
  );

  if (loading) {
    return <div className="flex justify-center items-center h-screen"><div className="w-12 h-12 border-t-2 border-blue-600 rounded-full animate-spin"></div></div>;
  }

  return (
    <div className="h-full relative" dir="rtl">
      <div className="relative">
        <div className="relative h-32 overflow-hidden w-full">
          <div
            className="absolute inset-0 w-full h-full"
            style={{
              backgroundImage: `url(${settingsHeaderBg})`,
              backgroundSize: "100% 100%",
              backgroundPosition: "center",
              backgroundRepeat: "no-repeat",
            }}
          />
        </div>
        <div className="p-4 sm:p-6 md:p-8 -mt-16 relative z-10 w-full max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="max-w-4xl mx-auto space-y-12"
          >
            <h1 className="text-center text-3xl font-bold text-gray-900">
              {(contextUser?.user_type === 'job_seeker' || !contextUser?.user_type) ? "הקו״ח שלי" : "ניהול הפרטים שלי"}
            </h1>

            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept=".pdf,.doc,.docx"
              onChange={handleFileUpload}
            />

            {/* CV Section */}
            {(contextUser?.user_type === 'job_seeker' || !contextUser?.user_type) && (
              <>
                <div className="mb-8">
                  {cvData ? <FileManagementCard /> : <NoCvView />}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                  {/* Preference Questionnaire Link */}
                  <Link to={createPageUrl('PreferenceQuestionnaire')}>
                    <div className="bg-white border border-gray-100 shadow-sm rounded-xl p-4 flex items-center justify-between h-[72px] hover:border-blue-200 transition-colors cursor-pointer group">
                      <span className="font-semibold text-gray-700 text-base">ניהול שאלון העדפה</span>
                      <ChevronLeft className="w-5 h-5 text-gray-400 group-hover:text-blue-500" />
                    </div>
                  </Link>

                  {/* Career Questionnaire Link - Opens Modal */}
                  <div onClick={() => setIsCareerStageModalOpen(true)}>
                    <div className="bg-white border border-gray-100 shadow-sm rounded-xl p-4 flex items-center justify-between h-[72px] hover:border-blue-200 transition-colors cursor-pointer group">
                      <span className="font-semibold text-gray-700 text-base">שאלון קריירה</span>
                      <ChevronLeft className="w-5 h-5 text-gray-400 group-hover:text-blue-500" />
                    </div>
                  </div>

                  {/* Looking for Job Switch - NOW ON LEFT (Second in RTL Grid) */}
                  <div className="bg-white border border-gray-100 shadow-sm rounded-xl p-4 flex items-center justify-between h-[72px]">
                    <div className="flex items-center gap-3 w-full justify-between">
                      <label htmlFor="looking-for-job" className="font-semibold text-gray-700 text-base cursor-pointer select-none">
                        אני מחפש עבודה
                      </label>
                      <Switch
                        checked={isLookingForJob}
                        onCheckedChange={handleToggleLookingForJob}
                        id="looking-for-job"
                        className="data-[state=checked]:bg-green-400"
                      />
                    </div>
                  </div>
                </div>
              </>
            )}
          </motion.div>
        </div>
      </div>

      <Dialog open={isStatusModalOpen} onOpenChange={setIsStatusModalOpen}>
        <DialogContent className="sm:max-w-md text-center bg-white" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-3xl font-bold text-center mb-6 text-slate-900">עדכון סטטוס</DialogTitle>
          </DialogHeader>

          <div className="flex flex-col gap-4 py-2 px-4">
            {statusModalStep === 1 ? (
              <>
                <Button
                  variant="outline"
                  className="w-full text-lg h-14 border border-blue-800 text-blue-900 hover:bg-blue-50 rounded-full transition-all"
                  onClick={() => setStatusModalStep(2)}
                >
                  <span className="font-medium">מצאתי עבודה</span>
                </Button>
                <Button
                  variant="outline"
                  className="w-full text-lg h-14 border border-blue-800 text-blue-900 hover:bg-blue-50 rounded-full transition-all"
                  onClick={() => {
                    performStatusUpdate(false, 'stopped_looking');
                    setIsStatusModalOpen(false);
                  }}
                >
                  <span className="font-medium">הפסקתי לחפש</span>
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="outline"
                  className="w-full text-lg h-14 border border-blue-800 text-blue-900 hover:bg-blue-50 rounded-full transition-all relative overflow-hidden"
                  onClick={handleFoundViaMatch}
                >
                  <span className="font-medium relative z-10">מצאתי דרך מאצ׳</span>
                  {showConfetti && (
                    <div className="absolute inset-0 z-0 flex items-center justify-center pointer-events-none">
                      <Lottie
                        animationData={confettiAnimation}
                        loop={false}
                        style={{ width: '300px', height: '150px' }} // Adjusted size to fit/overflow slightly
                      />
                    </div>
                  )}
                </Button>
                <Button
                  variant="outline"
                  className="w-full text-lg h-14 border border-blue-800 text-blue-900 hover:bg-blue-50 rounded-full transition-all"
                  onClick={() => {
                    performStatusUpdate(false, 'found_via_other');
                    setIsStatusModalOpen(false);
                  }}
                >
                  <span className="font-medium">מצאתי דרך מקום אחר</span>
                </Button>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
      <CareerStageModal
        isOpen={isCareerStageModalOpen}
        onComplete={() => setIsCareerStageModalOpen(false)}
      />
    </div>
  );
}
