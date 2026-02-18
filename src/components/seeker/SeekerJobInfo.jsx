import React, { useState } from "react";
import { Sparkles, ChevronDown, Info, FileText, ClipboardList, Send, GraduationCap, Award } from "lucide-react";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import SeekerJobPerks from "./SeekerJobPerks";

const SeekerJobInfo = ({ job, aiAnalysis, isAiLoading, layout = 'stack', perks, showAiAnalysis = true, showResponsibilities = true }) => {
    const [activeTab, setActiveTab] = useState("match_analysis");

    const tryParse = (val) => {
        if (!val) return [];
        if (typeof val !== 'string') return val;
        try {
            let processed = val.trim();
            if (processed.startsWith('"') && processed.endsWith('"')) {
                try {
                    processed = JSON.parse(processed);
                } catch (e) { }
            }
            if (processed.startsWith('[') || processed.startsWith('{')) {
                return JSON.parse(processed);
            }
            return processed;
        } catch (e) {
            return val;
        }
    };

    const baseRequirements = tryParse(job.requirements || job.structured_requirements || []);
    const baseEducation = tryParse(job.structured_education || []);
    const baseCertifications = tryParse(job.structured_certifications || []);
    const baseResponsibilities = tryParse(job.responsibilities || []);

    const finalRequirements = showResponsibilities
        ? baseRequirements
        : [
            ...(Array.isArray(baseRequirements) ? baseRequirements : (baseRequirements ? [baseRequirements] : [])),
            ...(Array.isArray(baseResponsibilities) ? baseResponsibilities : (baseResponsibilities ? [baseResponsibilities] : [])),
            ...(Array.isArray(baseEducation) ? baseEducation : (baseEducation ? [baseEducation] : [])),
            ...(Array.isArray(baseCertifications) ? baseCertifications : (baseCertifications ? [baseCertifications] : []))
        ].filter(item => {
            if (typeof item === 'object' && item !== null) {
                return item.value && item.value.trim() !== "";
            }
            return item && item.trim() !== "";
        });

    const sections = [
        { id: "match_analysis", label: "מה מאצ' חושב?", icon: Sparkles, content: aiAnalysis?.match_analysis },
        { id: "about", label: "תיאור משרה", icon: Info, content: job.description },
        { id: "requirements", label: "דרישות", icon: FileText, content: finalRequirements }
    ];

    if (showResponsibilities) {
        if (baseCertifications.length > 0) {
            sections.push({ id: "certifications", label: "הסמכות", icon: Award, content: baseCertifications });
        }
    }

    // Add Why Suitable section for Mobile
    if (showAiAnalysis) {
        sections.push({
            id: "why_suitable",
            label: "למה זה מתאים לך?",
            icon: Sparkles,
            content: aiAnalysis?.why_suitable
        });
    }

    // Helper to render content based on type (string or array)
    const renderContent = (content) => {
        if (Array.isArray(content)) {
            const filteredContent = content.filter(item => {
                if (typeof item === 'object' && item !== null) {
                    return (item.value && item.value.trim() !== "") || (item.label && item.label.trim() !== "");
                }
                return item && typeof item === 'string' && item.trim() !== "";
            });

            if (filteredContent.length === 0) return null;

            return (
                <ul className="space-y-3 pt-2">
                    {filteredContent.map((item, i) => (
                        <li key={i} className="flex items-start gap-3 text-[#4a5568] text-[15px]">
                            <div className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-2.5 shrink-0"></div>
                            <span className="leading-relaxed">
                                {typeof item === 'string' ? item : (
                                    <>
                                        {item.value || item.label}
                                        {item.type === 'required' && <span className="mr-1"> - חובה</span>}
                                        {item.type === 'advantage' && <span className="mr-1"> - יתרון</span>}
                                    </>
                                )}
                            </span>
                        </li>
                    ))}
                </ul>
            );
        }
        if (!content || (typeof content === 'string' && content.trim() === "")) return null;
        return <p className="text-[#4a5568] text-[15px] leading-relaxed whitespace-pre-wrap pt-2">{content}</p>;
    };

    return (
        <div className="space-y-6">
            {/* MOBILE: Continuous List (No Tabs/Accordions) */}
            <div className="md:hidden space-y-8">
                {/* Perks/Points Section */}
                {perks && perks.length > 0 && (
                    <div className="pb-2">
                        <SeekerJobPerks perks={perks} compact={true} />
                    </div>
                )}

                {sections.map((s) => {
                    // specific check for AI sections to show loading or empty states correctly
                    if ((s.id === "match_analysis" || s.id === "why_suitable") && !isAiLoading && !s.content) return null;
                    if (s.id !== "match_analysis" && s.id !== "why_suitable" && (!s.content || (Array.isArray(s.content) && s.content.length === 0))) return null;

                    return (
                        <div key={s.id} className="space-y-3">
                            <h3 className="font-bold text-xl text-[#003566] flex items-center gap-2">
                                {(s.id === "match_analysis" || s.id === "why_suitable") && (
                                    <s.icon className={`w-5 h-5 ${s.iconColor || 'text-blue-500'}`} />
                                )}
                                {s.label}
                            </h3>
                            <div className="text-[#4a5568] text-[15px] leading-relaxed text-right">
                                {(s.id === "match_analysis" || s.id === "why_suitable") && isAiLoading ? (
                                    <div className="space-y-2 animate-pulse pt-2">
                                        <div className="h-4 bg-gray-200/50 rounded w-full"></div>
                                        <div className="h-4 bg-gray-200/50 rounded w-5/6"></div>
                                    </div>
                                ) : (s.id === "why_suitable" && !s.content) ? (
                                    <p className="text-[#4a5568] text-[15px] leading-relaxed whitespace-pre-wrap pt-2">
                                        {aiAnalysis?.summary || "נתונים אינם זמינים כעת"}
                                    </p>
                                ) : (
                                    renderContent(s.content)
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* DESKTOP (Reordered Layout) */}
            <div className="hidden md:block bg-white md:border-0 md:shadow-[0_4px_25px_rgba(0,0,0,0.05)] rounded-[32px] overflow-hidden mb-8">
                <div className="p-12 space-y-12 text-right" dir="rtl">

                    {/* 1. AI Match Highlights (What Metch Thinks - Bullets) */}
                    {showAiAnalysis && (
                        <section className="space-y-4">
                            <h3 className="font-bold text-xl text-[#003566] flex items-center gap-2">
                                <Sparkles className="w-5 h-5 text-blue-500 shrink-0" />
                                מה מאצ' חושב על ההתאמה?
                            </h3>
                            <div className="text-[#4a5568] text-[15px] leading-relaxed">
                                {isAiLoading ? (
                                    <div className="space-y-3 animate-pulse">
                                        <div className="h-4 bg-gray-100 rounded w-full"></div>
                                        <div className="h-4 bg-gray-100 rounded w-5/6"></div>
                                    </div>
                                ) : (
                                    aiAnalysis?.match_analysis && Array.isArray(aiAnalysis.match_analysis) ? (
                                        <ul className="space-y-3">
                                            {aiAnalysis.match_analysis.map((item, i) => (
                                                <li key={i} className="flex items-start gap-3">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-2 shrink-0"></div>
                                                    <span>{item}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    ) : (
                                        <p className="whitespace-pre-wrap">{aiAnalysis?.match_analysis || aiAnalysis?.why_suitable || "נתונים אינם זמינים כעת"}</p>
                                    )
                                )}
                            </div>
                        </section>
                    )}

                    {/* 2. Job Description */}
                    <section className="space-y-4">
                        <h3 className="font-bold text-xl text-[#003566]">תיאור משרה</h3>
                        <p className="text-[#4a5568] text-[15px] leading-relaxed whitespace-pre-wrap">
                            {job.description}
                        </p>
                    </section>

                    {/* 3. Requirements */}
                    {finalRequirements && finalRequirements.length > 0 && (
                        <section className="space-y-4">
                            <h3 className="font-bold text-xl text-[#003566]">דרישות</h3>
                            <div className="space-y-3">
                                {renderContent(finalRequirements)}
                            </div>
                        </section>
                    )}

                    {/* 4. Certifications */}
                    {baseCertifications && baseCertifications.length > 0 && (
                        <section className="space-y-4">
                            <h3 className="font-bold text-xl text-[#003566]">הסמכות</h3>
                            <div className="space-y-3">
                                {renderContent(baseCertifications)}
                            </div>
                        </section>
                    )}

                    {/* 5. Why it fits you (AI Reasoning - Text) */}
                    {showAiAnalysis && (
                        <section className="space-y-4">
                            <h3 className="font-bold text-xl text-[#003566] flex items-center gap-2">
                                <Sparkles className="w-5 h-5 text-[#3d83f6] shrink-0" />
                                למה המשרה מתאימה לך?
                            </h3>
                            <div className="text-[#4a5568] text-[15px] leading-relaxed whitespace-pre-wrap">
                                {isAiLoading ? (
                                    <div className="space-y-3 animate-pulse">
                                        <div className="h-4 bg-gray-100 rounded w-full"></div>
                                        <div className="h-4 bg-gray-100 rounded w-5/6"></div>
                                        <div className="h-4 bg-gray-100 rounded w-2/3"></div>
                                    </div>
                                ) : (
                                    aiAnalysis?.why_suitable || aiAnalysis?.summary || "נתונים אינם זמינים כעת"
                                )}
                            </div>
                        </section>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SeekerJobInfo;
