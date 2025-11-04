import { Badge } from "@/components/ui/badge";
import {
  MapPin,
  Clock,
  Briefcase,
} from "lucide-react";

const SeekerJobTitle = ({ job, employmentTypeText }) => (
    <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">{job.title}</h1>

        <div className="flex justify-center items-center gap-6 mb-6">
            <Badge variant="outline" className="text-sm font-medium border-gray-300 text-gray-700 py-1 px-3">
                <MapPin className="w-4 h-4 ml-1.5" />
                {job.location}
            </Badge>
            <Badge variant="outline" className="text-sm font-medium border-gray-300 text-gray-700 py-1 px-3">
                <Briefcase className="w-4 h-4 ml-1.5" />
                {employmentTypeText[job.employment_type] || 'משרה מלאה'}
            </Badge>
            <Badge variant="outline" className="text-sm font-medium border-gray-300 text-gray-700 py-1 px-3">
                <Clock className="w-4 h-4 ml-1.5" />
                {job.start_date}
            </Badge>
        </div>

        <div className="max-w-md mx-auto mb-6">
            <div className="text-center mb-2">
                <span className="text-lg font-semibold text-gray-700">{job.match_score || 90}% התאמה</span>
            </div>
            <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                <div
                    className="h-full bg-green-500 transition-all duration-1000 rounded-full"
                    style={{ width: `${job.match_score || 90}%` }}
                ></div>
            </div>
        </div>
    </div>
);

export default SeekerJobTitle;