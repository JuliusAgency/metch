import { Link } from "react-router-dom";
import { ChevronRight } from 'lucide-react';
import { createPageUrl } from "@/utils";

const ProfileHeader = () => (
    <div className="relative w-full h-40 md:h-48 overflow-hidden">
        <div
            className="absolute inset-0 w-full h-full"
            style={{
                backgroundImage: 'url(https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/ca93821b0_image.png)',
                backgroundSize: 'cover',
                backgroundPosition: 'center top',
                backgroundRepeat: 'no-repeat',
                clipPath: "ellipse(120% 100% at 50% 0%)"
            }}
        ></div>
        <Link
            to={createPageUrl("Dashboard")}
            className="absolute top-6 right-6 w-10 h-10 bg-white/60 rounded-full flex items-center justify-center backdrop-blur-sm hover:bg-white/80 transition-colors z-20 shadow-sm"
        >
            <ChevronRight className="w-6 h-6 text-[#003566]" />
        </Link>
    </div>
);

export default ProfileHeader;