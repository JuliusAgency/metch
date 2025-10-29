import { Badge } from "@/components/ui/badge";
import { Building2 } from "lucide-react";

const JobTitle = ({ title, company, statusConfig, status }) => {
    const config = statusConfig[status] || statusConfig.active;

    return (
        <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-blue-200 rounded-full flex items-center justify-center mx-auto">
                <Building2 className="w-8 h-8 text-blue-600" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900">{title}</h1>
            <p className="text-xl text-gray-600">{company}</p>
            <Badge className={config.color}>{config.label}</Badge>
        </div>
    );
};

export default JobTitle;