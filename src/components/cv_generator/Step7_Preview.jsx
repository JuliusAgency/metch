
import React, { useState } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Edit, Download, Eye, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import CVPreview from '@/components/cv_generator/CVPreview';

export default function Step7_Preview({ cvData, setData, onEdit }) {
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);

    const handleFileNameChange = (e) => {
        setData({ file_name: e.target.value });
    };

    const handleDownload = () => {
        const originalTitle = document.title;
        if (cvData.file_name?.trim()) {
            document.title = cvData.file_name;
        }
        window.print();
        // Restore title after print dialog closes (for blocking browsers) or via event
        if ('onafterprint' in window) {
            window.addEventListener('afterprint', () => {
                document.title = originalTitle;
            }, { once: true });
        } else {
            // Fallback for browsers where print() is blocking
            document.title = originalTitle;
        }
    };

    return (
        <>
            <div className="max-w-4xl mx-auto text-center" dir="rtl">
                <div className="mb-10 px-4">
                    <h2 className="text-3xl font-bold text-gray-900 mb-3">צפייה בקורות חיים</h2>
                    <p className="text-gray-600 max-w-lg mx-auto">בחלק הזה תעברו על הקורות חיים ותוכלו לערוך במידת הצורך או לחזור אחורה ולתקן את אחד מהחלקים</p>
                </div>

                <div className="bg-white/40 backdrop-blur-sm rounded-3xl p-6 md:p-8 shadow-[0_2px_12px_rgba(0,0,0,0.08)] mx-3 md:mx-0">
                    <div className="mb-8 max-w-md mx-auto text-right">
                        <Input
                            placeholder='בחרו שם לקובץ קו"ח'
                            value={cvData.file_name || ''}
                            onChange={handleFileNameChange}
                            className="w-full h-12 bg-white border-gray-200 rounded-full px-6 text-right shadow-sm focus:border-blue-400 focus:ring-blue-400"
                            required
                        />
                    </div>

                    <div className="flex justify-center items-center gap-4 md:gap-8">
                        <div className="flex flex-col gap-4">
                            <Button onClick={onEdit} variant="outline" size="icon" className="w-10 h-10 md:w-12 md:h-12 rounded-full border-blue-200 text-blue-500 shadow-sm bg-white"><Edit className="w-5 h-5 md:w-6 md:h-6" /></Button>
                            <Button onClick={handleDownload} variant="outline" size="icon" className="w-10 h-10 md:w-12 md:h-12 rounded-full border-blue-200 text-blue-500 shadow-sm bg-white"><Download className="w-5 h-5 md:w-6 md:h-6" /></Button>
                            <Button onClick={() => setIsPreviewOpen(true)} variant="outline" size="icon" className="w-10 h-10 md:w-12 md:h-12 rounded-full border-blue-200 text-blue-500 shadow-sm bg-white"><Eye className="w-5 h-5 md:w-6 md:h-6" /></Button>
                        </div>

                        <div className="w-[200px] h-[282px] md:w-[450px] md:h-[636px] bg-white shadow-xl rounded-lg overflow-hidden border border-gray-100 flex-shrink-0">
                            <CVPreview cvData={cvData} />
                        </div>
                    </div>
                </div>
            </div>

            <AnimatePresence>
                {isPreviewOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
                        onClick={() => setIsPreviewOpen(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="relative bg-white rounded-lg shadow-2xl w-full max-w-4xl h-[90vh] overflow-y-auto"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setIsPreviewOpen(false)}
                                className="absolute top-2 right-2 rounded-full z-10 bg-white/50 hover:bg-white/80"
                            >
                                <X className="w-6 h-6" />
                            </Button>
                            <CVPreview cvData={cvData} />
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
