import {
  MapPin,
  DollarSign,
  Clock,
} from "lucide-react";
import { format } from "date-fns";

const JobInfo = ({ job }) => (
    <div className="bg-gray-50/80 p-6 rounded-xl">
        <h3 className="font-bold text-lg mb-4">פרטי המשרה</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-right">
            <div className="space-y-2">
                <div className="flex items-center justify-end gap-2">
                    <span>{job.location}</span>
                    <MapPin className="w-4 h-4 text-gray-500" />
                </div>
                <div className="flex items-center justify-end gap-2">
                    <span>{job.employment_type?.replace('_', ' ')}</span>
                    <Clock className="w-4 h-4 text-gray-500" />
                </div>
            </div>
            <div className="space-y-2">
                {(job.salary_min || job.salary_max) && (
                    <div className="flex items-center justify-end gap-2">
                        <span>
                            {job.salary_min && job.salary_max
                                ? `₪${job.salary_min.toLocaleString()} - ₪${job.salary_max.toLocaleString()}`
                                : job.salary_min
                                    ? `מ-₪${job.salary_min.toLocaleString()}`
                                    : `עד ₪${job.salary_max?.toLocaleString()}`
                            }
                        </span>
                        <DollarSign className="w-4 h-4 text-gray-500" />
                    </div>
                )}
                <div className="flex items-center justify-end gap-2">
                    <span>{format(new Date(job.created_date), "dd/MM/yyyy")}</span>
                    <Clock className="w-4 h-4 text-gray-500" />
                </div>
            </div>
        </div>

        <div className="mt-6">
            <h4 className="font-semibold mb-2">תיאור המשרה:</h4>
            <p className="text-gray-700 leading-relaxed">{job.description}</p>
        </div>

        {job.requirements && (
            <div className="mt-4">
                <h4 className="font-semibold mb-2">דרישות:</h4>
                <p className="text-gray-700 leading-relaxed">{job.requirements}</p>
            </div>
        )}
    </div>
);

export default JobInfo;