
import React, { useState, useEffect, useRef } from "react";
import { User, CV } from "@/api/entities";
import { UploadFile } from "@/api/integrations";
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
  Twitter,
  Briefcase
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
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { useUser } from "@/contexts/UserContext";
import { useRequireUserType } from "@/hooks/use-require-user-type";
import { useToast } from "@/components/ui/use-toast";

export default function Settings() {
  useRequireUserType(); // Ensure user has selected a user type
  const { toast } = useToast();
  const [user, setUser] = useState(null);
  const [formData, setFormData] = useState({
    full_name: "",
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
    twitter_url: ""
  });
  const [initialFormData, setInitialFormData] = useState(null);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [openLocation, setOpenLocation] = useState(false);
  const [cvUploading, setCvUploading] = useState(false);
  const fileInputRef = useRef(null);
  const cvFileInputRef = useRef(null);
  const navigate = useNavigate();
  const { signOut } = useUser();

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const userData = await User.me();
      setUser(userData);

      const loadedData = {
        full_name: userData.full_name || "",
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
        twitter_url: userData.twitter_url || ""
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
        ['full_name', 'phone', 'gender', 'date_of_birth', 'place_of_residence'].includes(field)) {
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
          ['full_name', 'phone', 'gender', 'date_of_birth', 'place_of_residence'].includes(field)) {
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
    e.preventDefault();
    if (!validateForm()) {
      return;
    }
    setSaving(true);
    try {
      // Update password if provided
      if (formData.password) {
        const { error } = await supabase.auth.updateUser({ password: formData.password });
        if (error) throw error;
      }

      let profileData = {};

      if (user?.user_type === 'employer') {
        profileData = {
          full_name: formData.full_name,
          phone: formData.phone,
          company_name: formData.company_name,
          main_address: formData.main_address,
          company_type: formData.company_type,
          field_of_activity: formData.field_of_activity,
          cv_reception_email: formData.cv_reception_email,
          bio: formData.bio,
          portfolio_url: formData.website,
          linkedin_url: formData.linkedin_url,
          facebook_url: formData.facebook_url,
          instagram_url: formData.instagram_url,
          twitter_url: formData.twitter_url,
        };
      } else {
        // Job Seeker Payload
        // Explicitly construct fields
        profileData = {
          full_name: formData.full_name,
          // email is usually not updated via public table if auth email is source of truth, but we keep it
          phone: formData.phone,
          gender: formData.gender,
          date_of_birth: formData.date_of_birth || null,
          preferred_location: formData.place_of_residence,
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

      toast({
        title: "פרופיל עודכן בהצלחה",
        description: "הפרטים של עודכנו במערכת",
      });
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

  const handleCVUpload = async (event) => {
    // ... existing CV upload logic (mostly for job seekers) ...
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

    setCvUploading(true);
    try {
      const cleanFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const { publicUrl, file_url } = await UploadFile({
        file, bucket: 'public-files', path: `${Date.now()}-${cleanFileName}`
      });
      const fileUrl = publicUrl || file_url;
      if (!fileUrl) throw new Error("Failed to get file URL");

      await User.updateMyUserData({ resume_url: fileUrl });
      const userEmail = user.email;
      const existingCvs = await CV.filter({ user_email: userEmail });
      const cvMetadata = { user_email: userEmail, file_name: file.name, file_size_kb: String(Math.round(file.size / 1024)), last_modified: new Date().toISOString() };
      if (existingCvs.length > 0) { await CV.update(existingCvs[0].id, cvMetadata); } else { await CV.create(cvMetadata); }
      setUser(prev => ({ ...prev, resume_url: fileUrl }));
      toast({ title: "קובץ הועלה בהצלחה", description: "קורות החיים שלך עודכנו במערכת" });
    } catch (error) {
      console.error("Error uploading CV:", error);
      toast({ title: "שגיאה בהעלאת הקובץ", description: "אירעה שגיאה בעת העלאת הקובץ.", variant: "destructive" });
    } finally { setCvUploading(false); }
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
      // In a real implementation, you would call an API to delete the account
      await new Promise(resolve => setTimeout(resolve, 2000));
      await signOut();
      navigate(createPageUrl('Login'));
    } catch (error) {
      console.error("Error deleting account:", error);
    } finally {
      setDeleteLoading(false);
      setShowDeleteConfirm(false);
    }
  };

  // Determine if form is valid based on user type
  const isEmployer = user?.user_type === 'employer';
  const employerFields = ['company_name', 'company_type', 'full_name', 'phone'];
  const jobSeekerFields = ['full_name', 'phone', 'gender', 'date_of_birth', 'place_of_residence'];

  const formFieldsToCheck = isEmployer ? employerFields : jobSeekerFields;
  const isFormComplete = formFieldsToCheck.every((field) => {
    const value = formData[field];
    return typeof value === 'string' ? value.trim() !== '' : !!value;
  });

  const hasChanges = initialFormData ? (
    Object.keys(formData).some(key => formData[key] !== initialFormData[key])
  ) : false;

  const isSubmitDisabled = saving || !isFormComplete || !hasChanges;

  if (loading) {
    return (
      <div className="p-4 md:p-6" dir="rtl">
        <div className="max-w-4xl mx-auto">
          <div className="h-64 bg-gradient-to-r from-gray-100 to-gray-200 rounded-2xl animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6" dir="rtl">
      <div className="w-[85vw] mx-auto">
        <Card className="bg-white rounded-2xl md:rounded-[2.5rem] shadow-xl border border-gray-100 overflow-hidden">
          <div className="relative">
            {/* Header with curved background */}
            <div className="relative h-24 overflow-hidden -m-px">
              <div
                className="absolute inset-0 w-full h-full [clip-path:ellipse(120%_100%_at_50%_100%)]"
                style={{
                  backgroundImage: 'url(https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/689c85a409a96fa6a10f1aca/d9fc7bd69_Rectangle6463.png)',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  backgroundRepeat: 'no-repeat'
                }}
              />
              <Link to={createPageUrl("Dashboard")} className="absolute top-4 right-6 w-10 h-10 bg-white/30 rounded-full flex items-center justify-center backdrop-blur-sm hover:bg-white/50 transition-colors z-20">
                <ChevronRight className="w-6 h-6 text-gray-800" />
              </Link>
            </div>

            <CardContent className="p-4 sm:p-6 md:p-8 -mt-16 relative z-10">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="space-y-8"
              >
                {/* Header Section */}
                <div className="flex flex-col items-center text-center space-y-4">
                  <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
                    {isEmployer ? "הגדרות" : "הגדרות פרופיל משתמש"}
                  </h1>

                  {/* Profile Picture with Edit Button */}
                  <div className="relative">
                    <div className="w-20 h-20 bg-blue-200 rounded-full flex items-center justify-center border-4 border-white shadow-lg overflow-hidden">
                      {user?.profile_picture ? (
                        <img src={user.profile_picture} alt="Profile" className="w-full h-full object-cover" />
                      ) : (
                        <UserIcon className="w-10 h-10 text-blue-600" />
                      )}
                    </div>
                    <button
                      className="absolute -bottom-1 -right-1 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center shadow-lg hover:bg-blue-700 transition-colors"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Edit2 className="w-4 h-4 text-white" />
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
                    <h2 className="text-xl font-semibold text-gray-800">{user?.full_name || "ישראל ישראלי"}</h2>
                  )}
                </div>

                {/* Form Section */}
                <form onSubmit={handleSave} className="space-y-8">

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
                                className="w-full h-12 bg-white border-gray-200 rounded-lg pr-12 pl-4 text-right shadow-sm focus:border-blue-400"
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
                                className="w-full h-12 bg-white border-gray-200 rounded-lg pr-12 pl-4 text-right shadow-sm focus:border-blue-400"
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
                                className="w-full h-12 bg-white border-gray-200 rounded-lg pr-12 pl-4 text-right shadow-sm focus:border-blue-400 appearance-none"
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
                                className="w-full h-12 bg-white border-gray-200 rounded-lg pr-12 pl-4 text-right shadow-sm focus:border-blue-400"
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
                                className="w-full h-12 bg-white border-gray-200 rounded-lg pr-12 pl-4 text-right shadow-sm focus:border-blue-400"
                                dir="ltr"
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Section 2: Recruiter Details */}
                      <div className="space-y-4 pt-4">
                        <h3 className="text-lg font-bold text-gray-900 border-b pb-2">ניהול פרטי איש גיוס</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-1">
                            <label className="text-sm font-medium text-gray-700">שם איש גיוס</label>
                            <div className="relative">
                              <UserIcon className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                              <Input
                                placeholder="שם איש גיוס"
                                value={formData.full_name}
                                onChange={(e) => handleInputChange('full_name', e.target.value)}
                                className="w-full h-12 bg-white border-gray-200 rounded-lg pr-12 pl-4 text-right shadow-sm focus:border-blue-400"
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
                                className="w-full h-12 bg-gray-50 border-gray-200 rounded-lg pr-12 pl-4 text-right shadow-sm"
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
                                className="w-full h-12 bg-white border-gray-200 rounded-lg pr-12 pl-4 text-right shadow-sm focus:border-blue-400"
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
                            className="w-full min-h-[120px] p-4 rounded-lg border border-gray-200 focus:border-blue-400 focus:ring-0 resize-y text-right"
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
                                className="w-full h-12 bg-white border-gray-200 rounded-lg pr-12 pl-4 text-right shadow-sm focus:border-blue-400"
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
                                className="w-full h-12 bg-white border-gray-200 rounded-lg pr-12 pl-4 text-right shadow-sm focus:border-blue-400"
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
                                className="w-full h-12 bg-white border-gray-200 rounded-lg pr-12 pl-4 text-right shadow-sm focus:border-blue-400"
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
                                className="w-full h-12 bg-white border-gray-200 rounded-lg pr-12 pl-4 text-right shadow-sm focus:border-blue-400"
                                dir="ltr"
                              />
                            </div>
                          </div>
                          <div className="space-y-1">
                            <label className="text-sm font-medium text-gray-700">Twitter (X)</label>
                            <div className="relative">
                              <Twitter className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                              <Input
                                placeholder="Twitter URL"
                                value={formData.twitter_url}
                                onChange={(e) => handleInputChange('twitter_url', e.target.value)}
                                className="w-full h-12 bg-white border-gray-200 rounded-lg pr-12 pl-4 text-right shadow-sm focus:border-blue-400"
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
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Full Name */}
                      <div className="space-y-1">
                        <div className="relative">
                          <UserIcon className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                          <Input
                            placeholder="שם מלא"
                            value={formData.full_name}
                            onChange={(e) => handleInputChange('full_name', e.target.value)}
                            required
                            className="w-full h-12 bg-white border-gray-200 rounded-lg pr-12 pl-4 text-right shadow-sm focus:border-blue-400"
                            dir="rtl"
                          />
                        </div>
                        {errors.full_name && (
                          <p className="text-red-500 text-sm text-right">{errors.full_name}</p>
                        )}
                      </div>

                      {/* Email */}
                      <div className="relative">
                        <Mail className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <Input
                          placeholder="דוא״ל"
                          value={formData.email}
                          onChange={(e) => handleInputChange('email', e.target.value)}
                          disabled
                          className="w-full h-12 bg-gray-50 border-gray-200 rounded-lg pr-12 pl-4 text-right shadow-sm"
                          dir="rtl"
                        />
                      </div>

                      {/* Phone */}
                      <div className="space-y-1">
                        <div className="relative">
                          <Phone className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                          <Input
                            placeholder="מספר טלפון"
                            value={formData.phone}
                            onChange={(e) => handleInputChange('phone', e.target.value)}
                            required
                            className="w-full h-12 bg-white border-gray-200 rounded-lg pr-12 pl-4 text-right shadow-sm focus:border-blue-400"
                            dir="rtl"
                          />
                        </div>
                        {errors.phone && (
                          <p className="text-red-500 text-sm text-right">{errors.phone}</p>
                        )}
                      </div>

                      {/* Gender */}
                      <div className="space-y-1">
                        <div className="relative">
                          <Users className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                          <select
                            value={formData.gender}
                            onChange={(e) => handleInputChange('gender', e.target.value)}
                            required
                            className="w-full h-12 bg-white border-gray-200 rounded-lg pr-12 pl-4 text-right shadow-sm focus:border-blue-400 appearance-none"
                            dir="rtl"
                          >
                            <option value="" disabled>בחר מגדר</option>
                            <option value="male">זכר</option>
                            <option value="female">נקבה</option>
                            <option value="other">אחר</option>
                          </select>
                        </div>
                        {errors.gender && (
                          <p className="text-red-500 text-sm text-right">{errors.gender}</p>
                        )}
                      </div>

                      {/* Date of Birth */}
                      <div className="space-y-1">
                        <div className="relative">
                          <Calendar className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                          <Input
                            type="date"
                            placeholder="תאריך לידה"
                            value={formData.date_of_birth}
                            onChange={(e) => handleInputChange('date_of_birth', e.target.value)}
                            required
                            className="w-full h-12 bg-white border-gray-200 rounded-lg pr-12 pl-4 text-right shadow-sm focus:border-blue-400"
                            dir="rtl"
                          />
                        </div>
                        {errors.date_of_birth && (
                          <p className="text-red-500 text-sm text-right">{errors.date_of_birth}</p>
                        )}
                      </div>

                      {/* Place of Residence */}
                      <div className="space-y-1">
                        <div className="relative">
                          <MapPin className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 z-10" />
                          <Popover open={openLocation} onOpenChange={setOpenLocation}>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                role="combobox"
                                aria-expanded={openLocation}
                                className="w-full h-12 bg-white border-gray-200 rounded-lg pr-12 pl-4 text-right shadow-sm focus:border-blue-400 justify-between font-normal hover:bg-white text-base"
                                dir="rtl"
                              >
                                {formData.place_of_residence || "מקום מגורים"}
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50 absolute left-4" />
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[300px] md:w-[400px] p-0" align="start" dir="rtl">
                              <Command>
                                <CommandInput placeholder="חפש עיר..." className="text-right gap-2" />
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
                        {errors.place_of_residence && (
                          <p className="text-red-500 text-sm text-right">{errors.place_of_residence}</p>
                        )}
                      </div>

                      {/* CV Upload Section - Only for Job Seekers */}
                      {user?.user_type === 'job_seeker' && (
                        <div className="col-span-1 md:col-span-2 space-y-2 pt-2">
                          <label className="text-sm font-medium text-gray-700 block text-right">קובץ קורות חיים</label>
                          <div className="flex items-center gap-4 bg-gray-50 p-4 rounded-lg border border-gray-200">
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => cvFileInputRef.current?.click()}
                              disabled={cvUploading}
                              className="gap-2 shrink-0"
                            >
                              {cvUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <UploadCloud className="w-4 h-4 ml-2" />}
                              {user.resume_url ? 'החלף קובץ' : 'העלה קובץ'}
                            </Button>

                            <div className="flex-1 text-right overflow-hidden">
                              <p className="text-sm font-medium text-gray-900 truncate">
                                {user.resume_url ? 'קובץ קורות חיים מעודכן' : 'לא צורף קובץ'}
                              </p>
                              {user.resume_url && (
                                <a
                                  href={user.resume_url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-xs text-blue-600 hover:text-blue-800 hover:underline flex items-center justify-end gap-1"
                                >
                                  צפה בקובץ הנוכחי
                                  <FileText className="w-3 h-3" />
                                </a>
                              )}
                            </div>

                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center shrink-0">
                              <FileText className="w-5 h-5 text-blue-600" />
                            </div>

                            <input
                              ref={cvFileInputRef}
                              type="file"
                              accept=".pdf,.doc,.docx"
                              className="hidden"
                              onChange={handleCVUpload}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* ========================================================== */}

                  {/* Password Change Section - Common for both */}
                  <div className="space-y-4 pt-4">
                    <h3 className="text-lg font-bold text-gray-900 border-b pb-2">שינוי סיסמא</h3>
                    <div className="space-y-1">
                      <div className="relative">
                        <Lock className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <Input
                          type="password"
                          placeholder="סיסמא חדשה (השאר ריק אם אין שינוי)"
                          value={formData.password}
                          onChange={(e) => handleInputChange('password', e.target.value)}
                          className="w-full h-12 bg-white border-gray-200 rounded-lg pr-12 pl-4 text-right shadow-sm focus:border-blue-400"
                          dir="rtl"
                        />
                      </div>
                    </div>
                  </div>


                  {/* Action Buttons */}
                  <div className="flex flex-col items-center space-y-4 pt-6">
                    <Button
                      type="submit"
                      disabled={isSubmitDisabled}
                      className={`w-full md:w-96 h-12 rounded-full text-lg font-bold shadow-lg transition-all ${isSubmitDisabled
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : 'bg-blue-600 hover:bg-blue-700 text-white'
                        }`}
                    >
                      {saving ? <Loader2 className="w-6 h-6 animate-spin" /> : 'עדכן'}
                    </Button>

                    <Button
                      type="button"
                      variant="link"
                      className="text-gray-500 hover:text-red-600 font-medium"
                      onClick={() => setShowDeleteConfirm(true)}
                    >
                      מחק חשבון
                    </Button>

                    <Button
                      type="button"
                      onClick={handleLogout}
                      variant="outline"
                      className="w-full md:w-96 h-12 rounded-lg border-2 border-red-400 bg-white text-red-600 hover:bg-red-50 hover:border-red-500 font-semibold text-base px-6 shadow-sm"
                    >
                      <LogOut className="w-5 h-5 ml-2" />
                      התנתק
                    </Button>

                  </div>
                </form>
              </motion.div>
            </CardContent>
          </div>
        </Card>

        {/* Delete Account Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" dir="rtl">
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
                    {deleteLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'מחק חשבון'}
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
}
