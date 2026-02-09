import React, { useState, useRef } from 'react';
import { UploadFile } from '@/api/integrations';
import { User } from '@/api/entities';
import { CV } from '@/api/entities';
import { Button } from '@/components/ui/button';
import { UploadCloud, FileText, Loader2, CheckCircle, AlertCircle, Eye, Trash2, Upload, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import skipInfoIcon from '@/assets/skip_info_icon.png';
import { triggerInsightsGeneration, invalidateInsightsCache } from '@/services/insightsService';
import { extractTextFromPdf } from '@/utils/pdfUtils';
import { useToast } from "@/components/ui/use-toast";

export default function UploadCV({ user, onUploadComplete, onUploadSuccess, onDelete, onSkip, showSkipDisclaimer }) {
    const [file, setFile] = useState(null);
    const [uploadStatus, setUploadStatus] = useState('idle'); // idle, uploading, success, error
    const [errorMessage, setErrorMessage] = useState('');
    const fileInputRef = useRef(null);
    const { toast } = useToast();

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile) {
            setUploadStatus('idle');
            setFile(selectedFile);
            handleUpload(selectedFile);
        }
    };

    const handleUpload = async (fileToUpload) => {
        const fileProcess = fileToUpload || file;
        if (!fileProcess || !user) return;

        setUploadStatus('uploading');
        setErrorMessage('');

        try {
            // Ensure we have user email
            const userEmail = user?.email;
            if (!userEmail) {
                throw new Error("User email is not available. Please refresh the page.");
            }

            // 1. Upload the file
            // Sanitize filename to avoid "Invalid key" errors with special characters
            const cleanFileName = fileProcess.name.replace(/[^a-zA-Z0-9.-]/g, '_');
            const { publicUrl, file_url } = await UploadFile({
                file: fileProcess,
                bucket: 'public-files',
                path: `${Date.now()}-${cleanFileName}`
            });

            const resumeUrl = publicUrl || file_url;

            if (!resumeUrl) {
                throw new Error("File upload failed to return a URL.");
            }

            const fileUrl = resumeUrl;

            // 2. Update the User entity with the new resume URL
            await User.updateMyUserData({ resume_url: fileUrl });

            // 3. Extract text found in PDF (Frontend parsing)
            let extractedText = null;
            if (fileProcess.type === 'application/pdf') {
                try {
                    console.log("[UploadCV] Extracting text from PDF...");
                    // We need a URL for pdfjs to read. We can use the public URL or create a blob URL.
                    // Using blob URL avoids CORS issues with the public bucket immediately after upload.
                    const blobUrl = URL.createObjectURL(fileProcess);
                    extractedText = await extractTextFromPdf(blobUrl);
                    URL.revokeObjectURL(blobUrl);
                    console.log("[UploadCV] Text extracted successfully, length:", extractedText.length);
                } catch (err) {
                    console.error("[UploadCV] Failed to extract text from PDF:", err);
                    // Continue without text - backend might handle it or user can try again
                }
            } else {
                console.log("[UploadCV] File is not PDF, skipping frontend extraction");
            }

            // 4. Find existing CV record or create a new one to store metadata
            const existingCvs = await CV.filter({ user_email: userEmail });
            const cvMetadata = {
                user_email: userEmail,
                file_name: fileProcess.name,
                file_size_kb: String(Math.round(fileProcess.size / 1024)),
                last_modified: new Date().toISOString(),
                parsed_content: extractedText // Update with extracted text or null
            };

            if (existingCvs.length > 0) {
                await CV.update(existingCvs[0].id, cvMetadata);
            } else {
                await CV.create(cvMetadata);
            }

            setUploadStatus('success');

            // Trigger AI insights generation in background
            if (user?.id && userEmail) {
                console.log("[UploadCV] Triggering AI insights generation after CV upload");
                invalidateInsightsCache(user.id); // Clear old cache
                triggerInsightsGeneration(user.id, userEmail)
                    .then(success => {
                        if (success) {
                            console.log("[UploadCV] AI insights generated successfully");
                        }
                    })
                    .catch(err => console.error("[UploadCV] Error generating insights:", err));
            }

            // Notify parent about success but DO NOT navigate automatically
            if (onUploadSuccess) {
                onUploadSuccess();
            }

        } catch (error) {
            console.error("Error during CV upload process:", error);
            setUploadStatus('error');
            setErrorMessage(error.message || "An unexpected error occurred. Please try again.");
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        const droppedFile = e.dataTransfer.files[0];
        if (droppedFile) {
            setUploadStatus('idle');
            setFile(droppedFile);
            handleUpload(droppedFile);
        }
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const UploadArea = () => (
        <div className="flex flex-col items-center justify-center text-center w-full">
            {/* Title - Outside the box */}
            {!showSkipDisclaimer && (
                <h3 className="text-xl md:text-2xl font-bold text-[#333333] mb-8">
                    העלה את קובץ קורות החיים שלך
                </h3>
            )}

            <div className={`w-full border-2 border-dashed border-gray-200 rounded-[1rem] px-10 md:px-14 flex flex-col items-center ${showSkipDisclaimer ? 'py-6 md:py-8' : 'py-10 md:py-16'}`}>
                {/* Green Upload Icon */}
                {!showSkipDisclaimer && (
                    <div className="mb-6">
                        <Upload className="w-10 h-10 text-[#77C883] mx-auto" />
                    </div>
                )}

                {/* Hidden Input */}
                <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    accept=".pdf,.doc,.docx"
                    onChange={handleFileChange}
                />

                {/* Green Button */}
                <Button
                    onClick={() => fileInputRef.current?.click()}
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    className={`bg-[#77C883] hover:bg-[#66b572] text-white text-lg md:text-xl font-bold py-6 px-12 rounded-full shadow-none w-auto min-w-[200px] transition-all ${showSkipDisclaimer ? 'mb-4' : 'mb-8'}`}
                >
                    בחירת קובץ
                </Button>

                {/* Subtitle / Disclaimer */}
                <p className="text-gray-600 text-sm md:text-base max-w-xs mx-auto leading-relaxed px-4 md:px-0">
                    ה AI ינתח את קורות החיים שלך
                    <br />
                    על מנת להוציא ממנו את המיטב
                </p>
            </div>
        </div>
    );

    const handleView = () => {
        if (file) {
            const fileUrl = URL.createObjectURL(file);
            window.open(fileUrl, '_blank');
        }
    };

    const handleDelete = async () => {
        setUploadStatus('idle');
        try {
            if (user?.email) {
                // Remove from backend
                const existingCvs = await CV.filter({ user_email: user.email });
                if (existingCvs.length > 0) {
                    await CV.delete(existingCvs[0].id);
                }
                await User.updateMyUserData({ resume_url: null });
            }
        } catch (error) {
            console.error("Error deleting CV:", error);
        } finally {
            setFile(null);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
            if (onDelete) onDelete();
        }
    };

    const FilePreview = () => (
        <div className="border border-gray-200 bg-gray-50 rounded-xl p-4 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3 text-right w-full">
                <FileText className="w-8 h-8 text-blue-500 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-800 truncate" title={file.name}>{file.name}</p>
                    <p className="text-sm text-gray-500">{Math.round(file.size / 1024)} KB</p>
                </div>
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto justify-end">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleView}
                    title="הצג קובץ"
                    className="hover:bg-blue-50 text-gray-500 hover:text-blue-600"
                >
                    <Eye className="w-5 h-5" />
                </Button>
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleDelete}
                    title="מחיקת קובץ"
                    className="hover:bg-red-50 text-gray-500 hover:text-red-600"
                >
                    <Trash2 className="w-5 h-5" />
                </Button>
                <div className="text-green-500 font-medium flex items-center gap-2">
                    <CheckCircle className="w-5 h-5" />
                    הועלה בהצלחה
                </div>
            </div>
        </div>
    );

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-4xl mx-auto text-center px-4 md:px-0"
            dir="rtl"
        >
            {showSkipDisclaimer ? (
                <div className="flex flex-col items-center justify-center mb-0 mt-2">
                    {/* Custom Red Info Icon from user image */}
                    <div className="mb-4">
                        <img src={skipInfoIcon} alt="Warning" className="w-12 h-12 object-contain" />
                    </div>

                    {/* Warning Text - 2 lines */}
                    <h3 className="text-[#FF4D4D] text-lg font-bold max-w-[240px] leading-tight mb-4">
                        הצעות עבודה לא יתקבלו
                        <br />
                        ללא קובץ קורות החיים שלך
                    </h3>
                </div>
            ) : null}

            <div className="space-y-6">
                {!file ? <UploadArea /> : <FilePreview />}

                <AnimatePresence>
                    {uploadStatus === 'success' && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex items-center justify-center gap-2 text-green-600 font-semibold"
                        >
                            <CheckCircle className="w-5 h-5" />
                            <span>ההעלאה הושלמה בהצלחה!</span>
                        </motion.div>
                    )}
                    {uploadStatus === 'error' && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex items-center justify-center gap-2 text-red-600 font-semibold"
                        >
                            <AlertCircle className="w-5 h-5" />
                            <span>שגיאה: {errorMessage}</span>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </motion.div>
    );
}