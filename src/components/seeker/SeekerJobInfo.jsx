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
    const [activeTab, setActiveTab] = useState("about");

    const tryParse = (val) => {
        if (!val) return [];
        if (typeof val !== 'string') return val;
        try {
            let processed = val.trim();
            // Handle double stringification
            if (processed.startsWith('"') && processed.endsWith('"')) {
                try {
                    processed = JSON.parse(processed);
                } catch (e) {
                    // fall back to original
                }
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
        { id: "about", label: "על המשרה", icon: Info, content: job.description },
        { id: "requirements", label: "דרישות", icon: FileText, content: finalRequirements }
    ];

    if (showResponsibilities) {
        if (baseResponsibilities.length > 0) {
            sections.push({ id: "responsibilities", label: "תחומי אחריות", icon: ClipboardList, content: baseResponsibilities });
        }
        if (baseEducation.length > 0) {
            sections.push({ id: "education", label: "השכלה", icon: GraduationCap, content: baseEducation });
        }
        if (baseCertifications.length > 0) {
            sections.push({ id: "certifications", label: "הסמכות", icon: Award, content: baseCertifications });
        }
    }

    sections.push({ id: "apply", label: "הגשת מועמדות", icon: Send, content: "כאן ניתן להגיש מועמדות למשרה" });

    // Helper to render content based on type (string or array)
    const renderContent = (content) => {
        if (Array.isArray(content)) {
            // Filter out empty items
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
                            <div className="w-1 h-1 rounded-full bg-gray-400 mt-2.5 shrink-0"></div>
                            <span className="leading-relaxed">{typeof item === 'string' ? item : (item.value || item.label)}</span>
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
            {/* MOBILE: Tabs + Accordion */}
            <div className="md:hidden space-y-4">
                {/* Tabs Navigation */}
                <div className="sticky top-0 z-30 bg-white/80 backdrop-blur-sm -mx-4 px-4 py-2 border-b">
                    <div className="flex justify-between border-b overflow-x-auto no-scrollbar">
                        {sections.map((s) => (
                            <button
                                key={s.id}
                                onClick={() => setActiveTab(s.id)}
                                className={`pb-2 px-2 text-sm font-bold whitespace-nowrap transition-colors relative ${activeTab === s.id ? 'text-[#003566]' : 'text-gray-400'
                                    }`}
                            >
                                {s.label}
                                {activeTab === s.id && (
                                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-400 rounded-t-full" />
                                )}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Perks/Points Section below Navigation */}
                {perks && perks.length > 0 && (
                    <div className="pt-4 pb-2 px-2">
                        <SeekerJobPerks perks={perks} />
                    </div>
                )}

                {/* Accordion Sections */}
                <Accordion type="single" collapsible value={activeTab} onValueChange={setActiveTab} className="space-y-4">
                    {sections.map((s) => (
                        <AccordionItem
                            key={s.id}
                            value={s.id}
                            className="border rounded-2xl px-4 py-2 bg-white shadow-sm data-[state=open]:border-blue-400 data-[state=open]:ring-1 data-[state=open]:ring-blue-400 transition-all"
                        >
                            <AccordionTrigger className="hover:no-underline py-2">
                                <div className="flex items-center gap-3 w-full text-right">
                                    <s.icon className="w-5 h-5 text-gray-500" />
                                    <span className="font-bold text-lg text-[#003566] flex-1">{s.label}</span>
                                </div>
                            </AccordionTrigger>
                            <AccordionContent className="text-right">
                                {s.id === "apply" ? (
                                    <div className="pt-2 text-gray-500 italic">השתמש בכפתורי הפעולה למטה כדי להגיש מועמדות.</div>
                                ) : (
                                    renderContent(s.content)
                                )}
                            </AccordionContent>
                        </AccordionItem>
                    ))}
                </Accordion>

                {/* AI Thoughts (Metch Thoughts) - HIDDEN ON MOBILE */}
                {showAiAnalysis && (
                    <section className="hidden md:block mt-8 p-4 bg-blue-50/50 rounded-2xl space-y-3">
                        <h3 className="font-bold text-lg text-[#003566] flex items-center justify-end gap-2">
                            מה מאצ' חושב על ההתאמה?
                            <Sparkles className="w-5 h-5 text-blue-500 shrink-0" />
                        </h3>
                        <div className="text-[#4a5568] text-[15px] leading-relaxed text-right">
                            {isAiLoading ? (
                                <div className="space-y-2 animate-pulse">
                                    <div className="h-4 bg-gray-200/50 rounded w-full"></div>
                                    <div className="h-4 bg-gray-200/50 rounded w-5/6"></div>
                                </div>
                            ) : (
                                <p>{aiAnalysis?.why_suitable || aiAnalysis?.summary || "נתונים אינם זמינים כעת"}</p>
                            )}
                        </div>
                    </section>
                )}
            </div>

            {/* DESKTOP (Existing Original Design maintained for Desktop) */}
            <div className="hidden md:block bg-white md:border-0 md:shadow-[0_4px_25px_rgba(0,0,0,0.05)] rounded-[32px] overflow-hidden mb-8">
                <div className="p-12 space-y-12 text-right" dir="rtl">
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
                                    <p>{aiAnalysis?.why_suitable || aiAnalysis?.summary || "נתונים אינם זמינים כעת"}</p>
                                )}
                            </div>
                        </section>
                    )}

                    <section className="space-y-4">
                        <h3 className="font-bold text-xl text-[#003566]">תיאור משרה</h3>
                        <p className="text-[#4a5568] text-[15px] leading-relaxed whitespace-pre-wrap">
                            {job.description}
                        </p>
                    </section>

                    {sections.filter(s => s.id !== "about" && s.id !== "apply").map(s => (
                        <section key={s.id} className="space-y-4">
                            <h3 className="font-bold text-xl text-[#003566]">{s.label}</h3>
                            <div className="space-y-3">
                                {renderContent(s.content)}
                            </div>
                        </section>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default SeekerJobInfo;
