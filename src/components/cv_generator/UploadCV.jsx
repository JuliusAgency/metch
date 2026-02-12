import { useState, useRef } from 'react';
import { UploadFile } from '@/api/integrations';
import { User } from '@/api/entities';
import { CV } from '@/api/entities';
import { Button } from '@/components/ui/button';
import { UploadCloud, FileText, Loader2, CheckCircle, AlertCircle, Eye, Trash2, Upload, Info, RefreshCw, FileType2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import skipInfoIcon from '@/assets/skip_info_icon.png';
import { triggerInsightsGeneration, invalidateInsightsCache } from '@/services/insightsService';
import { extractTextFromPdf } from '@/utils/pdfUtils';
import { useToast } from "@/components/ui/use-toast";
import mammoth from 'mammoth';

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

    const extractTextFromDocx = async (file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = async (event) => {
                try {
                    const arrayBuffer = event.target.result;
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

    const handleUpload = async (fileToUpload) => {
        const fileProcess = fileToUpload || file;
        if (!fileProcess || !user) return;

        setUploadStatus('uploading');
        setErrorMessage('');

        try {
            const userEmail = user?.email;
            if (!userEmail) {
                throw new Error("User email is not available. Please refresh the page.");
            }

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
            await User.updateMyUserData({ resume_url: fileUrl });

            // 3. Extract text (Frontend parsing)
            let extractedText = null;
            if (fileProcess.type === 'application/pdf') {
                try {
                    console.log("[UploadCV] Extracting text from PDF...");
                    const blobUrl = URL.createObjectURL(fileProcess);
                    extractedText = await extractTextFromPdf(blobUrl);
                    URL.revokeObjectURL(blobUrl);
                    console.log("[UploadCV] Text extracted successfully, length:", extractedText?.length);
                } catch (err) {
                    console.error("[UploadCV] Failed to extract text from PDF:", err);
                }
            } else if (fileProcess.name.endsWith('.docx') || fileProcess.name.endsWith('.doc')) {
                try {
                    console.log("[UploadCV] Extracting text from DOCX...");
                    extractedText = await extractTextFromDocx(fileProcess);
                    console.log("[UploadCV] Text extracted successfully, length:", extractedText?.length);
                } catch (err) {
                    console.error("[UploadCV] Failed to extract text from DOCX:", err);
                }
            } else {
                console.log("[UploadCV] File type not supported for frontend extraction");
            }

            const existingCvs = await CV.filter({ user_email: userEmail });
            for (const oldCv of existingCvs) {
                try {
                    await CV.delete(oldCv.id);
                } catch (delErr) {
                    console.warn("[UploadCV] Failed to delete old CV record:", delErr);
                }
            }

            const cvMetadata = {
                user_email: userEmail,
                file_name: fileProcess.name,
                file_size_kb: String(Math.round(fileProcess.size / 1024)),
                last_modified: new Date().toISOString(),
                parsed_content: extractedText
            };

            await CV.create(cvMetadata);
            setUploadStatus('success');

            if (user?.id && userEmail) {
                invalidateInsightsCache(user.id);
                setTimeout(() => {
                    triggerInsightsGeneration(user.id, userEmail)
                        .then(success => {
                            if (success) {
                                console.log("[UploadCV] AI insights triggered/generated successfully");
                            }
                        })
                        .catch(err => console.error("[UploadCV] Error generating insights:", err));
                }, 500);
            }

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
                    accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                    onChange={(e) => {
                        handleFileChange(e);
                        // Reset value to allow selecting the same file again if needed
                        e.target.value = '';
                    }}
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

                // Invalidate insights cache when CV is deleted
                if (user.id) {
                    invalidateInsightsCache(user.id);
                }
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

    const getFileIcon = (fileName) => {
        if (fileName.endsWith('.pdf')) {
            return <FileText className="w-8 h-8 text-red-500 flex-shrink-0" />;
        } else if (fileName.endsWith('.doc') || fileName.endsWith('.docx')) {
            return <FileText className="w-8 h-8 text-blue-500 flex-shrink-0" />;
        } else {
            return <FileText className="w-8 h-8 text-gray-400 flex-shrink-0" />;
        }
    };

    const FilePreview = () => (
        <div className="border border-gray-200 bg-gray-50 rounded-xl p-4 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3 text-right w-full">
                {getFileIcon(file.name)}
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
                {!showSkipDisclaimer && (
                    <h3 className="text-xl md:text-2xl font-bold text-[#333333] mb-8">
                        העלה את קובץ קורות החיים שלך
                    </h3>
                )}
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