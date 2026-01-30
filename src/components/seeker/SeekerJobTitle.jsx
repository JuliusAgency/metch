import { Badge } from "@/components/ui/badge";
import {
    MapPin,
    Clock,
    Briefcase,
} from "lucide-react";

const SeekerJobTitle = ({ job, employmentTypeText }) => (
    <div className="text-center mb-4 pt-[30px]" dir="rtl">
        <h1 className="text-2xl font-bold text-gray-900 mb-3">{job.title}</h1>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 px-2 max-w-lg mx-auto mb-1" dir="rtl">
            <Badge variant="outline" className="text-sm font-extrabold border-blue-100 text-blue-900 py-2 rounded-lg shadow-sm flex items-center justify-center gap-2 bg-white w-full">
                <MapPin className="w-4 h-4 text-blue-900 shrink-0" />
                {job.location}
            </Badge>
            <Badge variant="outline" className="text-sm font-extrabold border-blue-100 text-blue-900 py-2 rounded-lg shadow-sm flex items-center justify-center gap-2 bg-white w-full">
                <Briefcase className="w-4 h-4 text-blue-900 shrink-0" />
                {employmentTypeText[job.employment_type] || 'משרה מלאה'}
            </Badge>
            <Badge variant="outline" className="text-sm font-extrabold border-blue-100 text-blue-900 py-2 rounded-lg shadow-sm flex items-center justify-center gap-2 bg-white w-full">
                <Clock className="w-4 h-4 text-blue-900 shrink-0" />
                {job.start_date}
            </Badge>
        </div>

    </div>
);

export default SeekerJobTitle;