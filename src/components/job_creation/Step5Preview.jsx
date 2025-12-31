import React, { useState, useRef } from "react";
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
} from "lucide-react";
import { UploadFile } from "@/api/integrations";

export default function Step5Preview({ jobData, setJobData }) {
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
    <div className="max-w-4xl mx-auto" dir="rtl" onDragEnter={handleDrag}>
      {/* Job Preview Card */}
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-200">
        {/* Header with curved background - matching other pages */}
        <div className="relative h-32">
          <div
            className="absolute inset-0 w-full h-full [clip-path:ellipse(120%_110%_at_50%_100%)]"
            style={{
              backgroundImage:
                "url(https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/689c85a409a96fa6a10f1aca/d9fc7bd69_Rectangle6463.png)",
              backgroundSize: "cover",
              backgroundPosition: "center",
              backgroundRepeat: "no-repeat",
            }}
          />

          {/* User Icon in center */}
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
            <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center shadow-lg border-4 border-white">
              <User className="w-8 h-8 text-white" />
            </div>
          </div>
        </div>

        <div className="px-8 py-6 mt-4">
          {/* Job Title */}
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              {jobData.title || "מנהלת קישורי לקוחות"}
            </h2>

            {/* Main Job Info Badges */}
            <div className="flex justify-center items-center gap-4 mb-4">
              <Badge
                variant="outline"
                className="flex items-center gap-2 text-blue-600 border-blue-300 px-4 py-2"
              >
                <span>מיידי</span>
                <Clock className="w-4 h-4" />
              </Badge>
              <Badge
                variant="outline"
                className="flex items-center gap-2 text-blue-600 border-blue-300 px-4 py-2"
              >
                <span>
                  {employmentTypeText[jobData.employment_type] || "משרה מלאה"}
                </span>
                <Briefcase className="w-4 h-4" />
              </Badge>
              <Badge
                variant="outline"
                className="flex items-center gap-2 text-blue-600 border-blue-300 px-4 py-2"
              >
                <span>{jobData.location || "מרכז"}</span>
                <MapPin className="w-4 h-4" />
              </Badge>
            </div>

            {/* Company Perks Badges */}
            <div className="flex justify-center gap-2 mb-8 flex-wrap">
              {Array.isArray(jobData.company_perks) && jobData.company_perks.length > 0 ? (
                jobData.company_perks.slice(0, 4).map((perk, index) => {
                  const colors = [
                    "bg-green-100 text-green-800",
                    "bg-blue-100 text-blue-800",
                    "bg-purple-100 text-purple-800",
                    "bg-orange-100 text-orange-800",
                  ];

                  return (
                    <Badge
                      key={index}
                      className={`${colors[index % colors.length]
                        } border-0 px-4 py-2`}
                    >
                      {perk}
                    </Badge>
                  );
                })
              ) : (
                <>
                  <Badge className="bg-green-100 text-green-800 border-0 px-4 py-2">
                    משרה מעניין
                  </Badge>
                  <Badge className="bg-blue-100 text-blue-800 border-0 px-4 py-2">
                    בנק חבילת
                  </Badge>
                  <Badge className="bg-purple-100 text-purple-800 border-0 px-4 py-2">
                    עבודה במשמרות
                  </Badge>
                  <Badge className="bg-orange-100 text-orange-800 border-0 px-4 py-2">
                    סביבה
                  </Badge>
                </>
              )}
            </div>
          </div>

          {/* Job Details in Three Columns */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            {/* חומרי אימון */}
            <div className="text-right">
              <h3 className="font-bold text-lg mb-4 text-gray-900">
                חומרי אימון
              </h3>
              <div className="space-y-2 text-gray-700">
                {Array.isArray(jobData.structured_education) &&
                  jobData.structured_education.length > 0 ? (
                  jobData.structured_education.map((edu, index) => (
                    <p key={index} className="text-sm">
                      • {edu.value}
                    </p>
                  ))
                ) : (
                  <div className="space-y-2">
                    <p className="text-sm">
                      • ניסיון של שנתיים לפחות בחברת הפקות מומלץ -יתרון
                    </p>
                    <p className="text-sm">
                      • ניסיון קודם בתחום הרפואה או הביטוח או בתחום סמוך -יתרון
                    </p>
                    <p className="text-sm">
                      • יכולת עבודה במסגרת הקשרת מורכבת (אופציה באטלבוקס)
                    </p>
                    <p className="text-sm">
                      • עבודה בצוותי בעלות (אופציה באטלבוקס)
                    </p>
                    <p className="text-sm">• שליטת פרמדים</p>
                  </div>
                )}
              </div>
            </div>

            {/* דרישות */}
            <div className="text-right">
              <h3 className="font-bold text-lg mb-4 text-gray-900">דרישות</h3>
              <div className="space-y-2 text-gray-700">
                {Array.isArray(jobData.structured_requirements) &&
                  jobData.structured_requirements.length > 0 ? (
                  jobData.structured_requirements.map((req, index) => (
                    <p key={index} className="text-sm">
                      • {req.value}
                    </p>
                  ))
                ) : (
                  <div className="space-y-2">
                    <p className="text-sm">
                      • ניסיון של שנתיים לפחות בחברת הפקות מומלץ -יתרון
                    </p>
                    <p className="text-sm">
                      • ניסיון קודם בתחום הרפואה או הביטוח או בתחום סמוך -יתרון
                    </p>
                    <p className="text-sm">
                      • יכולת עבודה במסגרת הקשרת מורכבת (אופציה באטלבוקס)
                    </p>
                    <p className="text-sm">
                      • עבודה בצוותי בעלות (אופציה באטלבוקס)
                    </p>
                    <p className="text-sm">• שליטת פרמדים</p>
                  </div>
                )}
              </div>
            </div>

            {/* על המשרה */}
            <div className="text-right">
              <h3 className="font-bold text-lg mb-4 text-gray-900">על המשרה</h3>
              <div className="space-y-2 text-gray-700">
                {jobData.description ? (
                  <p className="text-sm leading-relaxed">
                    {jobData.description}
                  </p>
                ) : (
                  <div className="space-y-2">
                    <p className="text-sm">
                      ובאברחי ה Techwise-מאיתנו ה מתפטמויות רב/חלק נקיות
                      מכלבובלוצאות ביחידו/הו לשמתר לצברת מטוני
                    </p>
                    <p className="text-sm">
                      התפקיד כולל ניהולת האמצאי של המידתי ברחמרקני במקומם,
                      התמחות בטכנולוגיות וההוצאות במטלגיטכיולג יחרבמן ראלויות
                      מחירות פיקיותולחי. המטמלות לחנותיות ו חתמות המניוחדות
                      עווין ווית פרויקטים
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Enhanced File Upload Section */}
          <div className="mb-8">
            {dragActive ? (
              <div
                className="border-2 border-dashed rounded-lg p-8 text-center transition-colors border-blue-400 bg-blue-50 h-52 flex flex-col justify-center items-center"
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <Upload className="w-10 h-10 text-blue-500 mx-auto mb-4" />
                <p className="text-lg font-semibold text-blue-600">
                  שחרר קבצים כאן
                </p>
              </div>
            ) : (
              <div
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors border-gray-300`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
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

                <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-600 mb-2">גרור קבצים להעלאה על המשרה</p>
                <p className="text-sm text-gray-500 mb-4">או</p>
                <Button
                  type="button"
                  variant="outline"
                  className="cursor-pointer"
                  onClick={handleButtonClick}
                  disabled={uploading}
                >
                  {uploading ? "מעלה..." : "בחר קבצים"}
                </Button>
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
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <button
                      onClick={() => removeFile(index)}
                      className="text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                    <div className="flex items-center gap-3 text-right">
                      <div>
                        <p className="font-medium text-gray-900">{file.name}</p>
                        <p className="text-sm text-gray-500">
                          {formatFileSize(file.size)}
                        </p>
                      </div>
                      {getFileIcon(file.type)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Bottom Buttons */}
          <div className="flex justify-center gap-4 hidden">
            <Button className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-full font-bold">
              פרסום משרה
            </Button>
            <Button
              variant="outline"
              className="border-gray-300 text-gray-700 hover:bg-gray-50 px-8 py-3 rounded-full font-bold"
            >
              חזרה
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
