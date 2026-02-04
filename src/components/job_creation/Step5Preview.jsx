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
import SeekerJobTitle from "@/components/seeker/SeekerJobTitle";
import SeekerJobPerks from "@/components/seeker/SeekerJobPerks";
import SeekerJobInfo from "@/components/seeker/SeekerJobInfo";

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
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-200 scale-90 origin-top max-w-5xl mx-auto">
        {/* Header with curved background - matching other pages */}
        <div className="relative h-20">
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

        <div className="px-6 pt-2 pb-4 -mt-6 max-w-4xl mx-auto relative z-10">
          {/* Job Info Sections */}
          <div className="space-y-2">
            <SeekerJobTitle
              job={{
                ...jobData,
                match_score: 95
              }}
              employmentTypeText={employmentTypeText}
              showMatchScore={false}
            />

            <SeekerJobPerks perks={jobData.company_perks} />

            <SeekerJobInfo
              job={jobData}
              aiAnalysis={null}
              isAiLoading={false}
              layout="grid"
              showAiAnalysis={false}
              showResponsibilities={false}
            />
          </div>
        </div>

        {/* Enhanced File Upload Section */}
        <div className="mb-8 max-w-3xl mx-auto px-6">
          {dragActive ? (
            <div
              className="border-2 border-dashed rounded-2xl p-6 text-center transition-colors border-blue-400 bg-blue-50 h-40 flex flex-col justify-center items-center"
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <Upload className="w-10 h-10 text-blue-500 mx-auto mb-3" />
              <p className="text-lg font-semibold text-blue-600">
                שחרר קבצים כאן
              </p>
            </div>
          ) : (
            <div
              className={`border border-dashed rounded-xl py-6 px-10 text-center transition-colors border-gray-300 bg-white cursor-pointer hover:bg-gray-50`}
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

              <div className="flex flex-col items-center justify-center space-y-3">
                <Upload className="w-8 h-8 text-gray-400" />
                <p className="text-gray-600 font-medium">גרור קבצים להעלאה על המשרה</p>
                <span className="text-gray-400 text-sm font-medium">או</span>
                <Button
                  variant="secondary"
                  className="bg-[#e1effe] text-[#1e429f] hover:bg-[#d1e5fd] border-0 font-bold px-6 py-2 h-auto rounded-lg"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleButtonClick();
                  }}
                >
                  בחר קבצים
                </Button>
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

        </div>
      </div>

      {/* Navigation Buttons outside Card */}
      <div className="flex justify-between items-center max-w-5xl mx-auto mt-8 px-4 w-full">
        <Button
          variant="secondary"
          className="bg-[#e1effe] text-[#1e429f] hover:bg-[#d1e5fd] border-0 font-bold px-8 py-2 rounded-full text-base"
          onClick={onPrev}
          disabled={isSubmitting}
        >
          <ChevronRight className="w-4 h-4 ml-2" />
          חזור
        </Button>

        <Button
          className={`text-white px-8 py-2 rounded-full font-bold text-base shadow-lg ${nextLabel !== 'הבא' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-600 hover:bg-blue-700'}`}
          onClick={onNext}
          disabled={isNextDisabled}
        >
          {nextLabel}
          {!isSubmitting && <ArrowLeft className="w-4 h-4 mr-2" />}
        </Button>
      </div>
    </div>
  );
}
