import { Badge } from "@/components/ui/badge";
import {
    Briefcase,
    MapPin,
    Clock,
} from 'lucide-react';

const ProfileBadges = ({ jobTypeText, preferred_job_types, preferred_location, availabilityText, availability }) => (
    <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
        {preferred_job_types?.[0] && <Badge variant="outline" className="text-base border-gray-300"><Briefcase className="w-4 h-4 mr-2" />{jobTypeText[preferred_job_types[0]] || preferred_job_types[0]}</Badge>}
        {preferred_location && <Badge variant="outline" className="text-base border-gray-300"><MapPin className="w-4 h-4 mr-2" />{preferred_location}</Badge>}
        {availability && <Badge variant="outline" className="text-base border-gray-300"><Clock className="w-4 h-4 mr-2" />{availabilityText[availability] || availability}</Badge>}
    </div>
);

export default ProfileBadges;