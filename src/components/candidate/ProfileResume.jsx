import { Button } from "@/components/ui/button";
import { FileText } from 'lucide-react';

const ProfileResume = ({ resume_url, full_name, cvData, onViewCv }) => {
    const hasGeneratedCv = cvData && Object.keys(cvData).length > 0;

    return (
        <div className="w-full">
            <div className="w-full bg-white border border-gray-100 rounded-[1.2rem] p-3 flex items-center justify-between shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center gap-4 flex-1 justify-start">
                    {/* Custom PDF Icon - First in RTL = Rightmost */}
                    <div className={`w-12 h-14 rounded-lg flex flex-col items-center justify-center relative overflow-hidden shrink-0 ${resume_url ? 'bg-[#FF4444]' : (hasGeneratedCv ? 'bg-blue-500' : 'bg-gray-300')}`}>
                        {/* Folded corner effect */}
                        <div className="absolute top-0 right-0 w-4 h-4 bg-white/30 transform rotate-45 translate-x-2 -translate-y-2"></div>
                        <span className="text-white text-[10px] font-bold mt-auto mb-1">
                            {resume_url ? 'PDF' : (hasGeneratedCv ? 'CV' : 'PDF')}
                        </span>
                    </div>

                    <span className="text-gray-700 font-medium text-sm text-right truncate max-w-[200px] sm:max-w-md" dir="auto">
                        {resume_url
                            ? `${full_name || 'candidate'}_cv.pdf`
                            : (hasGeneratedCv ? 'קורות חיים דיגיטליים' : 'קורות חיים לא זמינים')
                        }
                    </span>
                </div>

                {resume_url ? (
                    <a
                        href={resume_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-500 font-medium hover:text-blue-600 transition-colors ml-4"
                    >
                        צפייה
                    </a>
                ) : hasGeneratedCv ? (
                    <button
                        onClick={onViewCv}
                        className="text-blue-500 font-medium hover:text-blue-600 transition-colors ml-4 hover:underline"
                    >
                        צפייה
                    </button>
                ) : (
                    <span className="text-gray-400 font-medium text-sm ml-4">קובץ לא זמין</span>
                )}
            </div>
        </div>
    );
};

export default ProfileResume;