
import React, { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Mail, Phone, MapPin, Linkedin, Link as LinkIcon, Edit, Download, Eye, X } from 'lucide-react';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';

const CVContent = ({ cvData }) => {
    const { personal_details, summary, work_experience, education, certifications, skills } = cvData;

    const formatDate = (dateString) => {
        if (!dateString) return '';
        try {
            return format(new Date(dateString), 'MM/yyyy');
        } catch {
            return dateString;
        }
    };
    
    return (
        <div className="p-8 bg-white text-gray-800 text-sm cv-print-area">
             <style>{`
                @media print {
                    body * {
                        visibility: hidden;
                    }
                    .cv-print-area, .cv-print-area * {
                        visibility: visible;
                    }
                    .cv-print-area {
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: 100%;
                    }
                }
            `}</style>
            {/* Header */}
            <div className="text-center border-b pb-4 mb-4">
                <h1 className="text-2xl font-bold">{personal_details.full_name}</h1>
                <div className="flex justify-center items-center flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-gray-600">
                    {personal_details.email && <div className="flex items-center gap-1"><Mail className="w-3 h-3" />{personal_details.email}</div>}
                    {personal_details.phone && <div className="flex items-center gap-1"><Phone className="w-3 h-3" />{personal_details.phone}</div>}
                    {personal_details.address && <div className="flex items-center gap-1"><MapPin className="w-3 h-3" />{personal_details.address}</div>}
                </div>
                <div className="flex justify-center items-center gap-3 mt-2 text-xs text-blue-600">
                   {personal_details.linkedin_url && <a href={personal_details.linkedin_url} target="_blank" rel="noreferrer" className="flex items-center gap-1 hover:underline"><Linkedin className="w-3 h-3" />LinkedIn</a>}
                   {personal_details.portfolio_url && <a href={personal_details.portfolio_url} target="_blank" rel="noreferrer" className="flex items-center gap-1 hover:underline"><LinkIcon className="w-3 h-3" />Portfolio</a>}
                </div>
            </div>

            {/* Summary */}
            {summary && <div className="mb-4">
                <h2 className="text-base font-bold border-b-2 border-blue-500 pb-1 mb-2">תמצית</h2>
                <p className="text-xs text-gray-700">{summary}</p>
            </div>}

            {/* Work Experience */}
            {work_experience?.length > 0 && <div className="mb-4">
                <h2 className="text-base font-bold border-b-2 border-blue-500 pb-1 mb-2">ניסיון תעסוקתי</h2>
                <div className="space-y-3">
                    {work_experience.map(exp => (
                        <div key={exp.id} className="text-xs">
                            <div className="flex justify-between items-baseline">
                                <h3 className="font-semibold">{exp.title}</h3>
                                <p className="text-gray-500">{formatDate(exp.start_date)} - {exp.is_current ? 'היום' : formatDate(exp.end_date)}</p>
                            </div>
                            <p className="font-medium text-gray-700">{exp.company} | {exp.location}</p>
                            <p className="mt-1 text-gray-600 whitespace-pre-wrap">{exp.description}</p>
                        </div>
                    ))}
                </div>
            </div>}
            {/* Other sections can be added here following the same pattern */}
        </div>
    );
};

export default function Step7_Preview({ cvData, setData, onEdit }) {
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);

    const handleFileNameChange = (e) => {
        setData(prev => ({...prev, file_name: e.target.value }));
    };

    const handleDownload = () => {
        window.print();
    };

    return (
        <>
        <div className="max-w-4xl mx-auto text-center" dir="rtl">
            <div className="mb-10">
                <h2 className="text-3xl font-bold text-gray-900 mb-3">צפייה בקורות חיים</h2>
                <p className="text-gray-600 max-w-lg mx-auto">בחלק הזה תעברו על קורות החיים ותוכלו לערוך במידת הצורך או לחזור אחורה ולתקן את אחד מהחלקים</p>
            </div>

            <div className="mb-8 max-w-md mx-auto">
                 <Input
                    placeholder="בחרו שם לקובץ קורות החיים"
                    value={cvData.file_name || ''}
                    onChange={handleFileNameChange}
                    className="w-full h-12 bg-white border-gray-200 rounded-full px-6 text-right shadow-sm focus:border-blue-400 focus:ring-blue-400"
                />
            </div>
            
            <div className="flex justify-center items-start gap-6">
                <div className="flex flex-col gap-4 pt-8">
                    <Button onClick={onEdit} variant="outline" size="icon" className="w-12 h-12 rounded-full border-gray-300 shadow-sm"><Edit className="w-6 h-6 text-gray-600" /></Button>
                    <Button onClick={handleDownload} variant="outline" size="icon" className="w-12 h-12 rounded-full border-gray-300 shadow-sm"><Download className="w-6 h-6 text-gray-600" /></Button>
                    <Button onClick={() => setIsPreviewOpen(true)} variant="outline" size="icon" className="w-12 h-12 rounded-full border-gray-300 shadow-sm"><Eye className="w-6 h-6 text-gray-600" /></Button>
                </div>
                
                <div className="w-[450px] h-[636px] bg-white shadow-2xl rounded-lg overflow-hidden border">
                    <CVContent cvData={cvData} />
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
                        <CVContent cvData={cvData} />
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
        </>
    );
}
