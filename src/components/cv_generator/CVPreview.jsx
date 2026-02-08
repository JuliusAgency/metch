
import React from 'react';
import { Mail, Phone, MapPin, Linkedin, Link as LinkIcon } from 'lucide-react';
import { format } from 'date-fns';
import certificationsList from '@/data/certifications.json';

const CERTIFICATION_LABELS = certificationsList.reduce((acc, curr) => {
    acc[curr.id] = curr.label;
    return acc;
}, {});

const EDUCATION_TYPE_LABELS = {
    high_school: 'לימודי תיכון',
    certificate: 'תעודה',
    bachelors: 'תואר ראשון',
    masters: 'תואר שני',
    phd: 'דוקטורט'
};

const parseDateValue = (value) => {
    const timestamp = Date.parse(value);
    return Number.isNaN(timestamp) ? null : timestamp;
};

const sortEducationEntries = (entries = []) =>
    [...entries].sort((a, b) => {
        if (a?.is_current && !b?.is_current) return -1;
        if (!a?.is_current && b?.is_current) return 1;

        const aEnd = parseDateValue(a?.end_date);
        const bEnd = parseDateValue(b?.end_date);

        if (aEnd !== bEnd) {
            return (bEnd ?? -Infinity) - (aEnd ?? -Infinity);
        }

        const aStart = parseDateValue(a?.start_date);
        const bStart = parseDateValue(b?.start_date);
        return (bStart ?? -Infinity) - (aStart ?? -Infinity);
    });

const getEducationTypeLabel = (type) => EDUCATION_TYPE_LABELS[type] || type || '';

const formatEnglishKey = (key) => {
    if (!key) return '';
    return key
        .split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
};

const getCertificationLabel = (cert) => {
    // If we have a Hebrew label in our list, use it
    if (CERTIFICATION_LABELS[cert.type]) return CERTIFICATION_LABELS[cert.type];
    if (CERTIFICATION_LABELS[cert.name]) return CERTIFICATION_LABELS[cert.name];

    // Otherwise, if the name looks like an English key, format it nicely
    if (cert.name && /^[a-z_]+$/.test(cert.name)) {
        return formatEnglishKey(cert.name);
    }

    return cert.name || '';
};

const CVPreview = ({ cvData }) => {
    const {
        personal_details = {},
        summary,
        work_experience = [],
        education: educationRaw = [],
        certifications = [],
        skills = []
    } = cvData || {};
    const educationEntries = sortEducationEntries(Array.isArray(educationRaw) ? educationRaw : []);

    const formatDate = (dateString) => {
        if (!dateString) return '';
        try {
            return format(new Date(dateString), 'MM/yyyy');
        } catch {
            return dateString;
        }
    };

    const formatDateRange = (item) => {
        const start = formatDate(item?.start_date);
        const end = item?.is_current ? 'היום' : formatDate(item?.end_date);
        if (!start && !end) return '';
        if (!start) return end;
        if (!end) return start;
        return `${start} - ${end}`;
    };

    return (
        <div className="p-8 bg-white text-gray-800 text-sm cv-print-area text-right" dir="rtl">
            <style>{`
                @page {
                    size: auto;
                    margin: 0mm;
                }
                @media print {
                    /* Hide the main app */
                    #root {
                        display: none !important;
                    }
                    
                    /* Show ONLY the portal content */
                    .print-portal-root {
                        display: block !important;
                        position: absolute;
                        top: 0;
                        left: 0;
                        width: 100%;
                        margin: 0;
                        padding: 0;
                        z-index: 9999;
                    }

                    html, body {
                        height: auto !important;
                        overflow: visible !important;
                        margin: 0 !important;
                        padding: 0 !important;
                        background: white !important;
                    }

                    .cv-print-area {
                        padding: 40px !important;
                        background: white !important;
                        min-height: 100vh;
                        width: 100%;
                    }
                    
                    /* Utility to hide elements marked as print:hidden inside the component */
                    .print\:hidden {
                        display: none !important;
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
            {
                summary && <div className="mb-4">
                    <h2 className="text-base font-bold border-b-2 border-blue-500 pb-1 mb-2">תמצית</h2>
                    <p className="text-xs text-gray-700">{summary}</p>
                </div>
            }

            {/* Work Experience */}
            {
                work_experience?.length > 0 && <div className="mb-4">
                    <h2 className="text-base font-bold border-b-2 border-blue-500 pb-1 mb-2">ניסיון תעסוקתי</h2>
                    <div className="space-y-3">
                        {work_experience.map((exp, index) => (
                            <div key={exp.id || index} className="text-xs">
                                <div className="flex justify-between items-baseline">
                                    <h3 className="font-semibold">{exp.title}</h3>
                                    <p className="text-gray-500">{formatDate(exp.start_date)} - {exp.is_current ? 'היום' : formatDate(exp.end_date)}</p>
                                </div>
                                <p className="font-medium text-gray-700">{exp.company} | {exp.location}</p>
                                <p className="mt-1 text-gray-600 whitespace-pre-wrap">{exp.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            }

            {/* Education */}
            {
                educationEntries.length > 0 && <div className="mb-4">
                    <h2 className="text-base font-bold border-b-2 border-blue-500 pb-1 mb-2">השכלה</h2>
                    <div className="space-y-3">
                        {educationEntries.map((edu, index) => {
                            const dateRange = formatDateRange(edu);
                            const subtitle = [edu?.degree, getEducationTypeLabel(edu?.education_type)]
                                .filter(Boolean)
                                .join(' • ');
                            return (
                                <div key={edu?.id || `education-${index}`} className="text-xs">
                                    <div className="flex justify-between items-baseline gap-3">
                                        <h3 className="font-semibold">{edu?.institution || 'מוסד לימודים'}</h3>
                                    </div>
                                    {subtitle && <p className="font-medium text-gray-700">{subtitle}</p>}
                                    {dateRange && <p className="text-gray-500">{dateRange}</p>}
                                    {edu?.description && <p className="mt-1 text-gray-600 whitespace-pre-wrap">{edu.description}</p>}
                                </div>
                            );
                        })}
                    </div>
                </div>
            }

            {/* Certifications */}
            {
                certifications?.length > 0 && <div className="mb-4">
                    <h2 className="text-base font-bold border-b-2 border-blue-500 pb-1 mb-2">הסמכות</h2>
                    <div className="space-y-3">
                        {certifications.map((cert, index) => (
                            <div key={cert.id || `cert-${index}`} className="text-xs">
                                <h3 className="font-semibold">{getCertificationLabel(cert)}</h3>
                                {cert.notes && <p className="mt-1 text-gray-600 whitespace-pre-wrap">{cert.notes}</p>}
                                {cert.description && <p className="mt-1 text-gray-600 whitespace-pre-wrap">{cert.description}</p>}
                            </div>
                        ))}
                    </div>
                </div>
            }

            {/* Skills */}
            {
                skills?.length > 0 && <div className="mb-4">
                    <h2 className="text-base font-bold border-b-2 border-blue-500 pb-1 mb-2">כישורים</h2>
                    <div className="flex flex-wrap gap-2">
                        {skills.map((skill, index) => (
                            <span key={index} className="bg-gray-100 px-2 py-1 rounded text-xs text-gray-700">
                                {skill}
                            </span>
                        ))}
                    </div>
                </div>
            }
        </div >
    );
};

export default CVPreview;
