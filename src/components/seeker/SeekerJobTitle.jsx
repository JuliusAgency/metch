import { Badge } from "@/components/ui/badge";
import {
    MapPin,
    Clock,
    Briefcase,
} from "lucide-react";

const SeekerJobTitle = ({ job, employmentTypeText }) => (
    <div className="text-center mb-4">
        <p className="text-lg text-gray-600 mb-1">{job.company}</p>
        <h1 className="text-2xl font-bold text-gray-900 mb-3">{job.title}</h1>

        <div className="flex justify-center items-center gap-3 mb-4">
            <Badge variant="outline" className="text-xs font-bold bg-blue-50 border-blue-100 text-blue-900 py-1.5 px-3 rounded-lg shadow-sm">
                <MapPin className="w-3.5 h-3.5 ml-1 text-blue-900" />
                {job.location}
            </Badge>
            <Badge variant="outline" className="text-xs font-bold bg-blue-50 border-blue-100 text-blue-900 py-1.5 px-3 rounded-lg shadow-sm">
                <Briefcase className="w-3.5 h-3.5 ml-1 text-blue-900" />
                {employmentTypeText[job.employment_type] || 'משרה מלאה'}
            </Badge>
            <Badge variant="outline" className="text-xs font-bold bg-blue-50 border-blue-100 text-blue-900 py-1.5 px-3 rounded-lg shadow-sm">
                <Clock className="w-3.5 h-3.5 ml-1 text-blue-900" />
                {job.start_date}
            </Badge>
        </div>

        <div className="max-w-xs mx-auto mb-4">
            <div className="text-center mb-1">
                <span className="text-base font-semibold text-gray-700">{job.match_score || 90}% התאמה</span>
            </div>
            <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                    className="h-full bg-green-500 transition-all duration-1000 rounded-full"
                    style={{ width: `${job.match_score || 90}%` }}
                ></div>
            </div>
        </div>
    </div>
);

export default SeekerJobTitle;