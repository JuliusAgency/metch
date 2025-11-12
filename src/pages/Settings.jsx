
import React, { useState, useEffect, useRef } from "react";
import { User } from "@/api/entities";
import { UploadFile } from "@/api/integrations";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  User as UserIcon,
  Edit2,
  Phone,
  Mail,
  MapPin,
  Briefcase,
  Calendar,
  ChevronRight,
  Loader2,
  AlertTriangle,
  LogOut
} from "lucide-react";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { useUser } from "@/contexts/UserContext";
import { useRequireUserType } from "@/hooks/use-require-user-type";

export default function Settings() {
  useRequireUserType(); // Ensure user has selected a user type
  const [user, setUser] = useState(null);
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    phone: "",
    whatsapp_phone: "",
    preferred_location: "",
    experience_level: ""
  });
  const [initialFormData, setInitialFormData] = useState(null);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const fileInputRef = useRef(null);
  const navigate = useNavigate();
  const { signOut } = useUser();

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const userData = await User.me();
      setUser(userData);
      setFormData({
        full_name: userData.full_name || "",
        email: userData.email || "",
        phone: userData.phone || "",
        whatsapp_phone: userData.whatsapp_phone || "",
        preferred_location: userData.preferred_location || "",
        experience_level: userData.experience_level || ""
      });
      setInitialFormData({
        full_name: userData.full_name || "",
        email: userData.email || "",
        phone: userData.phone || "",
        whatsapp_phone: userData.whatsapp_phone || "",
        preferred_location: userData.preferred_location || "",
        experience_level: userData.experience_level || ""
      });
      setErrors({});
    } catch (error) {
      console.error("Error loading user:", error);
    } finally {
      setLoading(false);
    }
  };

  const validateField = (field, value) => {
    const trimmedValue = typeof value === 'string' ? value.trim() : value;
    const errorMessage = trimmedValue ? "" : "שדה חובה";
    setErrors(prev => ({ ...prev, [field]: errorMessage }));
    return !errorMessage;
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    validateField(field, value);
  };

  const validateForm = () => {
    const newErrors = {};
    Object.entries(formData).forEach(([field, value]) => {
      const trimmedValue = typeof value === 'string' ? value.trim() : value;
      if (!trimmedValue && field !== 'email') {
        newErrors[field] = "שדה חובה";
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
      await User.updateMyUserData(formData);
      setUser(prev => ({...prev, ...formData}));
      setInitialFormData({ ...formData });
      setErrors({});
      // Show success feedback (you could add a toast here)
      console.log("Profile updated successfully");
    } catch (error) {
      console.error("Error saving profile:", error);
    } finally {
      setSaving(false);
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
      // In a real implementation, you would call an API to delete the account
      // For now, we'll just simulate the process
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Log out the user after account deletion
      await signOut();
      navigate(createPageUrl('Login'));
      console.log("Account deleted successfully");
    } catch (error) {
      console.error("Error deleting account:", error);
    } finally {
      setDeleteLoading(false);
      setShowDeleteConfirm(false);
    }
  };

  const formFields = ['full_name', 'phone', 'whatsapp_phone', 'preferred_location', 'experience_level'];
  const isFormComplete = formFields.every((field) => {
    const value = formData[field];
    return typeof value === 'string' ? value.trim() !== '' : !!value;
  });
  const hasChanges = initialFormData
    ? formFields.some((field) => formData[field] !== initialFormData[field])
    : false;
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
              <Link to={createPageUrl("Dashboard")} className="absolute top-4 right-6 w-10 h-10 bg-white/30 rounded-full flex items-center justify-center backdrop-blur-sm hover:bg-white/50 transition-colors z-10">
                <ChevronRight className="w-6 h-6 text-gray-800 rotate-180" />
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
                  <h1 className="text-3xl md:text-4xl font-bold text-gray-900">הגדרות פרופיל משתמש</h1>
                  
                  {/* Profile Picture with Edit Button */}
                  <div className="relative">
                    <div className="w-20 h-20 bg-blue-200 rounded-full flex items-center justify-center border-4 border-white shadow-lg">
                      <UserIcon className="w-10 h-10 text-blue-600" />
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
                      onChange={() => {/* Handle file upload */}}
                    />
                  </div>
                  
                  <h2 className="text-xl font-semibold text-gray-800">{user?.full_name || "ישראל ישראלי"}</h2>
                </div>

                {/* Form Section */}
                <form onSubmit={handleSave} className="space-y-6">
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

                    {/* WhatsApp Phone */}
                    <div className="space-y-1">
                      <div className="relative">
                        <Phone className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-green-500" />
                        <Input
                          placeholder="וואטסאפ לקבלת הודעות"
                          value={formData.whatsapp_phone}
                          onChange={(e) => handleInputChange('whatsapp_phone', e.target.value)}
                          required
                          className="w-full h-12 bg-white border-gray-200 rounded-lg pr-12 pl-4 text-right shadow-sm focus:border-green-400"
                          dir="rtl"
                        />
                      </div>
                      {errors.whatsapp_phone && (
                        <p className="text-red-500 text-sm text-right">{errors.whatsapp_phone}</p>
                      )}
                    </div>

                    {/* Location */}
                    <div className="space-y-1">
                      <div className="relative">
                        <MapPin className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <Input
                          placeholder="מיקום מועדף"
                          value={formData.preferred_location}
                          onChange={(e) => handleInputChange('preferred_location', e.target.value)}
                          required
                          className="w-full h-12 bg-white border-gray-200 rounded-lg pr-12 pl-4 text-right shadow-sm focus:border-blue-400"
                          dir="rtl"
                        />
                      </div>
                      {errors.preferred_location && (
                        <p className="text-red-500 text-sm text-right">{errors.preferred_location}</p>
                      )}
                    </div>

                    {/* Experience Level */}
                    <div className="space-y-1">
                      <div className="relative">
                        <Briefcase className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <Input
                          placeholder="רמת ניסיון"
                          value={formData.experience_level}
                          onChange={(e) => handleInputChange('experience_level', e.target.value)}
                          required
                          className="w-full h-12 bg-white border-gray-200 rounded-lg pr-12 pl-4 text-right shadow-sm focus:border-blue-400"
                          dir="rtl"
                        />
                      </div>
                      {errors.experience_level && (
                        <p className="text-red-500 text-sm text-right">{errors.experience_level}</p>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col items-center space-y-4 pt-6">
                    <Button
                      type="submit"
                      disabled={isSubmitDisabled}
                      className={`w-full md:w-96 h-12 rounded-full text-lg font-bold shadow-lg transition-all ${
                        isSubmitDisabled
                          ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          : 'bg-blue-600 hover:bg-blue-700 text-white'
                      }`}
                    >
                      {saving ? <Loader2 className="w-6 h-6 animate-spin" /> : 'עדכן'}
                    </Button>
                    
                    <Button 
                      type="button" 
                      variant="link" 
                      className="text-red-500 hover:text-red-600 font-medium"
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
