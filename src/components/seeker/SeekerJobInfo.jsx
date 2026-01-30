import { Card, CardContent } from "@/components/ui/card";
import { Sparkles, CheckCircle2 } from "lucide-react";

const SeekerJobInfo = ({ job, aiAnalysis, isAiLoading, layout = 'stack' }) => {
    // Grid layout implementation
    if (layout === 'grid') {
        return (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-right" dir="rtl">
                {/* Column 1: Job Description ("על המשרה") - RIGHT */}
                <div className="space-y-4">
                    <h3 className="font-bold text-xl text-[#003566]">על המשרה</h3>
                    <p className="text-[#4a5568] text-[15px] leading-relaxed whitespace-pre-wrap">
                        {job.description}
                    </p>
                </div>

                {/* Column 2: Requirements - MIDDLE */}
                <div className="space-y-4">
                    {(job.requirements || (Array.isArray(job.structured_requirements) && job.structured_requirements.length > 0)) && (
                        <>
                            <h3 className="font-bold text-xl text-[#003566]">דרישות</h3>
                            <div className="space-y-3">
                                {Array.isArray(job.requirements) ? (
                                    job.requirements.map((req, i) => (
                                        <div key={i} className="flex items-start gap-3 text-[#4a5568] text-[15px]">
                                            <div className="w-1.5 h-1.5 rounded-full bg-[#3182ce]/50 mt-2 shrink-0"></div>
                                            <span className="leading-relaxed">{req}</span>
                                        </div>
                                    ))
                                ) : typeof job.requirements === 'string' && job.requirements.trim() ? (
                                    <p className="text-[#4a5568] text-[15px] leading-relaxed whitespace-pre-wrap">{job.requirements}</p>
                                ) : (
                                    job.structured_requirements?.map((req, i) => (
                                        <div key={i} className="flex items-start gap-3 text-[#4a5568] text-[15px]">
                                            <div className="w-1.5 h-1.5 rounded-full bg-[#3182ce]/50 mt-2 shrink-0"></div>
                                            <span className="leading-relaxed">{req.value}</span>
                                        </div>
                                    ))
                                )}
                            </div>
                        </>
                    )}
                </div>

                {/* Column 3: Responsibilities - LEFT */}
                <div className="space-y-4 flex flex-col">
                    {(job.responsibilities || (Array.isArray(job.structured_responsibilities) && job.structured_responsibilities.length > 0) || (Array.isArray(job.structured_education) && job.structured_education.length > 0)) && (
                        <div className="space-y-4 flex-1">
                            <h3 className="font-bold text-xl text-[#003566]">תחומי אחריות</h3>
                            <div className="space-y-3">
                                {Array.isArray(job.responsibilities) ? (
                                    job.responsibilities.map((res, i) => (
                                        <div key={i} className="flex items-start gap-3 text-[#4a5568] text-[15px]">
                                            <div className="w-1.5 h-1.5 rounded-full bg-[#3182ce]/50 mt-2 shrink-0"></div>
                                            <span className="leading-relaxed">{res}</span>
                                        </div>
                                    ))
                                ) : typeof job.responsibilities === 'string' && job.responsibilities.trim() ? (
                                    <p className="text-[#4a5568] text-[15px] leading-relaxed whitespace-pre-wrap">{job.responsibilities}</p>
                                ) : job.structured_responsibilities?.length > 0 ? (
                                    job.structured_responsibilities.map((res, i) => (
                                        <div key={i} className="flex items-start gap-3 text-[#4a5568] text-[15px]">
                                            <div className="w-1.5 h-1.5 rounded-full bg-[#3182ce]/50 mt-2 shrink-0"></div>
                                            <span className="leading-relaxed">{res.value}</span>
                                        </div>
                                    ))
                                ) : (
                                    job.structured_education?.map((res, i) => (
                                        <div key={i} className="flex items-start gap-3 text-[#4a5568] text-[15px]">
                                            <div className="w-1.5 h-1.5 rounded-full bg-[#3182ce]/50 mt-2 shrink-0"></div>
                                            <span className="leading-relaxed">{res.value}</span>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // Default 'stack' layout (original implementation)
    return (
        <Card className="bg-white border-0 shadow-[0_4px_25px_rgba(0,0,0,0.05)] rounded-[32px] overflow-hidden mb-8">
            <CardContent className="p-8 md:p-12 space-y-12 text-right" dir="rtl">

                {/* 1. Metch Thoughts (AI) */}
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
                                <div className="h-4 bg-gray-100 rounded w-4/6"></div>
                            </div>
                        ) : (
                            <p>{aiAnalysis?.why_suitable || aiAnalysis?.summary || "נתונים אינם זמינים כעת"}</p>
                        )}
                    </div>
                </section>

                {/* 2. Job Description */}
                <section className="space-y-4">
                    <h3 className="font-bold text-xl text-[#003566]">תיאור משרה</h3>
                    <p className="text-[#4a5568] text-[15px] leading-relaxed whitespace-pre-wrap">
                        {job.description}
                    </p>
                </section>

                {/* 3. Responsibilities */}
                {(job.responsibilities || (Array.isArray(job.structured_education) && job.structured_education.length > 0)) && (
                    <section className="space-y-4">
                        <h3 className="font-bold text-xl text-[#003566]">תחומי אחריות</h3>
                        <div className="space-y-3">
                            {Array.isArray(job.responsibilities) ? (
                                job.responsibilities.map((res, i) => (
                                    <div key={i} className="text-[#4a5568] text-[15px]">
                                        <span className="leading-relaxed">{res}</span>
                                    </div>
                                ))
                            ) : typeof job.responsibilities === 'string' && job.responsibilities.trim() ? (
                                <p className="text-[#4a5568] text-[15px] leading-relaxed whitespace-pre-wrap">{job.responsibilities}</p>
                            ) : (
                                job.structured_education?.map((edu, i) => (
                                    <div key={i} className="text-[#4a5568] text-[15px]">
                                        <span className="leading-relaxed">{edu.value}</span>
                                    </div>
                                ))
                            )}
                        </div>
                    </section>
                )}

                {/* 4. Requirements */}
                {(job.requirements || (Array.isArray(job.structured_requirements) && job.structured_requirements.length > 0)) && (
                    <section className="space-y-4">
                        <h3 className="font-bold text-xl text-[#003566]">דרישות</h3>
                        <div className="space-y-3">
                            {Array.isArray(job.requirements) ? (
                                job.requirements.map((req, i) => (
                                    <div key={i} className="flex items-start gap-3 text-[#4a5568] text-[15px]">
                                        <div className="w-1.5 h-1.5 rounded-full bg-[#3182ce]/50 mt-2 shrink-0"></div>
                                        <span className="leading-relaxed">{req}</span>
                                    </div>
                                ))
                            ) : typeof job.requirements === 'string' && job.requirements.trim() ? (
                                <p className="text-[#4a5568] text-[15px] leading-relaxed whitespace-pre-wrap">{job.requirements}</p>
                            ) : (
                                job.structured_requirements?.map((req, i) => (
                                    <div key={i} className="flex items-start gap-3 text-[#4a5568] text-[15px]">
                                        <div className="w-1.5 h-1.5 rounded-full bg-[#3182ce]/50 mt-2 shrink-0"></div>
                                        <span className="leading-relaxed">{req.value}</span>
                                    </div>
                                ))
                            )}
                        </div>
                    </section>
                )}

                {/* 5. Why Suitable (AI Highlights) */}
                <section className="space-y-4">
                    <h3 className="font-bold text-xl text-[#003566] flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-blue-500 shrink-0" />
                        למה המשרה מתאימה לך?
                    </h3>
                    <div className="text-[#4a5568] text-[15px] leading-relaxed">
                        {isAiLoading ? (
                            <div className="space-y-3 animate-pulse">
                                <div className="h-4 bg-gray-100 rounded w-full"></div>
                                <div className="h-4 bg-gray-100 rounded w-5/6"></div>
                                <div className="h-4 bg-gray-100 rounded w-4/6"></div>
                            </div>
                        ) : (
                            <p className="whitespace-pre-wrap">
                                {Array.isArray(aiAnalysis?.match_analysis)
                                    ? aiAnalysis.match_analysis.join('\n')
                                    : aiAnalysis?.why_suitable || "נתונים אינם זמינים כעת"}
                            </p>
                        )}
                    </div>
                </section>
            </CardContent>
        </Card>
    );
};

export default SeekerJobInfo;
