import { Badge } from "@/components/ui/badge";
import {
    MapPin,
    Clock,
    Briefcase,
} from "lucide-react";

const SeekerJobTitle = ({ job, employmentTypeText, showMatchScore = true }) => (
    <div className="text-center mb-3" dir="rtl">
        <h1 className={`text-xl font-bold text-gray-900 mb-3 ${!showMatchScore ? 'mt-6' : ''}`}>{job.title}</h1>

        {/* Badges - Light Blue with Sharp Corners */}
        <div className="flex flex-wrap justify-center gap-2 mb-3" dir="rtl">
            <div className="bg-blue-50 text-blue-900 px-3 py-1 rounded-md text-xs font-semibold flex items-center gap-1.5 border border-blue-100">
                <MapPin className="w-3 h-3" />
                {job.location}
            </div>
            <div className="bg-blue-50 text-blue-900 px-3 py-1 rounded-md text-xs font-semibold flex items-center gap-1.5 border border-blue-100">
                <Briefcase className="w-3 h-3" />
                {employmentTypeText[job.employment_type] || 'משרה מלאה'}
            </div>
            <div className="bg-blue-50 text-blue-900 px-3 py-1 rounded-md text-xs font-semibold flex items-center gap-1.5 border border-blue-100">
                <Clock className="w-3 h-3" />
                {AVAILABILITY_TRANSLATIONS[job.start_date] || job.start_date || 'מיידית'}
            </div>
        </div>

        {/* Match Score Bar - Dynamic color based on score */}
        {showMatchScore && (
            <div className="max-w-[240px] md:max-w-md mx-auto mb-3">
                <div className="relative w-full bg-gray-200 rounded-full h-3 md:h-6 overflow-hidden">
                    {(job.match_score ?? 0) > 0 && (
                        <div
                            className={`h-full rounded-full transition-all duration-500 ${(job.match_score ?? 0) >= 70
                                ? 'bg-green-400'
                                : (job.match_score ?? 0) >= 40
                                    ? 'bg-orange-400'
                                    : 'bg-red-500'
                                }`}
                            style={{ width: `${job.match_score ?? 0}%` }}
                        />
                    )}
                    <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-gray-900 font-bold text-[10px] md:text-xs whitespace-nowrap">
                            {job.match_score ?? 0}% ההתאמה
                        </span>
                    </div>
                </div>
            </div>
        )}
    </div>
);

const AVAILABILITY_TRANSLATIONS = {
    'immediate': 'מיידית',
    '1_2_weeks': 'שבוע עד שבועיים',
    'two_weeks': 'שבוע עד שבועיים',
    '1_2_months': 'חודש עד חודשיים',
    'months_1_2': 'חודש עד חודשיים',
    'months_2_1': 'חודש עד חודשיים',
    'one_month': 'חודש עד חודשיים',
    'negotiable': 'גמיש/ה',
    'flexible': 'גמיש/ה'
};

export default SeekerJobTitle;