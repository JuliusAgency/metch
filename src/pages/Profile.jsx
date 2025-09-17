
import { useState, useEffect, useRef } from "react";
import { User } from "@/api/entities";
import { UploadFile } from "@/api/integrations";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import {
  ChevronRight,
  FileText,
  Upload,
  Edit3,
  Eye,
  Trash2,
  Loader2
} from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function Profile() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [availableForWork, setAvailableForWork] = useState(true);
  const fileInputRef = useRef(null);

  // Mock resume data - in real app would come from user data
  const [resumeData, setResumeData] = useState({
    name: "מעיינה, נק קפיי 2025",
    uploadDate: "30.05.2020 11:50",
    size: "867 KB",
    url: "#"
  });

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const userData = await User.me();
      setUser(userData);
      setAvailableForWork(userData.available_for_work ?? true);
    } catch (error) {
      console.error("Error loading user:", error);
      // Mock user for demo
      setUser({ 
        full_name: "דניאל כהן", 
        email: "daniel@example.com",
        available_for_work: true 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const result = await UploadFile({ file });
      
      // Update resume data
      setResumeData({
        name: file.name,
        uploadDate: new Date().toLocaleDateString('he-IL'),
        size: `${(file.size / 1024).toFixed(0)} KB`,
        url: result.file_url
      });

      // Update user resume URL
      await User.updateMyUserData({ resume_url: result.file_url });
      
    } catch (error) {
      console.error("Error uploading file:", error);
    } finally {
      setUploading(false);
    }
  };

  const handleWorkAvailabilityToggle = async (checked) => {
    setAvailableForWork(checked);
    try {
      await User.updateMyUserData({ available_for_work: checked });
    } catch (error) {
      console.error("Error updating work availability:", error);
    }
  };

  const handleViewResume = () => {
    if (resumeData.url && resumeData.url !== "#") {
      window.open(resumeData.url, '_blank');
    }
  };

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
      <div className="max-w-4xl mx-auto">
        <Card className="bg-white rounded-2xl md:rounded-[2.5rem] shadow-xl border border-gray-100 overflow-hidden">
          <div className="relative">
            {/* Header with curved background */}
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
                <div className="text-center">
                  <h1 className="text-3xl md:text-4xl font-bold text-gray-900">ניהול הפרטים שלי</h1>
                </div>

                {/* Resume Upload Section */}
                <div className="bg-gray-50/80 rounded-2xl p-6 border border-gray-200/50">
                  {/* Resume Display */}
                  {resumeData.name && (
                    <div className="mb-6">
                      <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            {/* Action Buttons */}
                            <div className="flex gap-2">
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="text-red-500 hover:text-red-600 hover:bg-red-50"
                                onClick={() => setResumeData({ name: "", uploadDate: "", size: "", url: "#" })}
                              >
                                <Trash2 className="w-4 h-4 ml-1" />
                                חזה קופי
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="text-blue-500 hover:text-blue-600 hover:bg-blue-50"
                                onClick={() => fileInputRef.current?.click()}
                              >
                                <Edit3 className="w-4 h-4 ml-1" />
                                עורך קופי
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="text-blue-500 hover:text-blue-600 hover:bg-blue-50"
                                onClick={handleViewResume}
                              >
                                <Eye className="w-4 h-4 ml-1" />
                                הקלט קופי
                              </Button>
                            </div>
                          </div>

                          {/* Resume Info */}
                          <div className="text-right">
                            <div className="flex items-center gap-3 mb-2">
                              <div className="bg-red-500 text-white px-2 py-1 rounded text-xs font-bold">
                                PDF
                              </div>
                              <div>
                                <p className="font-semibold text-gray-900">{resumeData.name}</p>
                                <p className="text-sm text-gray-500">
                                  {resumeData.uploadDate} • {resumeData.size}
                                </p>
                              </div>
                              <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                                <FileText className="w-5 h-5 text-gray-600" />
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Upload Input - Hidden */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.doc,.docx"
                    className="hidden"
                    onChange={handleFileUpload}
                  />
                </div>

                {/* Profile Status Navigation with Screening Questionnaire Link */}
                <div className="bg-white rounded-2xl p-6 border border-gray-200/50">
                  <div className="flex items-center justify-between mb-6">
                    <Button variant="ghost" size="icon" className="rounded-full">
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    </Button>
                    <span className="text-gray-600 font-medium">ניהול פרופיל המרכח</span>
                  </div>

                  {/* Work Availability Toggle */}
                  <div className="flex items-center justify-between py-4 border-t border-gray-100">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                      <span className="text-gray-600 font-medium">אני מחפש עבודה</span>
                    </div>
                    <Switch
                      checked={availableForWork}
                      onCheckedChange={handleWorkAvailabilityToggle}
                      className="data-[state=checked]:bg-green-500"
                    />
                  </div>

                  {/* Screening Questionnaire Link */}
                  <div className="flex items-center justify-between py-4 border-t border-gray-100">
                    <Link to={createPageUrl("ScreeningQuestionnaire")}>
                      <Button variant="ghost" size="icon" className="rounded-full hover:bg-gray-100">
                        <ChevronRight className="w-5 h-5 text-gray-400" />
                      </Button>
                    </Link>
                    <span className="text-gray-600 font-medium">שאלון סינון</span>
                  </div>
                </div>

                {/* Upload Button */}
                {!resumeData.name && (
                  <div className="text-center">
                    <Button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-full font-bold text-lg shadow-lg"
                    >
                      {uploading ? (
                        <Loader2 className="w-6 h-6 animate-spin ml-2" />
                      ) : (
                        <Upload className="w-5 h-5 ml-2" />
                      )}
                      {uploading ? 'מעלה קובץ...' : 'העלה קורות חיים'}
                    </Button>
                  </div>
                )}
              </motion.div>
            </CardContent>
          </div>
        </Card>
      </div>
    </div>
  );
}
