import React, { useState, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  User,
  MapPin,
  Clock,
  Briefcase,
  Upload,
  ChevronRight,
  X,
  FileText,
  Image,
  File,
  Video,
  CheckCircle2,
  Check,
  ArrowLeft,
} from "lucide-react";
import { UploadFile } from "@/api/integrations";
import settingsHeaderBg from "@/assets/settings_header_bg.png";

export default function Step5Preview({ jobData, setJobData, onNext, onPrev, isSubmitting, isNextDisabled, nextLabel }) {
  const [uploadedFiles, setUploadedFiles] = useState(
    Array.isArray(jobData.attachments) ? jobData.attachments : []
  );
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);

  const employmentTypeText = {
    full_time: "משרה מלאה",
    part_time: "משרה חלקית",
    contract: "חוזה",
    freelance: "פרילנס",
    internship: "התמחות",
  };

  const handleFileUpload = async (files) => {
    setUploading(true);
    try {
      // Validate and filter files
      const validFiles = Array.from(files).filter(file => {
        if (file.size > 5 * 1024 * 1024) {
          // You might want to import useToast to show this error, but for now console.warn
          console.warn(`File ${file.name} is too large (max 5MB)`);
          return false;
        }
        return true;
      });

      const uploadPromises = validFiles.map(async (file) => {
        // Sanitize filename
        const cleanFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');

        const result = await UploadFile({
          file,
          bucket: 'public-files', // Ensure correct bucket
          path: `job-attachments/${Date.now()}-${cleanFileName}` // Add path structure
        });

        return {
          name: file.name, // Keep original name for display
          url: result.file_url || result.publicUrl,
          type: file.type,
          size: file.size,
        };
      });

      const uploadedFileResults = await Promise.all(uploadPromises);
      const newFiles = [...uploadedFiles, ...uploadedFileResults];
      setUploadedFiles(newFiles);

      setJobData((prev) => ({
        ...prev,
        attachments: newFiles,
      }));
    } catch (error) {
      console.error("Error uploading files:", error);
    } finally {
      setUploading(false);
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files);
    }
  };

  const handleFileInput = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFileUpload(e.target.files);
    }
  };

  const handleButtonClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const removeFile = (indexToRemove) => {
    const newFiles = uploadedFiles.filter(
      (_, index) => index !== indexToRemove
    );
    setUploadedFiles(newFiles);
    setJobData((prev) => ({
      ...prev,
      attachments: newFiles,
    }));
  };

  const getFileIcon = (fileType) => {
    if (fileType.startsWith("image/")) {
      return <Image className="w-5 h-5 text-blue-500" />;
    } else if (fileType.startsWith("video/")) {
      return <Video className="w-5 h-5 text-green-500" />;
    } else if (fileType === "application/pdf") {
      return <FileText className="w-5 h-5 text-red-500" />;
    } else {
      return <File className="w-5 h-5 text-gray-500" />;
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <div className="w-full mx-auto" dir="rtl" onDragEnter={handleDrag}>
      {/* Job Preview Card */}
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-200">
        {/* Header with curved background - matching other pages */}
        <div className="relative h-24">
          <div
            className="absolute inset-0 w-full h-full"
            style={{
              backgroundImage: `url(${settingsHeaderBg})`,
              backgroundSize: "100% 100%",
              backgroundPosition: "center",
              backgroundRepeat: "no-repeat",
            }}
          />

          {/* User Icon in center */}
          <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2">
            <div className="w-14 h-14 bg-blue-500 rounded-full flex items-center justify-center shadow-lg border-4 border-white">
              <User className="w-7 h-7 text-white" />
            </div>
          </div>
        </div>

        <div className="px-6 py-4 mt-2 max-w-[65%] mx-auto">
          {/* Job Title */}
          <div className="text-center mb-4">
            <h2 className="text-xl font-bold text-gray-900 mb-3">
              {jobData.title || "מנהלת קישורי לקוחות"}
            </h2>

            {/* Main Job Info Badges */}
            <div className="flex justify-center items-center gap-4 mb-3">
              <Badge
                variant="outline"
                className="flex items-center gap-2 text-[#001a6e] font-bold border-0 bg-[#e5f1fb] px-4 py-2"
              >
                <Clock className="w-4 h-4" />
                <span className="text-sm">מיידית</span>
              </Badge>
              <Badge
                variant="outline"
                className="flex items-center gap-2 text-[#001a6e] font-bold border-0 bg-[#e5f1fb] px-4 py-2"
              >
                <Briefcase className="w-4 h-4" />
                <span className="text-sm">
                  {employmentTypeText[jobData.employment_type] || "משרה מלאה"}
                </span>
              </Badge>
              <Badge
                variant="outline"
                className="flex items-center gap-2 text-[#001a6e] font-bold border-0 bg-[#e5f1fb] px-4 py-2"
              >
                <MapPin className="w-4 h-4" />
                <span className="text-sm">{jobData.location || "מרכז"}</span>
              </Badge>
            </div>

            {/* Company Perks Badges - New Design */}
            <div className="flex justify-center gap-3 mb-6 flex-wrap">
              {Array.isArray(jobData.company_perks) && jobData.company_perks.length > 0 ? (
                jobData.company_perks.slice(0, 4).map((perk, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 px-4 py-1.5 rounded-full border border-gray-100 bg-white shadow-sm"
                  >
                    <div className="bg-green-500 rounded-full p-0.5 flex items-center justify-center">
                      <Check className="w-3 h-3 text-white" />
                    </div>
                    <span className="text-gray-700 font-medium text-sm">{perk}</span>
                  </div>
                ))
              ) : (
                <>
                  <div className="flex items-center gap-2 px-4 py-1.5 rounded-full border border-gray-100 bg-white shadow-sm">
                    <div className="bg-green-500 rounded-full p-0.5 flex items-center justify-center">
                      <Check className="w-3 h-3 text-white" />
                    </div>
                    <span className="text-gray-700 font-medium text-sm">משרה מעניין</span>
                  </div>
                  <div className="flex items-center gap-2 px-4 py-1.5 rounded-full border border-gray-100 bg-white shadow-sm">
                    <div className="bg-green-500 rounded-full p-0.5 flex items-center justify-center">
                      <Check className="w-3 h-3 text-white" />
                    </div>
                    <span className="text-gray-700 font-medium text-sm">בנק חבילת</span>
                  </div>
                  <div className="flex items-center gap-2 px-4 py-1.5 rounded-full border border-gray-100 bg-white shadow-sm">
                    <div className="bg-green-500 rounded-full p-0.5 flex items-center justify-center">
                      <Check className="w-3 h-3 text-white" />
                    </div>
                    <span className="text-gray-700 font-medium text-sm">עבודה במשמרות</span>
                  </div>
                  <div className="flex items-center gap-2 px-4 py-1.5 rounded-full border border-gray-100 bg-white shadow-sm">
                    <div className="bg-green-500 rounded-full p-0.5 flex items-center justify-center">
                      <Check className="w-3 h-3 text-white" />
                    </div>
                    <span className="text-gray-700 font-medium text-sm">משרד מפנק</span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Job Details Cards - Matching Seeker View */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {/* About Card (Right in RTL) */}
            <Card className="bg-white border border-gray-100 shadow-sm rounded-2xl h-full">
              <CardContent className="p-4 space-y-2 text-right" dir="rtl">
                <h3 className="font-bold text-base text-blue-900">על המשרה</h3>
                <div className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap">
                  {jobData.description ? (
                    jobData.description
                  ) : (
                    "פרטי המשרה יופיעו כאן..."
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Requirements Card (Center in RTL) */}
            <Card className="bg-white border border-gray-100 shadow-sm rounded-2xl h-full">
              <CardContent className="p-4 space-y-2 text-right" dir="rtl">
                <h3 className="font-bold text-base text-blue-900">דרישות</h3>
                <div className="space-y-1">
                  {Array.isArray(jobData.structured_requirements) &&
                    jobData.structured_requirements.length > 0 ? (
                    jobData.structured_requirements.map((req, index) => (
                      <div key={index} className="flex items-start gap-2 text-gray-700 text-sm">
                        <span className="text-black mt-1.5">•</span>
                        <span className="leading-relaxed">{req.value}</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500 text-sm">אין דרישות מוגדרים</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Responsibilities/Materials Card (Left in RTL) */}
            <Card className="bg-white border border-gray-100 shadow-sm rounded-2xl h-full">
              <CardContent className="p-4 space-y-2 text-right" dir="rtl">
                <h3 className="font-bold text-base text-blue-900">תחומי אחריות</h3>
                <div className="space-y-1">
                  {Array.isArray(jobData.structured_education) &&
                    jobData.structured_education.length > 0 ? (
                    jobData.structured_education.map((edu, index) => (
                      <div key={index} className="flex items-start gap-2 text-gray-700 text-sm">
                        <span className="text-black mt-1.5">•</span>
                        <span className="leading-relaxed">{edu.value}</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500 text-sm">אין תחומי אחריות מוגדרים</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Enhanced File Upload Section */}
          <div className="mb-8">
            {dragActive ? (
              <div
                className="border-2 border-dashed rounded-lg p-4 text-center transition-colors border-blue-400 bg-blue-50 h-32 flex flex-col justify-center items-center"
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <Upload className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                <p className="text-base font-semibold text-blue-600">
                  שחרר קבצים כאן
                </p>
              </div>
            ) : (
              <div
                className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors border-gray-300 bg-[#f9f9f9] cursor-pointer hover:bg-gray-100/50`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={handleButtonClick}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  id="file-upload"
                  multiple
                  className="hidden"
                  onChange={handleFileInput}
                  accept="image/*,video/*,application/pdf,.doc,.docx"
                />

                <div className="flex flex-col items-center justify-center py-2">
                  <Upload className="w-6 h-6 text-gray-400 mb-2" />
                  <p className="text-gray-500 text-sm">ניתן להוסיף תמונות של המשרד</p>
                </div>
              </div>
            )}

            {/* Uploaded Files Display */}
            {uploadedFiles.length > 0 && (
              <div className="mt-4 space-y-2">
                <h4 className="font-semibold text-gray-900 mb-3">
                  קבצים מצורפים:
                </h4>
                {uploadedFiles.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100"
                  >
                    <div className="flex items-center gap-3">
                      {getFileIcon(file.type || "")}
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-700 truncate max-w-[200px] text-right">
                          {file.name}
                        </p>
                        <p className="text-xs text-gray-400 text-right">
                          {formatFileSize(file.size || 0)}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => removeFile(index)}
                      disabled={uploading}
                      className="p-1 hover:bg-red-50 rounded-full transition-colors group"
                      title="הסר קובץ"
                    >
                      <X className="w-5 h-5 text-gray-400 group-hover:text-red-500" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Navigation Buttons inside Card */}
            <div className="flex justify-center items-center gap-4 mt-8 pb-4">
              <Button
                variant="outline"
                className="px-8 py-3 rounded-full font-bold text-lg border-gray-300 text-gray-700 hover:bg-gray-50 bg-white"
                onClick={onPrev}
                disabled={isSubmitting}
              >
                חזור
              </Button>

              <Button
                className={`text-white px-12 py-3 rounded-full font-bold text-lg shadow-lg ${nextLabel !== 'הבא' ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700'}`}
                onClick={onNext}
                disabled={isNextDisabled}
              >
                {nextLabel}
                {!isSubmitting && <ArrowLeft className="w-5 h-5 ml-2" />}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
