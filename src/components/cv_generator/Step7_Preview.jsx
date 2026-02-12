import React, { useState } from 'react';
import { createPortal, flushSync } from 'react-dom';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Edit, Download, Eye, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import CVPreview from '@/components/cv_generator/CVPreview';
import editCustomIcon from '@/assets/edit_custom.png';
import cvPreviewTemplate from '@/assets/cv_preview_template.png';

export default function Step7_Preview({ cvData, setData, onEdit }) {
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);
    const [isPrinting, setIsPrinting] = useState(false);

    const handleFileNameChange = (e) => {
        setData({ file_name: e.target.value });
    };

    const handleDownload = () => {
        const originalTitle = document.title;
        if (cvData.file_name?.trim()) {
            document.title = cvData.file_name;
        }

        // Force synchronous render of the portal before printing
        flushSync(() => {
            setIsPrinting(true);
        });

        window.print();

        // Cleanup after print dialog usage (immediate or delayed doesn't matter much for portal, but cleaner to remove)
        setIsPrinting(false);

        if ('onafterprint' in window) {
            window.addEventListener('afterprint', () => {
                document.title = originalTitle;
            }, { once: true });
        } else {
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

                <div className="bg-white md:bg-white/40 md:backdrop-blur-sm rounded-3xl p-4 md:p-8 shadow-[0_0_15px_rgba(0,0,0,0.1)] md:shadow-[0_2px_12px_rgba(0,0,0,0.08)] mx-4 md:mx-0 min-h-[480px] flex flex-col justify-center">
                    <div className="mb-8 w-full max-w-lg md:max-w-md mx-auto text-right px-2 md:px-0">
                        <Input
                            placeholder='בחרו שם לקובץ קו"ח'
                            value={cvData.file_name || ''}
                            onChange={handleFileNameChange}
                            className="w-full h-12 bg-white border-gray-200 rounded-full px-6 text-right shadow-sm focus:border-blue-400 focus:ring-blue-400"
                            required
                        />
                    </div>

                    <div className="flex flex-row justify-between md:justify-center items-start gap-2 md:gap-8 px-2 md:px-0">
                        {/* Preview (Right on Mobile, Center on Desktop) */}
                        <div className="w-[240px] h-[338px] md:w-[450px] md:h-[636px] bg-transparent md:bg-white shadow-none md:shadow-xl rounded-lg md:rounded-2xl overflow-hidden border-none md:border md:border-gray-100 flex-shrink-0">
                            <div className="w-full h-full overflow-hidden bg-white relative">
                                {/* Scale down the preview on mobile to fit A4 specific dimensions into the container */}
                                <div className="md:w-full md:h-full md:block print:block origin-top-right transform scale-[0.31] w-[794px] min-h-[1123px] bg-white md:transform-none md:min-h-0 md:bg-transparent print:transform-none print:w-full print:h-full print:min-h-0">
                                    <CVPreview cvData={cvData} />
                                </div>
                            </div>
                        </div>

                        {/* Buttons (Left on Mobile, Left on Desktop) */}
                        <div className="flex flex-col gap-4">
                            {/* Edit Button: Custom for Mobile */}
                            <button onClick={onEdit} className="md:hidden transition-transform hover:scale-105 active:scale-95 focus:outline-none">
                                <img
                                    src={editCustomIcon}
                                    alt="ערוך"
                                    className="w-12 h-12 object-contain"
                                />
                            </button>
                            {/* Edit Button: Standard for Desktop */}
                            <Button
                                onClick={onEdit}
                                variant="outline"
                                size="icon"
                                className="hidden md:flex w-12 h-12 rounded-full border-blue-200 text-blue-500 shadow-sm bg-white hover:bg-blue-50"
                                title="עריכה"
                            >
                                <Edit className="w-6 h-6" />
                            </Button>

                            <Button onClick={handleDownload} variant="outline" size="icon" className="w-12 h-12 rounded-full border-[#3f93d3] md:border-[#3f93d3]/30 text-[#3f93d3] shadow-none md:shadow-sm bg-white hover:bg-blue-50" title="הורדה"><Download className="w-6 h-6" /></Button>
                            <Button onClick={() => setIsPreviewOpen(true)} variant="outline" size="icon" className="w-12 h-12 rounded-full border-[#3f93d3] md:border-[#3f93d3]/30 text-[#3f93d3] shadow-none md:shadow-sm bg-white hover:bg-blue-50" title="צפייה"><Eye className="w-6 h-6" /></Button>
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
                        className="fixed inset-0 bg-black/80 z-[100] flex items-start sm:items-center justify-center p-4 pt-20 sm:pt-4"
                        onClick={() => setIsPreviewOpen(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="relative bg-white rounded-2xl shadow-2xl w-full max-w-4xl h-[80vh] sm:h-[90vh] overflow-y-auto"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setIsPreviewOpen(false)}
                                className="absolute top-4 right-4 rounded-full z-10 bg-white/80 hover:bg-white shadow-sm border border-gray-100"
                            >
                                <X className="w-6 h-6" />
                            </Button>
                            <div className="w-full">
                                <CVPreview cvData={cvData} />
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Print Portal */}
            {isPrinting && createPortal(
                <div className="print-portal-root">
                    <CVPreview cvData={cvData} />
                </div>,
                document.body
            )}
        </>
    );
}
