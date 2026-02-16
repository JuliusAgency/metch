import { Sparkles, MapPin, Briefcase, Clock, Calendar, GraduationCap, CheckCircle2, AlertCircle, XCircle, Loader2 } from 'lucide-react';

const ProfileInfo = ({ looking_for_summary, bio, aiThoughts, aiSummary, aiAnalysis, isLoading }) => {
    const getStatusIcon = (status) => {
        switch (status) {
            case 'match': return <CheckCircle2 className="w-4 h-4 text-green-500" />;
            case 'gap': return <AlertCircle className="w-4 h-4 text-orange-500" />;
            case 'mismatch': return <XCircle className="w-4 h-4 text-red-500" />;
            default: return <CheckCircle2 className="w-4 h-4 text-gray-400" />;
        }
    };

    const criteriaLabels = {
        professional_experience: { label: 'ניסיון מקצועי', icon: <Briefcase className="w-4 h-4" /> },
        location: { label: 'מיקום גיאוגרפי', icon: <MapPin className="w-4 h-4" /> },
        availability: { label: 'זמינות לעבודה', icon: <Clock className="w-4 h-4" /> },
        job_type: { label: 'סוג משרה', icon: <Calendar className="w-4 h-4" /> },
        career_fit: { label: 'התאמה לקריירה', icon: <GraduationCap className="w-4 h-4" /> }
    };

    const LoadingState = () => (
        <div className="flex items-center gap-2 text-gray-400 text-sm animate-pulse py-4">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>טוען נתונים...</span>
        </div>
    );

    // DEBUG: Log received props in ProfileInfo
    console.log("--------------------------------------------------");
    console.log("🧩 PROFILE INFO RECEIVED PROPS:");
    console.log("aiThoughts:", aiThoughts);
    console.log("aiSummary:", aiSummary);
    console.log("aiAnalysis:", aiAnalysis);
    console.log("--------------------------------------------------");

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full text-right" dir="rtl">
            {/* Right Card: What Metch Thinks (Checklist) */}
            <div className="bg-white p-5 rounded-2xl shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07)] border border-gray-100 flex flex-col items-start h-full" dir="rtl">
                <h3 className="font-bold text-base text-[#003566] mb-4 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-blue-500 shrink-0" />
                    מה מאצ' חושב
                </h3>
                <div className="w-full space-y-6">
                    {isLoading ? (
                        <LoadingState />
                    ) : aiAnalysis ? (
                        <div className="flex flex-col gap-4 w-full">
                            {Object.entries(aiAnalysis).map(([key, data]) => {
                                const labelConfig = criteriaLabels[key];
                                return (
                                    <div key={key} className="flex gap-3 items-start relative pr-3">
                                        {/* Blue Dot - Smaller and lighter */}
                                        <div className="absolute top-[0.6rem] right-0 w-1 h-1 rounded-full bg-blue-300 shrink-0" />

                                        {/* Content - Uniform text */}
                                        <div className="space-y-1">
                                            <p className="text-sm text-gray-500 leading-relaxed">
                                                <span className="text-gray-500 ml-1">
                                                    {labelConfig?.label || key}
                                                </span>
                                                {data.feedback}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <ul className="list-disc list-inside space-y-2 marker:text-blue-500 w-full text-right text-sm text-gray-600">
                            {aiThoughts?.map((thought, i) => (
                                <li key={i}>{thought}</li>
                            )) || "נתונים אינם זמינים כעת"}
                        </ul>
                    )}
                </div>
            </div>

            {/* Left Card: Candidate Summary */}
            <div className="bg-white p-5 rounded-2xl shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07)] border border-gray-100 flex flex-col items-start h-full" dir="rtl">
                <h3 className="font-bold text-base text-[#003566] mb-4">תמצית מועמד</h3>
                <div className="text-gray-600 text-sm leading-relaxed whitespace-pre-line w-full text-right">
                    {isLoading ? (
                        <LoadingState />
                    ) : (
                        aiSummary || bio || "נתונים אינם זמינים כעת"
                    )}
                </div>
            </div>
        </div>
    );
};

export default ProfileInfo;