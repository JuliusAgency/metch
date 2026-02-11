import { useState, useEffect, useRef } from 'react';
import { FileText, UploadCloud, Replace, Edit, Trash2, ChevronLeft, Loader2, Compass, ChevronRight, Eye, X, Plus, RefreshCw } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { CV } from '@/api/entities';
import { UploadFile } from '@/api/integrations';
import { User as UserEntity } from '@/api/entities';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { useUser } from '@/contexts/UserContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useRequireUserType } from '@/hooks/use-require-user-type';
import CareerStageModal from '@/components/dashboard/CareerStageModal';
import Lottie from 'lottie-react';
import confettiAnimation from '../../Confetti banner.json';
import settingsHeaderBg from "@/assets/settings_header_bg.png";
import settingsMobileBg from "@/assets/settings_mobile_bg.jpg"; // Using the same mobile background
import CVPreview from '@/components/cv_generator/CVPreview';
import InfoPopup from '@/components/ui/info-popup';
import { triggerInsightsGeneration, invalidateInsightsCache } from '@/services/insightsService';
import { extractTextFromPdf } from '@/utils/pdfUtils'; // Import the improved utility
import mammoth from 'mammoth';

// pdfjs-dist removed from top-level to prevent crashes
// We will dynamically import it only when needed

export default function Profile() {
  useRequireUserType(); // Ensure user has selected a user type
  const { toast } = useToast();
  const [cvData, setCvData] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isLookingForJob, setIsLookingForJob] = useState(true);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [isCareerStageModalOpen, setIsCareerStageModalOpen] = useState(false);
  const [statusModalStep, setStatusModalStep] = useState(1);
  const [showConfetti, setShowConfetti] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();
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
          if (cvs.length > 0 && cvs[0].file_name) {
            setCvData(cvs[0]);
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

  // Import mammoth dynamically or at top if possible. Since we are in a component, top level is fine.
  // Converting 'processFile' to handle DOCX.

  const extractTextFromDocx = async (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const arrayBuffer = event.target.result;
          // Dynamic import if we want to save bundle size, or just assuming top-level import (which we'll add in next step or use require if needed, but import is better).
          // For now, assuming top level import is added.
          // But wait, I can't add top level import in this Replace block easily without replacing the whole file header.
          // I will add the import in a separate block or include it if I replace the header.
          // Actually, I'll assume I can just use 'mammoth' if I add the import at the top. 
          // Let's modify the plan to add import first? No, I'll do it all here if I can, but I can't reach top of file.
          // I will replace the 'processFile' and 'FileManagementCard' here, and do a separate edit for imports.
          const result = await mammoth.extractRawText({ arrayBuffer: arrayBuffer });
          resolve(result.value);
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = (error) => reject(error);
      reader.readAsArrayBuffer(file);
    });
  };

  const processFile = async (file) => {
    if (!file) return;

    console.log("[Profile] processFile started", { fileName: file?.name, fileSize: file?.size });
    setLoading(true);
    try {
      // Ensure we have user email
      const currentUser = user || await UserEntity.me();
      const userEmail = currentUser?.email;

      if (!userEmail) {
        throw new Error("מזהה משתמש חסר. אנא נסה לרענן את הדף.");
      }

      // 1. Upload file
      // Sanitize filename to avoid "Invalid key" errors with special characters
      const cleanFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const { publicUrl, file_url } = await UploadFile({
        file,
        bucket: 'public-files',
        path: `${Date.now()}-${cleanFileName}`
      });

      const resumeUrl = publicUrl || file_url;
      console.log("[Profile] File uploaded successfully:", resumeUrl);

      // 2. Extract Text (PDF or DOCX)
      let parsedContent = null;
      if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
        try {
          console.log("[Profile] Extracting text from PDF...");
          const blobUrl = URL.createObjectURL(file);
          parsedContent = await extractTextFromPdf(blobUrl);
          URL.revokeObjectURL(blobUrl);
          console.log("[Profile] Extraction complete, length:", parsedContent?.length);
        } catch (err) {
          console.error("[Profile] Failed to extract text from PDF:", err);
        }
      } else if (file.name.endsWith('.docx') || file.name.endsWith('.doc')) {
        try {
          console.log("[Profile] Extracting text from DOCX...");
          parsedContent = await extractTextFromDocx(file);
          console.log("[Profile] Extraction complete, length:", parsedContent?.length);
        } catch (err) {
          console.error("[Profile] Failed to extract text from DOCX:", err);
        }
      }

      // 3. Update User entity
      await UserEntity.updateMyUserData({ resume_url: resumeUrl });

      // 4. Update CV entity
      const existingCvs = await CV.filter({ user_email: userEmail });
      const cvMetadata = {
        user_email: userEmail,
        file_name: file.name,
        file_size_kb: String(Math.round(file.size / 1024)),
        last_modified: new Date().toISOString(),
        parsed_content: parsedContent, // Save extracted text
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
      setUser(prev => ({ ...prev, resume_url: resumeUrl }));

      toast({
        variant: "success",
        title: "הפרופיל הושלם בהצלחה",
        description: "פרטים אישיים נשמרו בהצלחה לקריאה",
      });

      // Trigger AI insights generation in background
      if (currentUser?.id && userEmail) {
        console.log("[Profile] Triggering AI insights generation after CV upload");
        invalidateInsightsCache(currentUser.id); // Clear old cache
        triggerInsightsGeneration(currentUser.id, userEmail)
          .then(success => {
            if (success) {
              console.log("[Profile] AI insights generated successfully");
            }
          })
          .catch(err => console.error("[Profile] Error generating insights:", err));
      }

    } catch (error) {
      console.error("Error uploading file:", error);
      toast({
        variant: "warning",
        title: "שגיאה בהעלאת הקובץ",
        description: "אירעה שגיאה בעת העלאת הקובץ. אנא נסה שנית.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputFileChange = (event) => {
    const file = event.target.files[0];
    if (file) processFile(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isDragging) setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      processFile(file);
    }
  };

  const handleDeleteFile = async () => {
    if (!cvData?.id) return;

    setLoading(true);
    try {
      await CV.delete(cvData.id);
      await UserEntity.updateMyUserData({ resume_url: null });

      // Invalidate insights cache when CV is deleted
      if (user?.id) {
        invalidateInsightsCache(user.id);
      }

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
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-3xl mx-auto">
      {/* Upload Option */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-3xl p-6 md:p-8 text-center cursor-pointer transition-all duration-300 flex flex-col items-center justify-center min-h-[240px] shadow-sm
          ${isDragging ? 'border-blue-500 bg-blue-50/50 scale-[1.02] shadow-md' : 'border-gray-200 bg-white hover:border-blue-300 hover:bg-gray-50'}`}
        onClick={() => fileInputRef.current?.click()}
      >
        <div className="w-14 h-14 bg-blue-50 rounded-full flex items-center justify-center mb-4">
          <UploadCloud className="h-7 w-7 text-blue-500" />
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-1">העלאת קורות חיים</h3>
        <p className="text-sm text-gray-500 max-w-[180px]">גרור קובץ לכאן או לחץ לבחירה</p>
        <p className="mt-3 text-[11px] text-gray-400 font-medium bg-gray-100 px-3 py-0.5 rounded-full">PDF, DOCX עד 5MB</p>
      </div>

      {/* AI Create Option */}
      <div
        className="border-2 border-dashed border-gray-200 bg-white rounded-3xl p-6 md:p-8 text-center flex flex-col items-center justify-center min-h-[240px] hover:border-blue-300 hover:bg-gray-50 transition-all duration-300 shadow-sm cursor-pointer group"
        onClick={() => navigate(createPageUrl('CVGenerator') + '?choice=create')}
      >
        <div className="w-14 h-14 bg-blue-50 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
          <FileText className="h-7 w-7 text-blue-600" />
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-1">אין לך קורות חיים?</h3>
        <p className="text-sm text-gray-500 max-w-[180px] mb-4">צור קורות חיים מקצועיים בקלות ב-AI</p>
        <Button className="bg-blue-600 hover:bg-blue-700 text-white rounded-full px-6 py-2 h-auto text-base font-bold shadow-lg shadow-blue-100">
          צור ב-AI
        </Button>
      </div>
    </div>
  );

  const FileManagementCard = () => {
    const handleViewCV = () => {
      // Check if it's a generated CV (has personal details)
      if (cvData.personal_details && Object.keys(cvData.personal_details).length > 0) {
        setIsPreviewOpen(true);
      } else if (user?.resume_url) {
        // It's an uploaded file
        window.open(user.resume_url, '_blank');
      }
    };

    const isWord = cvData.file_name && (cvData.file_name.endsWith('.doc') || cvData.file_name.endsWith('.docx'));

    return (
      <>
        {/* DESKTOP VIEW */}
        <div className="w-full hidden md:block">
          <div className="bg-[#f8fafd] border-2 border-dashed border-[#E2E8F0] rounded-2xl p-6 mb-4 flex justify-between items-end">
            <div className="flex items-center gap-6">
              <div className="flex-shrink-0">
                {isWord ? (
                  <div className="w-12 h-12 flex items-center justify-center bg-blue-100 rounded-lg">
                    <FileText className="w-8 h-8 text-blue-600" />
                  </div>
                ) : (
                  <img src="/pdf_icon.png" alt="PDF" className="w-12 h-auto" />
                )}
              </div>
              <div className="text-right">
                <p className="font-semibold text-gray-900 text-lg" title={cvData.file_name}>
                  {cvData.file_name}
                </p>
                <p className="text-sm text-gray-400 mt-1">
                  {cvData.last_modified
                    ? format(new Date(cvData.last_modified), 'dd.MM.yyyy HH:mm')
                    : cvData.created_date
                      ? format(new Date(cvData.created_date), 'dd.MM.yyyy HH:mm')
                      : 'תאריך לא ידוע'}
                  <span className="mx-2">|</span>
                  {cvData.file_size_kb || '0'} KB
                </p>
              </div>
            </div>

            <button
              onClick={handleViewCV}
              className="flex items-center gap-2 text-[#4D8EFF] hover:text-blue-700 transition-colors font-medium mb-1"
            >
              <Eye className="w-4 h-4" />
              צפייה
            </button>
          </div>


          <div className="flex items-center justify-end gap-6 text-sm font-medium px-2">
            <button
              onClick={handleDeleteFile}
              className="flex items-center gap-2 text-[#FF4D4D] hover:text-red-700 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              מחיקת קובץ
            </button>

            <div className="w-px h-4 bg-gray-300"></div>

            <Link
              to={createPageUrl('CVGenerator?choice=create&step=1')}
              className="flex items-center gap-2 text-[#4D8EFF] hover:text-blue-700 transition-colors"
            >
              {(cvData.personal_details && Object.keys(cvData.personal_details).length > 0) ? (
                <>
                  <img src="/edit_icon.png" alt="Edit" className="w-4 h-4" />
                  עריכת קובץ
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  ליצירת קו״ח
                </>
              )}
            </Link>

            <div className="w-px h-4 bg-gray-300"></div>

            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 text-[#4D8EFF] hover:text-blue-700 transition-colors"
            >
              <img src="/replace_icon.png" alt="Replace" className="w-4 h-4" />
              החלפת קובץ
            </button>
          </div>
        </div>

        {/* MOBILE VIEW */}
        <div className="w-full md:hidden mb-6 px-2">
          <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-[0_4px_20px_rgba(0,0,0,0.06)]">
            {/* File Info Box */}
            <div className="bg-[#f8fafd] rounded-xl p-4 mb-5">
              <div className="flex items-center justify-between">
                <div className="flex-shrink-0 ml-4">
                  {isWord ? (
                    <div className="w-10 h-10 flex items-center justify-center bg-blue-100 rounded-lg">
                      <FileText className="w-6 h-6 text-blue-600" />
                    </div>
                  ) : (
                    <img src="/pdf_icon.png" alt="PDF" className="w-10 h-auto" />
                  )}
                </div>
                <div className="text-right w-full">
                  <p className="font-bold text-gray-900 text-base mb-1 truncate" title={cvData.file_name}>
                    {cvData.file_name}
                  </p>
                  <p className="text-xs text-gray-400">
                    {cvData.last_modified
                      ? format(new Date(cvData.last_modified), 'dd.MM.yyyy HH:mm')
                      : cvData.created_date
                        ? format(new Date(cvData.created_date), 'dd.MM.yyyy HH:mm')
                        : 'תאריך לא ידוע'}
                    <span className="mx-2">|</span>
                    {cvData.file_size_kb || '0'} KB
                  </p>
                </div>
                <button
                  onClick={handleViewCV}
                  className="bg-[#4D8EFF] text-white text-xs font-bold px-3 py-1.5 rounded-md hover:bg-blue-600 transition-colors flex items-center gap-1 mr-2"
                >
                  <span>לצפיה</span>
                </button>
              </div>
            </div>

          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between px-2 text-sm font-bold mt-4">
            <button
              onClick={handleDeleteFile}
              className="flex items-center gap-1.5 text-[#FF4D4D] hover:text-red-700 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              מחק קובץ
            </button>

            <Link
              to={createPageUrl('CVGenerator?choice=create&step=1')}
              className="flex items-center gap-1.5 text-[#4D8EFF] hover:text-blue-700 transition-colors"
            >
              {(cvData.personal_details && Object.keys(cvData.personal_details).length > 0) ? (
                <>
                  <img src="/edit_icon.png" alt="Edit" className="w-4 h-4" />
                  ערוך קובץ
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  צור חדש
                </>
              )}
            </Link>

            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1.5 text-[#4D8EFF] hover:text-blue-700 transition-colors"
            >
              <img src="/replace_icon.png" alt="Replace" className="w-4 h-4" />
              החלף קובץ
            </button>
          </div>
        </div>
      </>
    );
  };


  if (loading) {
    return <div className="flex justify-center items-center h-screen"><div className="w-12 h-12 border-t-2 border-blue-600 rounded-full animate-spin"></div></div>;
  }

  return (
    <div className="h-full relative overflow-hidden md:overflow-visible" dir="rtl">
      {/* Mobile-Only Background Image - Applied only to Profile Page Background */}
      <div
        className="md:hidden fixed left-0 right-0 z-0 pointer-events-none"
        style={{
          top: '0',
          width: '100%',
          maxWidth: '440px',
          height: '280px',
          margin: '0 auto',
          backgroundImage: `url(${settingsMobileBg})`,
          backgroundSize: '100% 100%',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      />

      <div className="relative">
        <div className="relative h-32 overflow-hidden w-full hidden md:block">
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

        {/* Mobile Header Title */}
        <div className="md:hidden flex items-center justify-center pt-10 pb-4 relative z-10 w-full px-4">
          <h1 className="text-2xl font-bold text-gray-800">ניהול הפרטים שלי</h1>
          <Link to={createPageUrl("Dashboard")} className="absolute right-6 w-8 h-8 bg-white/50 rounded-full flex items-center justify-center shadow-sm backdrop-blur-sm">
            <ChevronRight className="w-5 h-5 text-gray-800" />
          </Link>
        </div>

        <div className="p-0 md:p-8 mt-6 md:-mt-16 relative z-10 w-full max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="max-w-4xl mx-auto space-y-4 md:space-y-12 bg-white md:bg-transparent [border-top-left-radius:50%_40px] [border-top-right-radius:50%_40px] md:rounded-0 min-h-screen md:min-h-0 pt-8 md:pt-0 px-6 md:px-0"
          >
            <h1 className="text-center text-3xl font-bold text-gray-900 hidden md:block">
              {(contextUser?.user_type === 'job_seeker' || !contextUser?.user_type) ? "הקו״ח שלי" : "ניהול הפרטים שלי"}
            </h1>

            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept=".pdf,.doc,.docx"
              onChange={handleInputFileChange}
            />

            {/* CV Section */}
            {(contextUser?.user_type === 'job_seeker' || !contextUser?.user_type) && (
              <>
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`relative rounded-2xl transition-all duration-300 ${isDragging ? 'ring-4 ring-blue-400 ring-offset-4 bg-blue-50/50 scale-[1.02] z-50' : ''}`}
                >
                  {cvData ? <FileManagementCard /> : <NoCvView />}

                  {isDragging && (
                    <div className="absolute inset-0 bg-blue-500/10 rounded-2xl flex items-center justify-center pointer-events-none border-2 border-blue-500 border-dashed">
                      <div className="bg-white px-6 py-3 rounded-full shadow-lg flex items-center gap-3">
                        <UploadCloud className="w-6 h-6 text-blue-500 animate-bounce" />
                        <span className="font-bold text-blue-600">שחרר קובץ לעדכון מהיר</span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:pt-2">
                  {/* Preference Questionnaire Link */}
                  <Link to={createPageUrl(`PreferenceQuestionnaire?returnTo=${encodeURIComponent(location.pathname)}`)}>
                    <div className="bg-white border border-gray-100 shadow-sm md:shadow-sm shadow-[0_4px_10px_rgba(0,0,0,0.03)] rounded-2xl md:rounded-xl p-4 flex items-center justify-between h-[72px] hover:border-blue-200 transition-colors cursor-pointer group">
                      <span className="font-semibold text-gray-700 text-base">ניהול שאלון העדפה</span>
                      <ChevronLeft className="w-5 h-5 text-gray-400 group-hover:text-blue-500" />
                    </div>
                  </Link>

                  {/* Career Questionnaire Link - Opens Modal - HIDDEN ON MOBILE as per image */}
                  <div onClick={() => setIsCareerStageModalOpen(true)} className="hidden md:block">
                    <div className="bg-white border border-gray-100 shadow-sm rounded-xl p-4 flex items-center justify-between h-[72px] hover:border-blue-200 transition-colors cursor-pointer group">
                      <span className="font-semibold text-gray-700 text-base">שאלון קריירה</span>
                      <ChevronLeft className="w-5 h-5 text-gray-400 group-hover:text-blue-500" />
                    </div>
                  </div>

                  {/* Looking for Job Switch - NOW ON LEFT (Second in RTL Grid) */}
                  <div className="bg-white border border-gray-100 shadow rounded-2xl md:shadow-sm shadow-[0_4px_10px_rgba(0,0,0,0.03)] md:rounded-xl p-4 flex items-center justify-between h-[72px]">
                    <div className="flex items-center gap-3 w-full justify-between">
                      <label htmlFor="looking-for-job" className="font-semibold text-gray-700 text-base cursor-pointer select-none">
                        אני מחפש/ת עבודה
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
            <div className="mb-6 flex justify-center">
              <InfoPopup
                triggerText="הסבר"
                title="הסבר"
                content="הסטטוס התעסוקתי שלנו נועד להשתנות מדי פעם - כדי שנוכל לעדכן אתכם במשרות שמתאימות עבורכם רק מתי שאתם צריכים - חשוב שתעדכנו אותנו בסטטוס שלכם."
              />
            </div>
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

      {/* CV Preview Modal */}
      <AnimatePresence>
        {isPreviewOpen && cvData && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center p-4"
            onClick={() => setIsPreviewOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative bg-white rounded-lg shadow-2xl w-full max-w-4xl h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsPreviewOpen(false)}
                className="absolute top-2 right-2 rounded-full z-10 bg-white/50 hover:bg-white/80"
              >
                <X className="w-6 h-6" />
              </Button>
              <CVPreview cvData={cvData} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div >
  );
}
