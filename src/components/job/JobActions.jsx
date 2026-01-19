import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Edit,
  Pause,
  Play,
  Copy,
  ClipboardList,
  Users
} from "lucide-react";
import { createPageUrl } from "@/utils";

const JobActions = ({ job, handleStatusChange, applications }) => (
    <div className="flex flex-wrap justify-center gap-3">
        <Link to={createPageUrl(`CreateJob?id=${job.id}`)}>
            <Button variant="outline" className="border-gray-300 hover:bg-gray-100">
                <Edit className="w-4 h-4 ml-2" />
                עריכת משרה
            </Button>
        </Link>
        {job.status === 'active' ? (
            <Button
                variant="outline"
                className="border-yellow-300 hover:bg-yellow-100"
                onClick={() => handleStatusChange('paused')}
            >
                <Pause className="w-4 h-4 ml-2" />
                השהה משרה
            </Button>
        ) : (
            <Button
                variant="outline"
                className="border-green-300 hover:bg-green-100"
                onClick={() => handleStatusChange('active')}
            >
                <Play className="w-4 h-4 ml-2" />
                פעל משרה
            </Button>
        )}
        <Button
            variant="outline"
            className="border-blue-300 hover:bg-blue-100"
        >
            <Copy className="w-4 h-4 ml-2" />
            שכפל משרה
        </Button>
        <Link to={createPageUrl("JobScreeningQuestionnaire", { id: job.id })}>
            <Button variant="outline" className="border-purple-300 hover:bg-purple-100">
                <ClipboardList className="w-4 h-4 ml-2" />
                שאלון סינון
            </Button>
        </Link>
        <Link to={createPageUrl(`JobApplications?job_id=${job.id}`)}>
            <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                <Users className="w-4 h-4 ml-2" />
                צפייה במועמדים ({applications.length})
            </Button>
        </Link>
    </div>
);

export default JobActions;