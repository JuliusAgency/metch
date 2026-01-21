import React, { useState, useRef } from 'react';
import { UploadFile } from '@/api/integrations';
import { User } from '@/api/entities';
import { CV } from '@/api/entities';
import { Button } from '@/components/ui/button';
import { UploadCloud, FileText, Loader2, CheckCircle, AlertCircle, Eye, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function UploadCV({ user, onUploadComplete, onUploadSuccess, onSkip, showSkipDisclaimer }) {
    const [file, setFile] = useState(null);
    const [uploadStatus, setUploadStatus] = useState('idle'); // idle, uploading, success, error
    const [errorMessage, setErrorMessage] = useState('');
    const fileInputRef = useRef(null);

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
                path: `${Date.now()} -${cleanFileName} `
            });

            const resumeUrl = publicUrl || file_url;

            if (!resumeUrl) {
                throw new Error("File upload failed to return a URL.");
            }

            const fileUrl = resumeUrl;

            // 2. Update the User entity with the new resume URL
            await User.updateMyUserData({ resume_url: fileUrl });

            // 3. Find existing CV record or create a new one to store metadata
            const existingCvs = await CV.filter({ user_email: userEmail });
            const cvMetadata = {
                user_email: userEmail,
                file_name: fileProcess.name,
                file_size_kb: String(Math.round(fileProcess.size / 1024)),
                last_modified: new Date().toISOString(),
            };

            if (existingCvs.length > 0) {
                await CV.update(existingCvs[0].id, cvMetadata);
            } else {
                await CV.create(cvMetadata);
            }

            setUploadStatus('success');

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
        <div
            className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center cursor-pointer hover:border-blue-500 hover:bg-gray-50/50 transition-colors"
            onClick={() => fileInputRef.current?.click()}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
        >
            <UploadCloud className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-4 text-lg font-medium text-gray-900">גרור קובץ או לחץ כאן</h3>
            <p className="mt-1 text-sm text-gray-500">PDF, DOCX (עד 5MB)</p>
            <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept=".pdf,.doc,.docx"
                onChange={handleFileChange}
            />
        </div>
    );

    const handleView = () => {
        if (file) {
            const fileUrl = URL.createObjectURL(file);
            window.open(fileUrl, '_blank');
        }
    };

    const handleDelete = () => {
        setFile(null);
        setUploadStatus('idle');
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
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
            className="max-w-xl mx-auto text-center"
            dir="rtl"
        >
            {showSkipDisclaimer ? (
                <div className="mb-12">
                    <h2 className="text-3xl font-bold text-gray-800 mb-3">שים לב</h2>
                    <div className="flex items-center justify-center gap-2 text-lg font-bold text-[#FF4D4D] py-3 px-6 rounded-xl inline-block">
                        <AlertCircle className="w-5 h-5 fill-red-500 text-white" />
                        <span>הצעות עבודה לא יתקבלו ללא קובץ קורות החיים שלך</span>
                    </div>
                </div>
            ) : (
                <>
                    <h2 className="text-3xl font-bold text-gray-900 mb-3">העלאת קורות חיים</h2>
                    <p className="text-gray-600 mb-12">צרף את קובץ קורות החיים שלך כדי שנוכל להתחיל למצוא לך משרות.</p>
                </>
            )}

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