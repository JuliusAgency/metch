import { Badge } from "@/components/ui/badge";
import {
    Briefcase,
    MapPin,
    Clock,
} from 'lucide-react';

const ProfileBadges = ({ jobTypeText, preferred_job_types, preferred_location, availabilityText, availability }) => (
    <div className="flex flex-wrap items-center justify-center gap-2 mt-1">
        {preferred_location && <Badge variant="secondary" className="px-3 py-1.5 text-sm font-bold bg-[#E2F0F9] text-[#003566] hover:bg-[#d0e6f5] rounded-lg border-0 shadow-sm flex items-center gap-1.5"><MapPin className="w-4 h-4" />{preferred_location}</Badge>}
        {preferred_job_types?.[0] && <Badge variant="secondary" className="px-3 py-1.5 text-sm font-bold bg-[#E2F0F9] text-[#003566] hover:bg-[#d0e6f5] rounded-lg border-0 shadow-sm flex items-center gap-1.5"><Briefcase className="w-4 h-4" />{jobTypeText[preferred_job_types[0]] || preferred_job_types[0]}</Badge>}
        {availability && <Badge variant="secondary" className="px-3 py-1.5 text-sm font-bold bg-[#E2F0F9] text-[#003566] hover:bg-[#d0e6f5] rounded-lg border-0 shadow-sm flex items-center gap-1.5"><Clock className="w-4 h-4" />{availabilityText[availability] || availability}</Badge>}
    </div>
);

export default ProfileBadges;