import { Link } from "react-router-dom";
import { ChevronRight } from 'lucide-react';
import { createPageUrl } from "@/utils";

const ProfileHeader = () => (
    <div className="relative">
        <div className="relative h-24 overflow-hidden -m-px">
            <div
                className="absolute inset-0 w-full h-full [clip-path:ellipse(120%_100%_at_50%_100%)]"
                style={{
                    backgroundImage: 'url(https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/ca93821b0_image.png)',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center top',
                    backgroundRepeat: 'no-repeat'
                }}
            ></div>
            <Link to={createPageUrl("Dashboard")} className="absolute top-4 right-6 w-10 h-10 bg-white/30 rounded-full flex items-center justify-center backdrop-blur-sm hover:bg-white/50 transition-colors z-10">
                <ChevronRight className="w-6 h-6 text-gray-800" />
            </Link>
        </div>
    </div>
);

export default ProfileHeader;