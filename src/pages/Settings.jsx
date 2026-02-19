
import React, { useState, useEffect, useRef } from "react";
import { User } from "@/api/entities";
import { UploadFile, SendEmail } from "@/api/integrations";
import { supabase } from "@/api/supabaseClient";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea"; // Assuming Textarea component exists or use Input as 'textarea'
import {
  User as UserIcon,
  Edit2,
  Phone,
  Mail,
  MapPin,
  Calendar,
  ChevronRight,
  Loader2,
  AlertTriangle,
  LogOut,
  Lock,
  Users,
  Check,
  ChevronsUpDown,
  FileText,
  UploadCloud,
  Building2,
  Globe,
  Facebook,
  Linkedin,
  Instagram,
  Briefcase,
} from "lucide-react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import locationsList from "../../locations.json";
import { motion } from "framer-motion";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { useUser } from "@/contexts/UserContext";
import { useRequireUserType } from "@/hooks/use-require-user-type";

import { useToast } from "@/components/ui/use-toast";
import { UnsavedChangesDialog } from "@/components/dialogs/UnsavedChangesDialog";
import { ProfileUpdatedDialog } from "@/components/dialogs/ProfileUpdatedDialog";
import settingsHeaderBg from "@/assets/settings_header_bg.png";
import settingsMobileBg from "@/assets/settings_mobile_bg.jpg";

export default function Settings() {
  useRequireUserType(); // Ensure user has selected a user type
  const { toast } = useToast();
  const [user, setUser] = useState(null);
  const [formData, setFormData] = useState({
    full_name: "",
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    gender: "",
    date_of_birth: "",
    place_of_residence: "",
    password: "",
    // Employer fields
    company_name: "",
    main_address: "",
    company_type: "",
    field_of_activity: "",
    cv_reception_email: "",
    bio: "",
    website: "",
    linkedin_url: "",
    facebook_url: "",
    instagram_url: "",
    twitter_url: "",
    // Invoice fields
    invoice_company_name: "",
    invoice_vat_id: "",
    invoice_phone: ""
  });
  const [initialFormData, setInitialFormData] = useState(null);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [openLocation, setOpenLocation] = useState(false);


  const [showIncompleteDialog, setShowIncompleteDialog] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [successDialogContent, setSuccessDialogContent] = useState({ title: "", description: "" });
  const fileInputRef = useRef(null);

  const navigate = useNavigate();
  const { signOut } = useUser();

  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const isOnboarding = searchParams.get('onboarding') === 'company_details';

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const userData = await User.me();
      setUser(userData);

      const fullName = userData.full_name || "";
      const nameParts = fullName.trim().split(/\s+/);
      const firstName = nameParts[0] || "";
      const lastName = nameParts.slice(1).join(" ") || "";

      const loadedData = {
        full_name: fullName,
        first_name: firstName,
        last_name: lastName,
        email: userData.email || "",
        phone: userData.phone || "",
        gender: userData.gender || "",
        date_of_birth: userData.date_of_birth || "",
        place_of_residence: userData.preferred_location || userData.place_of_residence || "",
        password: "",
        // Employer fields
        company_name: userData.company_name || "",
        main_address: userData.main_address || "",
        company_type: userData.company_type || "",
        field_of_activity: userData.field_of_activity || "",
        cv_reception_email: userData.cv_reception_email || "",
        bio: userData.bio || "",
        website: userData.portfolio_url || "", // Mapping portfolio_url to website
        linkedin_url: userData.linkedin_url || "",
        facebook_url: userData.facebook_url || "",
        instagram_url: userData.instagram_url || "",
        twitter_url: userData.twitter_url || "",
        // Invoice fields
        invoice_company_name: userData.invoice_company_name || "",
        invoice_vat_id: userData.invoice_vat_id || "",
        invoice_phone: userData.invoice_phone || ""
      };

      setFormData(loadedData);
      setInitialFormData(loadedData);
      setErrors({});
    } catch (error) {
      console.error("Error loading user:", error);
    } finally {
      setLoading(false);
    }
  };

  const validateField = (field, value) => {
    const trimmedValue = typeof value === 'string' ? value.trim() : value;
    let errorMessage = "";

    const userType = user?.user_type;

    // Skip validation for optional fields
    const optionalFields = ['password', 'linkedin_url', 'facebook_url', 'instagram_url', 'twitter_url', 'website', 'bio'];
    if (optionalFields.includes(field)) return true;

    // Employer specific validation
    if (userType === 'employer') {
      const employerRequiredFields = ['company_name', 'company_type', 'full_name', 'phone']; // Minimal requirements
      if (employerRequiredFields.includes(field) && !trimmedValue) {
        errorMessage = "שדה חובה";
      }
    }
    // Job Seeker specific validation
    else {
      if (!trimmedValue && field !== 'email' && field !== 'password' &&
        ['first_name', 'last_name', 'phone', 'gender', 'date_of_birth', 'place_of_residence'].includes(field)) {
        errorMessage = "שדה חובה";
      }
    }

    if (field === 'phone' && trimmedValue) {
      const phoneRegex = /^05\d{8}$/;
      if (!phoneRegex.test(trimmedValue)) {
        errorMessage = "מספר נייד לא תקין (10 ספרות שמתחילות ב-05)";
      }
    }

    setErrors(prev => ({ ...prev, [field]: errorMessage }));
    return !errorMessage;
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    validateField(field, value);
  };

  const handleSocialLinkChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validateForm = () => {
    const newErrors = {};
    const userType = user?.user_type;

    Object.entries(formData).forEach(([field, value]) => {
      const trimmedValue = typeof value === 'string' ? value.trim() : value;

      if (userType === 'employer') {
        // Employer validation
        const optionalFields = ['password', 'linkedin_url', 'facebook_url', 'instagram_url', 'twitter_url', 'website', 'bio', 'cv_reception_email', 'main_address', 'field_of_activity'];
        // Actually, let's enforce core fields
        const requiredFields = ['company_name', 'company_type', 'full_name', 'phone'];

        if (requiredFields.includes(field) && !trimmedValue) {
          newErrors[field] = "שדה חובה";
        }

      } else {
        // Job Seeker validation
        if (!trimmedValue && field !== 'email' && field !== 'password' &&
          ['first_name', 'last_name', 'phone', 'gender', 'date_of_birth', 'place_of_residence'].includes(field)) {
          newErrors[field] = "שדה חובה";
        }
      }

      // Phone validation for everyone
      if (field === 'phone' && trimmedValue) {
        const phoneRegex = /^05\d{8}$/;
        if (!phoneRegex.test(trimmedValue)) {
          newErrors[field] = "מספר נייד לא תקין (10 ספרות שמתחילות ב-05)";
        }
      }
    });

    setErrors(prev => ({ ...prev, ...newErrors }));
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async (e) => {
    e?.preventDefault();

    // If not triggered by dialog confirmation and form is incomplete
    if (e && !isFormComplete) {
      setShowIncompleteDialog(true);
      return;
    }

    setSaving(true);
    try {
      // Update password if provided
      if (formData.password) {
        const { error } = await supabase.auth.updateUser({ password: formData.password });
        if (error) {
          // If error is "New password should be different from the old password", ignore it
          if (error.message && error.message.includes("New password should be different from the old password")) {
            console.log("Password unchanged, skipping update");
          } else {
            throw error;
          }
        }
      }

      let profileData = {};

      if (user?.user_type === 'employer') {
        profileData = {
          full_name: formData.full_name,
          phone: formData.phone,
          company_name: formData.company_name,
          main_address: formData.main_address,
          company_type: formData.company_type || null,
          field_of_activity: formData.field_of_activity,
          cv_reception_email: formData.cv_reception_email,
          bio: formData.bio,
          portfolio_url: formData.website,
          linkedin_url: formData.linkedin_url,
          facebook_url: formData.facebook_url,
          instagram_url: formData.instagram_url,
          twitter_url: formData.twitter_url,
          // Invoice fields
          invoice_company_name: formData.invoice_company_name,
          invoice_vat_id: formData.invoice_vat_id,
          invoice_phone: formData.invoice_phone,
        };
      } else {
        // Job Seeker Payload
        // Explicitly construct fields
        const combinedFullName = `${formData.first_name.trim()} ${formData.last_name.trim()}`;
        profileData = {
          full_name: combinedFullName,
          // email is usually not updated via public table if auth email is source of truth, but we keep it
          phone: formData.phone,
          gender: formData.gender || null,
          date_of_birth: formData.date_of_birth || null,
          preferred_location: formData.place_of_residence,
          // Map social links to individual columns
          portfolio_url: formData.website,
          linkedin_url: formData.linkedin_url,
          facebook_url: formData.facebook_url,
          instagram_url: formData.instagram_url,
          twitter_url: formData.twitter_url
        };
      }

      await User.updateMyUserData(profileData);

      // Update local state with the saved data
      setUser(prev => ({
        ...prev,
        ...profileData,
        // Map back derived fields for local state consistency
        place_of_residence: formData.place_of_residence
      }));

      setInitialFormData({ ...formData, password: "" });
      setFormData(prev => ({ ...prev, password: "" }));
      setErrors({});

      // If in onboarding mode, redirect to Success step instead of showing dialog
      if (isOnboarding) {
        navigate(`${createPageUrl('CompanyProfileCompletion')}?status=success`);
        return;
      }

      setErrors({});

      // Calculate if the form was ALREADY complete before this save
      const wasFormComplete = initialFormData && formFieldsToCheck.every((field) => {
        const value = initialFormData[field];
        return typeof value === 'string' ? value.trim() !== '' : !!value;
      });

      if (isFormComplete && !wasFormComplete) {
        // Only show "Completed" if it was NOT complete before but IS complete now
        setSuccessDialogContent({
          title: "הפרופיל הושלם בהצלחה",
          description: "פרטים אישיים נשמרו בהצלחה לקריאה"
        });
        setShowSuccessDialog(true);
      } else {
        // Show "Updated" for all other cases (already complete, or still incomplete)
        setSuccessDialogContent({
          title: "הפרופיל עודכן !",
          description: "עדכון קטן - קפיצה גדולה לקריירה"
        });
        setShowSuccessDialog(true);
      }
    } catch (error) {
      console.error("Error saving profile:", error);
      toast({
        title: "שגיאה בשמירת הפרופיל",
        description: "אירעה שגיאה בעת שמירת השינויים. אנא נסה שנית.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Check file size (limit 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "קובץ גדול מדי",
        description: "הקובץ שבחרת גדול מ-5MB. אנא בחר קובץ קטן יותר.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Sanitize filename to avoid "Invalid key" errors with special characters
      const cleanFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');

      const { publicUrl } = await UploadFile({
        file,
        bucket: 'public-files',
        path: `avatars/${user.id}/${Date.now()}-${cleanFileName}`
      });

      await User.updateMyUserData({ profile_picture: publicUrl });
      setUser(prev => ({ ...prev, profile_picture: publicUrl }));

    } catch (error) {
      console.error("Error uploading file:", error);
      toast({
        title: "שגיאה בהעלאת התמונה",
        description: "אירעה שגיאה בעת העלאת התמונה.",
        variant: "destructive"
      });
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

  const handleDeleteAccount = async () => {
    setDeleteLoading(true);
    try {
      if (!user) return;
      const userId = user.id;
      const userEmail = user.email;

      // 0. Send Account Deletion Confirmation Email
      try {
        await SendEmail({
          to: userEmail,
          subject: "אישור מחיקת חשבון ב-Metch",
          html: `
            <div dir="rtl" style="font-family: sans-serif; line-height: 1.6; color: #333;">
              <p>שלום,</p>
              <p>בקשתך למחיקת חשבון Metch התקבלה ובוצעה בהצלחה.</p>
              <p>בתוך 7 ימים חשבונך והנתונים המשוייכים אליו ימחקו לצמיתות ולא תוכל לגשת אליו שוב.</p>
              <p>אם הבקשה לא בוצעה על ידך או אם ברצונך לבטל את המחיקה, אנא פנה לתמיכה בהקדם.</p>
              <p>בברכה,<br>צוות Metch</p>
            </div>
          `,
          text: `שלום,\n\nבקשתך למחיקת חשבון Metch התקבלה ובוצעה בהצלחה.\nבתוך 7 ימים חשבונך והנתונים המשוייכים אליו ימחקו לצמיתות ולא תוכל לגשת אליו שוב.\n\nאם הבקשה לא בוצעה על ידך או אם ברצונך לבטל את המחיקה, אנא פנה לתמיכה בהקדם.\n\nבברכה,\nצוות Metch`
        });
        console.log("Deletion confirmation email sent to:", userEmail);
      } catch (emailError) {
        console.error("Failed to send deletion confirmation email:", emailError);
      }

      // 1. Delete from related tables (Batch deletion using Supabase direct query)
      // We delete by BOTH id and email where applicable to be safe against legacy data

      const deletions = [
        // CVs
        supabase.from('CV').delete().eq('user_id', userId),
        supabase.from('CV').delete().eq('user_email', userEmail),

        // Job Applications
        supabase.from('JobApplication').delete().eq('applicant_id', userId),
        supabase.from('JobApplication').delete().eq('applicant_email', userEmail),

        // Analytics & Stats
        supabase.from('UserAction').delete().eq('user_id', userId),
        supabase.from('UserAction').delete().eq('user_email', userEmail),
        supabase.from('UserStats').delete().eq('user_id', userId),
        supabase.from('UserStats').delete().eq('user_email', userEmail),

        // Fallback: Reset stats if delete failed (RLS might allow update but not delete)
        supabase.from('UserStats').update({
          total_job_matches: 0,
          total_job_views: 0,
          total_applications: 0,
          total_rejections: 0,
          total_saves: 0,
          preferred_job_categories: [],
          resume_views: 0,
          profile_views: 0,
          last_activity_date: null
        }).eq('user_id', userId),
        supabase.from('UserStats').update({
          total_job_matches: 0,
          total_job_views: 0,
          total_applications: 0,
          total_rejections: 0,
          total_saves: 0,
          preferred_job_categories: [],
          resume_views: 0,
          profile_views: 0,
          last_activity_date: null
        }).eq('user_email', userEmail),

        supabase.from('JobView').delete().eq('viewer_id', userId),
        supabase.from('JobView').delete().eq('user_email', userEmail), // Check legacy column name
        supabase.from('CandidateView').delete().eq('viewer_id', userId),
        supabase.from('CandidateView').delete().eq('viewer_email', userEmail),
        // Also try to delete CandidateView where I am the candidate (by ID) - might fail RLS but worth a shot
        supabase.from('CandidateView').delete().eq('candidate_id', userId),

        // Notifications
        supabase.from('Notification').delete().eq('user_id', userId),
        supabase.from('Notification').delete().eq('email', userEmail),

        // Chat/Messages (If tables exist)
        supabase.from('Message').delete().eq('sender_id', userId),
        supabase.from('Message').delete().eq('receiver_id', userId),
        supabase.from('Conversation').delete().eq('participant1_id', userId),
        supabase.from('Conversation').delete().eq('participant2_id', userId)
      ];

      await Promise.allSettled(deletions);

      // 2. Delete UserProfile explicitly (The root user record in our app)
      try {
        await UserProfile.delete(userId);
      } catch (deleteError) {
        console.error("Error deleting UserProfile:", deleteError);
      }

      // 3. Hard Delete Auth User (Via Edge Function)
      // NOTE: This requires the 'delete-user' function to be deployed to Supabase.
      try {
        const { error: funcError } = await supabase.functions.invoke('delete-user');
        if (funcError) {
          console.warn("Auth deletion failed (Function might not be deployed). Standard soft-delete applied.", funcError);
          // Fallback: Mark as deleted in metadata if function fails
          await supabase.auth.updateUser({ data: { is_deleted: true } });
        }
      } catch (err) {
        console.warn("Could not invoke delete-user function:", err);
      }

      // 4. Clear ALL local storage to be safe
      localStorage.clear();
      // Or selectively:
      // localStorage.removeItem(`jobseeker_guide_${userEmail}`);
      // localStorage.removeItem(`employer_guide_${userEmail}`);
      // localStorage.removeItem(`cv_draft_${userEmail}`);

      await signOut();
      navigate(createPageUrl('Login'));

      toast({
        title: "החשבון נמחק בהצלחה",
        description: "כל הנתונים נמחקו. נתראה!",
      });

    } catch (error) {
      console.error("Error deleting account:", error);
      toast({
        title: "שגיאה במחיקת חשבון",
        description: "אירעה שגיאה בעת ניסיון מחיקת החשבון.",
        variant: "destructive"
      });
    } finally {
      setDeleteLoading(false);
      setShowDeleteConfirm(false);
    }
  };

  // Determine if form is valid based on user type
  const isEmployer = user?.user_type === 'employer';
  const employerFields = ['company_name', 'company_type', 'full_name', 'phone'];
  const jobSeekerFields = ['first_name', 'last_name', 'phone', 'gender', 'date_of_birth', 'place_of_residence'];

  const formFieldsToCheck = isEmployer ? employerFields : jobSeekerFields;
  const isFormComplete = formFieldsToCheck.every((field) => {
    const value = formData[field];
    return typeof value === 'string' ? value.trim() !== '' : !!value;
  });

  const hasChanges = initialFormData ? (
    Object.keys(formData).some(key => formData[key] !== initialFormData[key])
  ) : false;

  const isSubmitDisabled = saving || !hasChanges;

  if (loading) {
    return (
      <div className="h-full relative" dir="rtl">
        <div className="relative h-32 w-full bg-gray-100 animate-pulse mb-8" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 space-y-8">
          <div className="h-64 bg-gray-50 rounded-[50px] animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="h-full relative min-h-screen" dir="rtl">
      {/* Mobile-Only Background Image - Applied only to Settings Page Background */}
      <div
        className="md:hidden fixed left-0 right-0 z-0 pointer-events-none"
        style={{
          top: '0',
          width: '100%',
          maxWidth: '390px',
          height: '280px',
          margin: '0 auto',
          backgroundImage: `url(${settingsMobileBg})`,
          backgroundSize: '100% 100%',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      />
      {/* Header with curved background - HIDDEN IN ONBOARDING MODE OR MOBILE */}
      {!isOnboarding && (
        <div className="relative h-32 overflow-hidden w-full hidden md:block">
          <div
            className="absolute inset-0 w-full h-full"
            style={{
              backgroundImage: `url(${settingsHeaderBg})`,
              backgroundSize: '100% 100%',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat'
            }}
          />
          <Link to={createPageUrl("Dashboard")} className="absolute top-4 right-6 w-10 h-10 bg-white/30 rounded-full flex items-center justify-center backdrop-blur-sm hover:bg-white/50 transition-colors z-[60]">
            <ChevronRight className="w-6 h-6 text-gray-800" />
          </Link>
        </div>
      )}

      {/* Mobile-Only Header ABOVE Card */}
      <div className="md:hidden flex items-center px-6 pt-10 pb-4 relative z-10 w-full justify-center">
        <Link to={createPageUrl("Dashboard")} className="absolute right-6 w-10 h-10 bg-white/50 rounded-full flex items-center justify-center shadow-sm backdrop-blur-sm">
          <ChevronRight className="w-6 h-6 text-gray-800" />
        </Link>
        <h1 className="text-2xl font-bold text-gray-800">הגדרות פרופיל משתמש</h1>
      </div>

      <div className={`p-0 md:p-8 ${!isOnboarding ? 'mt-6 md:-mt-20' : 'mt-10'} relative z-10 w-full max-w-7xl mx-auto`}>
        <motion.div
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="md:space-y-8 bg-white md:bg-transparent [border-top-left-radius:50%_40px] [border-top-right-radius:50%_40px] md:rounded-none min-h-screen md:min-h-0 pt-8 md:pt-0 shadow-[0_0_20px_rgba(0,0,0,0.1)] border border-gray-100 md:shadow-none md:border-0"
        >
          {/* Header Section (Centering Profile Summary) */}
          <div className={`flex flex-col items-center text-center ${isEmployer ? 'space-y-4' : 'space-y-2 md:space-y-4 mb-2 md:mb-0'}`}>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 hidden md:block">
              {isOnboarding ? "השלמת פרטי חברה" : (isEmployer ? "הגדרות" : "הפרטים שלי")}
            </h1>

            {/* Profile Picture with Edit Button */}
            <div className="relative">
              <div onClick={() => fileInputRef.current?.click()} className="w-20 h-20 md:w-20 md:h-20 bg-blue-100 rounded-full flex items-center justify-center border-4 border-white shadow-lg overflow-hidden cursor-pointer relative">
                {user?.profile_picture ? (
                  <img src={user.profile_picture} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <>
                    <UserIcon className="w-10 h-10 text-blue-500 hidden md:block" />
                    <img src="/mobile_edit_icon_v2.png" alt="Upload" className="w-full h-full object-cover md:hidden block" />
                  </>
                )}
              </div>
              <button
                className="absolute bottom-0 right-0 w-7 h-7 md:w-8 md:h-8 bg-transparent md:bg-blue-500 rounded-full hidden md:flex items-center justify-center md:shadow-lg md:hover:bg-blue-600 transition-colors md:border-2 md:border-white"
                onClick={() => fileInputRef.current?.click()}
              >
                <Edit2 className="w-4 h-4 text-white hidden md:block" />
                <img src="/mobile_edit_icon_v2.png" alt="Edit" className="w-full h-full md:hidden block object-contain" />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileUpload}
              />
            </div>

            {isEmployer && (
              <h2 className="text-xl font-semibold text-gray-800">{formData.company_name || "שם חברה"}</h2>
            )}
            {!isEmployer && (
              <h2 className="text-2xl font-bold text-gray-800 mt-2">{user?.full_name || `${formData.first_name} ${formData.last_name}` || "ישראל ישראלי"}</h2>
            )}
          </div>

          {/* Form Section */}
          <form onSubmit={handleSave} className="space-y-6 md:space-y-8 px-6 md:px-0 mt-4 md:mt-0">

            {/* ==================== EMPLOYER LAYOUT ==================== */}
            {isEmployer && (
              <>
                {/* Section 1: Company Details */}
                <div className="space-y-4">
                  <h3 className="text-lg font-bold text-gray-900 border-b pb-2">ניהול פרטי חברה</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-1">
                      <label className="text-sm font-medium text-gray-700">שם חברה</label>
                      <div className="relative">
                        <Building2 className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <Input
                          placeholder="שם חברה"
                          value={formData.company_name}
                          onChange={(e) => handleInputChange('company_name', e.target.value)}
                          className="w-full h-12 bg-white border-gray-200 rounded-[50px] pr-12 pl-4 text-right shadow-sm focus:border-blue-400"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-sm font-medium text-gray-700">כתובת חברה</label>
                      <div className="relative">
                        <MapPin className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <Input
                          placeholder="כתובת חברה"
                          value={formData.main_address}
                          onChange={(e) => handleInputChange('main_address', e.target.value)}
                          className="w-full h-12 bg-white border-gray-200 rounded-[50px] pr-12 pl-4 text-right shadow-sm focus:border-blue-400"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-sm font-medium text-gray-700">סוג חברה</label>
                      <div className="relative">
                        <Briefcase className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <select
                          value={formData.company_type}
                          onChange={(e) => handleInputChange('company_type', e.target.value)}
                          className="w-full h-12 bg-white border-gray-200 rounded-[50px] pr-12 pl-4 text-right shadow-sm focus:border-blue-400 appearance-none"
                        >
                          <option value="" disabled>בחר סוג חברה</option>
                          <option value="עמותה">עמותה</option>
                          <option value="חברה עסקית">חברה עסקית</option>
                          <option value="חברת כח אדם">חברת כח אדם</option>
                          <option value="חברת השמה">חברת השמה</option>
                        </select>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-sm font-medium text-gray-700">תחום פעילות</label>
                      <div className="relative">
                        <Briefcase className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <Input
                          placeholder="תחום פעילות"
                          value={formData.field_of_activity}
                          onChange={(e) => handleInputChange('field_of_activity', e.target.value)}
                          className="w-full h-12 bg-white border-gray-200 rounded-[50px] pr-12 pl-4 text-right shadow-sm focus:border-blue-400"
                        />
                      </div>
                    </div>

                    <div className="space-y-1 md:col-span-2">
                      <label className="text-sm font-medium text-gray-700">מייל חברה</label>
                      <div className="relative">
                        <Mail className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <Input
                          placeholder="מייל חברה"
                          value={formData.cv_reception_email}
                          onChange={(e) => handleInputChange('cv_reception_email', e.target.value)}
                          className="w-full h-12 bg-white border-gray-200 rounded-[50px] pr-12 pl-4 text-right shadow-sm focus:border-blue-400"
                          dir="ltr"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Section: Invoice Details */}
                <div className="space-y-4 pt-4">
                  <h3 className="text-lg font-bold text-gray-900 border-b pb-2">פרטים לחשבונית</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-1">
                      <label className="text-sm font-medium text-gray-700">שם חברה</label>
                      <div className="relative">
                        <Building2 className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <Input
                          placeholder="שם חברה"
                          value={formData.invoice_company_name}
                          onChange={(e) => handleInputChange('invoice_company_name', e.target.value)}
                          className="w-full h-12 bg-white border-gray-200 rounded-[50px] pr-12 pl-4 text-right shadow-sm focus:border-blue-400"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-sm font-medium text-gray-700">ח.פ / ת״ז</label>
                      <div className="relative">
                        <FileText className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <Input
                          placeholder="ח.פ / ת״ז"
                          value={formData.invoice_vat_id}
                          onChange={(e) => handleInputChange('invoice_vat_id', e.target.value)}
                          className="w-full h-12 bg-white border-gray-200 rounded-[50px] pr-12 pl-4 text-right shadow-sm focus:border-blue-400"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-sm font-medium text-gray-700">מספר פלאפון</label>
                      <div className="relative">
                        <Phone className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <Input
                          placeholder="מספר פלאפון"
                          value={formData.invoice_phone}
                          onChange={(e) => handleInputChange('invoice_phone', e.target.value)}
                          className="w-full h-12 bg-white border-gray-200 rounded-[50px] pr-12 pl-4 text-right shadow-sm focus:border-blue-400"
                          dir="ltr"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Section 2: Recruiter Details */}
                <div className="space-y-4 pt-4">
                  <h3 className="text-lg font-bold text-gray-900 border-b pb-2">ניהול פרטי מגייס</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-1">
                      <label className="text-sm font-medium text-gray-700">שם איש גיוס</label>
                      <div className="relative">
                        <UserIcon className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <Input
                          placeholder="שם איש גיוס"
                          value={formData.full_name}
                          onChange={(e) => handleInputChange('full_name', e.target.value)}
                          className="w-full h-12 bg-white border-gray-200 rounded-[50px] pr-12 pl-4 text-right shadow-sm focus:border-blue-400"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-sm font-medium text-gray-700">מייל איש גיוס</label>
                      <div className="relative">
                        <Mail className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <Input
                          placeholder="מייל איש גיוס"
                          value={formData.email}
                          disabled
                          className="w-full h-12 bg-gray-50 border-gray-200 rounded-[50px] pr-12 pl-4 text-right shadow-sm"
                          dir="ltr"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-sm font-medium text-gray-700">פלאפון (של האימות)</label>
                      <div className="relative">
                        <Phone className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <Input
                          placeholder="פלאפון"
                          value={formData.phone}
                          onChange={(e) => handleInputChange('phone', e.target.value)}
                          className="w-full h-12 bg-white border-gray-200 rounded-[50px] pr-12 pl-4 text-right shadow-sm focus:border-blue-400"
                          dir="ltr"
                        />
                      </div>
                      {errors.phone && <p className="text-red-500 text-sm">{errors.phone}</p>}
                    </div>
                  </div>
                </div>

                {/* Section 3: Company Description */}
                <div className="space-y-4 pt-4">
                  <h3 className="text-lg font-bold text-gray-900 border-b pb-2">תיאור חברה</h3>
                  <div className="relative">
                    <textarea
                      className="w-full min-h-[120px] p-4 rounded-[50px] border border-gray-200 focus:border-blue-400 focus:ring-0 resize-y text-right"
                      placeholder="ספר קצת על החברה..."
                      value={formData.bio}
                      onChange={(e) => handleInputChange('bio', e.target.value)}
                    />
                  </div>
                </div>

                {/* Section 4: Links Management */}
                <div className="space-y-4 pt-4">
                  <h3 className="text-lg font-bold text-gray-900 border-b pb-2">ניהול לינקים</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-1">
                      <label className="text-sm font-medium text-gray-700">אתר אינטרנט</label>
                      <div className="relative">
                        <Globe className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <Input
                          placeholder="https://company.com"
                          value={formData.website}
                          onChange={(e) => handleInputChange('website', e.target.value)}
                          className="w-full h-12 bg-white border-gray-200 rounded-[50px] pr-12 pl-4 text-right shadow-sm focus:border-blue-400"
                          dir="ltr"
                        />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-sm font-medium text-gray-700">LinkedIn</label>
                      <div className="relative">
                        <Linkedin className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <Input
                          placeholder="LinkedIn URL"
                          value={formData.linkedin_url}
                          onChange={(e) => handleInputChange('linkedin_url', e.target.value)}
                          className="w-full h-12 bg-white border-gray-200 rounded-[50px] pr-12 pl-4 text-right shadow-sm focus:border-blue-400"
                          dir="ltr"
                        />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-sm font-medium text-gray-700">Facebook</label>
                      <div className="relative">
                        <Facebook className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <Input
                          placeholder="Facebook URL"
                          value={formData.facebook_url}
                          onChange={(e) => handleInputChange('facebook_url', e.target.value)}
                          className="w-full h-12 bg-white border-gray-200 rounded-[50px] pr-12 pl-4 text-right shadow-sm focus:border-blue-400"
                          dir="ltr"
                        />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-sm font-medium text-gray-700">Instagram</label>
                      <div className="relative">
                        <Instagram className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <Input
                          placeholder="Instagram URL"
                          value={formData.instagram_url}
                          onChange={(e) => handleInputChange('instagram_url', e.target.value)}
                          className="w-full h-12 bg-white border-gray-200 rounded-[50px] pr-12 pl-4 text-right shadow-sm focus:border-blue-400"
                          dir="ltr"
                        />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-sm font-medium text-gray-700">X (Twitter)</label>
                      <div className="relative">
                        <svg viewBox="0 0 24 24" fill="currentColor" className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400">
                          <path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z" />
                        </svg>
                        <Input
                          placeholder="X URL"
                          value={formData.twitter_url}
                          onChange={(e) => handleInputChange('twitter_url', e.target.value)}
                          className="w-full h-12 bg-white border-gray-200 rounded-[50px] pr-12 pl-4 text-right shadow-sm focus:border-blue-400"
                          dir="ltr"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* ==================== JOB SEEKER LAYOUT (EXISTING) ==================== */}
            {!isEmployer && (
              <div className="md:grid md:grid-cols-1 md:gap-0">
                <Card className="border-0 md:border-0 md:shadow-none md:bg-transparent md:p-0 mb-4 md:mb-0">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                    {/* First Name & Last Name (Split) */}
                    <div className="hidden md:grid md:grid-cols-2 gap-3 md:gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] md:text-sm font-medium text-gray-600 md:text-gray-700 hidden md:block pr-4 md:pr-0">שם פרטי</label>
                        <div className="relative">
                          <UserIcon className="hidden md:block absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                          <Edit2 className="md:hidden absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                          <Input
                            placeholder="שם פרטי"
                            value={formData.first_name}
                            onChange={(e) => handleInputChange('first_name', e.target.value)}
                            required
                            className="w-full h-11 md:h-12 bg-white border-gray-200 rounded-full md:rounded-[50px] pr-4 md:pr-12 pl-10 md:pl-4 text-right shadow-sm focus:border-blue-400 text-sm md:text-base"
                            dir="rtl"
                          />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] md:text-sm font-medium text-gray-600 md:text-gray-700 hidden md:block pr-4 md:pr-0">שם משפחה</label>
                        <div className="relative">
                          <UserIcon className="hidden md:block absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                          <Edit2 className="md:hidden absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                          <Input
                            placeholder="שם משפחה"
                            value={formData.last_name}
                            onChange={(e) => handleInputChange('last_name', e.target.value)}
                            required
                            className="w-full h-11 md:h-12 bg-white border-gray-200 rounded-full md:rounded-[50px] pr-4 md:pr-12 pl-10 md:pl-4 text-right shadow-sm focus:border-blue-400 text-sm md:text-base"
                            dir="rtl"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Email */}
                    <div className="space-y-1">
                      <label className="text-[10px] md:text-sm font-medium text-gray-600 md:text-gray-700 hidden md:block pr-4 md:pr-0">כתובת מייל</label>
                      <div className="relative">
                        <Mail className="hidden md:block absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <Edit2 className="md:hidden absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <Input
                          placeholder="דוא״ל"
                          value={formData.email}
                          onChange={(e) => handleInputChange('email', e.target.value)}
                          disabled
                          className="w-full h-11 md:h-12 bg-white md:bg-gray-50 border-gray-200 rounded-full md:rounded-[50px] pr-4 md:pr-12 pl-10 md:pl-4 text-right shadow-sm text-sm md:text-base"
                          dir="rtl"
                        />
                      </div>
                    </div>

                    {/* Phone */}
                    <div className="space-y-1">
                      <label className="text-[10px] md:text-sm font-medium text-gray-600 md:text-gray-700 hidden md:block pr-4 md:pr-0">מספר טלפון</label>
                      <div className="relative">
                        <Phone className="hidden md:block absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <Edit2 className="md:hidden absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <Input
                          placeholder="מספר טלפון"
                          value={formData.phone}
                          onChange={(e) => handleInputChange('phone', e.target.value)}
                          required
                          className="w-full h-11 md:h-12 bg-white border-gray-200 rounded-full md:rounded-[50px] pr-4 md:pr-12 pl-10 md:pl-4 text-right shadow-sm focus:border-blue-400 text-sm md:text-base"
                          dir="rtl"
                        />
                      </div>
                    </div>

                    {/* Mobile-Only Password Field (Inserted between Phone and Gender) */}
                    <div className="space-y-1 md:hidden">
                      <div className="relative">
                        <Edit2 className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <Input
                          type="password"
                          placeholder="סיסמא"
                          value={formData.password}
                          onChange={(e) => handleInputChange('password', e.target.value)}
                          className="w-full h-11 bg-white border-gray-200 rounded-full pr-4 pl-10 text-right shadow-sm focus:border-blue-400 text-sm"
                          dir="rtl"
                        />
                      </div>
                    </div>

                    {/* Gender */}
                    <div className="space-y-1">
                      <label className="text-[10px] md:text-sm font-medium text-gray-600 md:text-gray-700 hidden md:block pr-4 md:pr-0">מגדר</label>
                      <div className="relative">
                        <Users className="hidden md:block absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <Edit2 className="md:hidden absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <select
                          value={formData.gender}
                          onChange={(e) => handleInputChange('gender', e.target.value)}
                          required
                          className="w-full h-11 md:h-12 bg-white border-gray-200 rounded-full md:rounded-[50px] pr-4 md:pr-12 pl-10 md:pl-4 text-right shadow-sm focus:border-blue-400 appearance-none text-sm md:text-base"
                          dir="rtl"
                        >
                          <option value="" disabled>בחר מגדר</option>
                          <option value="male">זכר</option>
                          <option value="female">נקבה</option>
                          <option value="other">אחר</option>
                        </select>
                      </div>
                    </div>

                    {/* Place of Residence */}
                    <div className="space-y-1">
                      <label className="text-[10px] md:text-sm font-medium text-gray-600 md:text-gray-700 hidden md:block pr-4 md:pr-0">מקום מגורים</label>
                      <div className="relative">
                        <MapPin className="hidden md:block absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 z-10" />
                        <Edit2 className="md:hidden absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 z-10" />
                        <Popover open={openLocation} onOpenChange={setOpenLocation}>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              role="combobox"
                              aria-expanded={openLocation}
                              className="w-full h-11 md:h-12 bg-white border-gray-100 md:border-gray-200 rounded-full md:rounded-[50px] pr-4 md:pr-12 pl-10 md:pl-4 text-right shadow-sm justify-between font-normal hover:bg-white text-sm md:text-base"
                              dir="rtl"
                            >
                              {formData.place_of_residence || "מקום מגורים"}
                              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50 absolute left-8 md:left-4" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-[300px] md:w-[400px] p-0" align="start" dir="rtl">
                            <Command>
                              <CommandInput placeholder="חיפוש עיר..." className="text-right gap-2" />
                              <CommandList>
                                <CommandEmpty>לא נמצאה עיר.</CommandEmpty>
                                <CommandGroup className="max-h-[300px] overflow-y-auto">
                                  {locationsList.map((loc) => (
                                    <CommandItem
                                      key={loc}
                                      value={loc}
                                      onSelect={(currentValue) => {
                                        handleInputChange('place_of_residence', currentValue);
                                        setOpenLocation(false);
                                      }}
                                      className="text-right flex justify-between cursor-pointer"
                                    >
                                      <Check
                                        className={cn(
                                          "h-4 w-4 ml-2",
                                          formData.place_of_residence === loc ? "opacity-100" : "opacity-0"
                                        )}
                                      />
                                      {loc}
                                    </CommandItem>
                                  ))}
                                </CommandGroup>
                              </CommandList>
                            </Command>
                          </PopoverContent>
                        </Popover>
                      </div>
                    </div>

                    {/* Date of Birth */}
                    <div className="space-y-1">
                      <label className="text-[10px] md:text-sm font-medium text-gray-600 md:text-gray-700 hidden md:block pr-4 md:pr-0">תאריך לידה</label>
                      <div className="relative">
                        <Calendar className="absolute left-4 md:left-auto md:right-4 top-1/2 -translate-y-1/2 w-4 h-4 md:w-5 md:h-5 text-gray-400" />
                        <Input
                          type="date"
                          placeholder="תאריך לידה"
                          value={formData.date_of_birth}
                          onChange={(e) => handleInputChange('date_of_birth', e.target.value)}
                          required
                          className="w-full h-11 md:h-12 bg-white border-gray-100 md:border-gray-200 rounded-full md:rounded-[50px] pr-4 md:pr-12 pl-10 md:pl-4 text-right shadow-sm focus:border-blue-400 text-sm md:text-base"
                          dir="rtl"
                        />
                      </div>
                    </div>
                  </div>
                </Card>

                {/* Social Links Section for Job Seekers */}
                <div className="space-y-4 pt-4 md:pt-6 mb-4 md:mb-0">
                  <h3 className="text-sm md:text-lg font-bold text-gray-900 border-b md:border-b pb-2 hidden md:block">ניהול לינקים</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                    <div className="space-y-1">
                      <label className="text-[10px] md:text-sm font-medium text-gray-600 md:text-gray-700 hidden md:block pr-4 md:pr-0">אתר אינטרנט</label>
                      <div className="relative">
                        <Globe className="hidden md:block absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <Edit2 className="md:hidden absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <Input
                          placeholder="אתר אינטרנט" // Placeholder for mobile if label hidden
                          value={formData.website || ''}
                          onChange={(e) => handleSocialLinkChange('website', e.target.value)}
                          className="w-full h-11 md:h-12 bg-white border-gray-100 md:border-gray-200 rounded-full md:rounded-[50px] pr-4 md:pr-12 pl-10 md:pl-4 text-right shadow-sm focus:border-blue-400 text-sm md:text-base"
                          dir="ltr"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] md:text-sm font-medium text-gray-600 md:text-gray-700 hidden md:block pr-4 md:pr-0">LinkedIn</label>
                      <div className="relative">
                        <Linkedin className="hidden md:block absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <Edit2 className="md:hidden absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <Input
                          placeholder="LinkedIn URL"
                          value={formData.linkedin_url || ''}
                          onChange={(e) => handleSocialLinkChange('linkedin_url', e.target.value)}
                          className="w-full h-11 md:h-12 bg-white border-gray-100 md:border-gray-200 rounded-full md:rounded-[50px] pr-4 md:pr-12 pl-10 md:pl-4 text-right shadow-sm focus:border-blue-400 text-sm md:text-base"
                          dir="ltr"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] md:text-sm font-medium text-gray-600 md:text-gray-700 hidden md:block pr-4 md:pr-0">Facebook</label>
                      <div className="relative">
                        <Facebook className="hidden md:block absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <Edit2 className="md:hidden absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <Input
                          placeholder="Facebook URL"
                          value={formData.facebook_url || ''}
                          onChange={(e) => handleSocialLinkChange('facebook_url', e.target.value)}
                          className="w-full h-11 md:h-12 bg-white border-gray-100 md:border-gray-200 rounded-full md:rounded-[50px] pr-4 md:pr-12 pl-10 md:pl-4 text-right shadow-sm focus:border-blue-400 text-sm md:text-base"
                          dir="ltr"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] md:text-sm font-medium text-gray-600 md:text-gray-700 hidden md:block pr-4 md:pr-0">Instagram</label>
                      <div className="relative">
                        <Instagram className="hidden md:block absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <Edit2 className="md:hidden absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <Input
                          placeholder="Instagram URL"
                          value={formData.instagram_url || ''}
                          onChange={(e) => handleSocialLinkChange('instagram_url', e.target.value)}
                          className="w-full h-11 md:h-12 bg-white border-gray-100 md:border-gray-200 rounded-full md:rounded-[50px] pr-4 md:pr-12 pl-10 md:pl-4 text-right shadow-sm focus:border-blue-400 text-sm md:text-base"
                          dir="ltr"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] md:text-sm font-medium text-gray-600 md:text-gray-700 hidden md:block pr-4 md:pr-0">X (Twitter)</label>
                      <div className="relative">
                        <svg viewBox="0 0 24 24" fill="currentColor" className="hidden md:block absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400">
                          <path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z" />
                        </svg>
                        <Edit2 className="md:hidden absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <Input
                          placeholder="X URL"
                          value={formData.twitter_url || ''}
                          onChange={(e) => handleSocialLinkChange('twitter_url', e.target.value)}
                          className="w-full h-11 md:h-12 bg-white border-gray-100 md:border-gray-200 rounded-full md:rounded-[50px] pr-4 md:pr-12 pl-10 md:pl-4 text-right shadow-sm focus:border-blue-400 text-sm md:text-base"
                          dir="ltr"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ========================================================== */}

            {/* Password Change Section - Common for both, but Hidden on Mobile for Job Seeker (moved up) */}
            <div className={`space-y-3 md:space-y-4 pt-2 md:pt-4 ${!isEmployer ? 'hidden md:block' : ''}`}>
              <h3 className="text-sm md:text-lg font-bold text-gray-900 border-b md:border-b pb-2 hidden md:block">שינוי סיסמא</h3>
              <div className="space-y-1">
                <div className="relative">
                  <Lock className="hidden md:block absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Edit2 className="md:hidden absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    type="password"
                    placeholder="סיסמא למשתמש"
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    className="w-full h-11 md:h-12 bg-white border-gray-100 md:border-gray-200 rounded-full md:rounded-[50px] pr-4 md:pr-12 pl-10 md:pl-4 text-right shadow-sm focus:border-blue-400 text-sm md:text-base"
                    dir="rtl"
                  />
                </div>
              </div>
            </div>


            {/* Action Buttons */}
            <div className="flex flex-col items-center space-y-3 pt-1 md:pt-6 pb-6 md:pb-0">
              <Button
                type="submit"
                disabled={isSubmitDisabled}
                className={` rounded-full text-lg font-bold shadow-lg transition-all w-full md:w-64 h-12 md:h-12 ${isSubmitDisabled
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  : 'bg-[#3182ce] hover:bg-blue-700 text-white'
                  }`}
              >
                {saving ? (
                  <>
                    <div className="w-5 h-5 border-t-2 border-white rounded-full animate-spin ml-2"></div>
                    שומר...
                  </>
                ) : (
                  isOnboarding ? 'עדכון' : (isEmployer ? 'שמירת שינויים' : 'עדכן')
                )}
              </Button>

              {!isOnboarding && !isEmployer && (
                <>
                  <Button
                    type="button"
                    variant="link"
                    className="text-[#3182ce] hover:text-blue-800 font-medium text-sm underline border-0 p-0 h-auto mt-4"
                    onClick={() => setShowDeleteConfirm(true)}
                  >
                    מחק חשבון
                  </Button>
                  <Button
                    type="button"
                    onClick={handleLogout}
                    className="w-full md:w-64 h-12 rounded-[50px] bg-red-600 hover:bg-red-700 text-white font-semibold text-base px-6 shadow-md mt-4 transition-colors"
                  >
                    <LogOut className="w-5 h-5 ml-2" />
                    התנתקות
                  </Button>
                </>
              )}

              {!isOnboarding && isEmployer && (
                <>
                  <Button
                    type="button"
                    variant="link"
                    className="text-gray-500 hover:text-red-600 font-medium"
                    onClick={() => setShowDeleteConfirm(true)}
                  >
                    מחיקת חשבון
                  </Button>

                  <Button
                    type="button"
                    onClick={handleLogout}
                    variant="outline"
                    className="w-full md:w-96 h-12 rounded-[50px] border-2 border-red-400 bg-white text-red-600 hover:bg-red-50 hover:border-red-500 font-semibold text-base px-6 shadow-sm"
                  >
                    <LogOut className="w-5 h-5 ml-2" />
                    התנתקות
                  </Button>
                </>
              )}

            </div>
          </form>
        </motion.div>

        {/* Delete Account Confirmation Modal */}
        {
          showDeleteConfirm && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4" dir="rtl">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl"
              >
                <div className="text-center space-y-4">
                  <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
                    <AlertTriangle className="w-8 h-8 text-red-600" />
                  </div>

                  <h3 className="text-xl font-bold text-gray-900">מחיקת חשבון</h3>
                  <p className="text-gray-600">
                    האם אתה בטוח שברצונך למחוק את החשבון? פעולה זו אינה הפיכה וכל הנתונים שלך יימחקו לצמיתות.
                  </p>

                  <div className="flex gap-3 pt-4">
                    <Button
                      onClick={() => setShowDeleteConfirm(false)}
                      variant="outline"
                      className="flex-1 h-12 rounded-full border-gray-300"
                      disabled={deleteLoading}
                    >
                      ביטול
                    </Button>
                    <Button
                      onClick={handleDeleteAccount}
                      className="flex-1 h-12 bg-red-600 hover:bg-red-700 rounded-full"
                      disabled={deleteLoading}
                    >
                      {deleteLoading ? <div className="w-5 h-5 border-t-2 border-current rounded-full animate-spin"></div> : 'מחיקת חשבון'}
                    </Button>
                  </div>
                </div>
              </motion.div>
            </div>
          )
        }


        <UnsavedChangesDialog
          open={showIncompleteDialog}
          onOpenChange={setShowIncompleteDialog}
          onConfirm={() => setShowIncompleteDialog(false)} // Confirm = "Complete Profile" (Stay)
          onCancel={() => {
            setShowIncompleteDialog(false);
            navigate(-1); // Cancel = "Finish/End" (Exit without saving)
          }}
        />

        <ProfileUpdatedDialog
          open={showSuccessDialog}
          onOpenChange={setShowSuccessDialog}
          title={successDialogContent.title}
          description={successDialogContent.description}
        />
      </div >
    </div >
  );
}
