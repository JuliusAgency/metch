import { Sparkles, Loader2 } from 'lucide-react';

const ProfileInfo = ({ looking_for_summary, bio, aiThoughts, aiSummary, isLoading }) => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full text-right">
        <div className="bg-white p-4 rounded-2xl shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07)] border border-gray-100 flex flex-col items-start h-full">
            <h3 className="font-bold text-base text-[#003566] mb-3 flex items-center gap-2">
                מה מאצ' חושב
                <Sparkles className="w-4 h-4 text-blue-500" />
            </h3>
            <div className="text-gray-600 text-sm leading-relaxed whitespace-pre-line w-full">
                {isLoading ? (
                    <div className="flex flex-col gap-2 animate-pulse">
                        <div className="h-4 bg-gray-100 rounded w-3/4"></div>
                        <div className="h-4 bg-gray-100 rounded w-1/2"></div>
                        <div className="h-4 bg-gray-100 rounded w-5/6"></div>
                    </div>
                ) : aiThoughts && aiThoughts.length > 0 ? (
                    <ul className="list-disc list-inside space-y-2 marker:text-blue-500">
                        {aiThoughts.map((thought, i) => (
                            <li key={i}>{thought}</li>
                        ))}
                    </ul>
                ) : (
                    "נתונים אינם זמינים כעת"
                )}
            </div>
        </div>
        <div className="bg-white p-4 rounded-2xl shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07)] border border-gray-100 flex flex-col items-start h-full">
            <h3 className="font-bold text-base text-[#003566] mb-3">תמצית מועמד</h3>
            <div className="text-gray-600 text-sm leading-relaxed whitespace-pre-line w-full">
                {isLoading ? (
                    <div className="flex flex-col gap-2 animate-pulse">
                        <div className="h-4 bg-gray-100 rounded w-full"></div>
                        <div className="h-4 bg-gray-100 rounded w-full"></div>
                        <div className="h-4 bg-gray-100 rounded w-3/4"></div>
                        <div className="h-4 bg-gray-100 rounded w-5/6"></div>
                    </div>
                ) : (
                    aiSummary || bio || "נתונים אינם זמינים כעת"
                )}
            </div>
        </div>
    </div>
);

export default ProfileInfo;