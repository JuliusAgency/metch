import React, { useState } from "react";
import { Sparkles, ChevronDown, Info, FileText, ClipboardList, Send } from "lucide-react";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import SeekerJobPerks from "./SeekerJobPerks";

const SeekerJobInfo = ({ job, aiAnalysis, isAiLoading, layout = 'stack', perks }) => {
    const [activeTab, setActiveTab] = useState("about");

    const sections = [
        { id: "about", label: "על המשרה", icon: Info, content: job.description },
        { id: "requirements", label: "דרישות", icon: FileText, content: job.requirements || job.structured_requirements },
        { id: "responsibilities", label: "תחומי אחריות", icon: ClipboardList, content: job.responsibilities || job.structured_education },
        { id: "apply", label: "הגשת מועמדות", icon: Send, content: "כאן ניתן להגיש מועמדות למשרה" }
    ];

    // Helper to render content based on type (string or array)
    const renderContent = (content) => {
        if (Array.isArray(content)) {
            return (
                <ul className="space-y-3 pt-2">
                    {content.map((item, i) => (
                        <li key={i} className="flex items-start gap-3 text-[#4a5568] text-[15px]">
                            <div className="w-1 h-1 rounded-full bg-gray-400 mt-2.5 shrink-0"></div>
                            <span className="leading-relaxed">{typeof item === 'string' ? item : item.value}</span>
                        </li>
                    ))}
                </ul>
            );
        }
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
            </div>

            {/* DESKTOP (Existing Original Design maintained for Desktop) */}
            <div className="hidden md:block bg-white md:border-0 md:shadow-[0_4px_25px_rgba(0,0,0,0.05)] rounded-[32px] overflow-hidden mb-8">
                <div className="p-12 space-y-12 text-right" dir="rtl">
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

                    <section className="space-y-4">
                        <h3 className="font-bold text-xl text-[#003566]">תיאור משרה</h3>
                        <p className="text-[#4a5568] text-[15px] leading-relaxed whitespace-pre-wrap">
                            {job.description}
                        </p>
                    </section>

                    {sections[2].content && (
                        <section className="space-y-4">
                            <h3 className="font-bold text-xl text-[#003566]">תחומי אחריות</h3>
                            <div className="space-y-3">
                                {renderContent(sections[2].content)}
                            </div>
                        </section>
                    )}

                    {sections[1].content && (
                        <section className="space-y-4">
                            <h3 className="font-bold text-xl text-[#003566]">דרישות</h3>
                            <div className="space-y-3">
                                {renderContent(sections[1].content)}
                            </div>
                        </section>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SeekerJobInfo;
