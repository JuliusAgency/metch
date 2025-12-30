import { useNavigate, useLocation } from "react-router-dom";
import { ChevronRight } from 'lucide-react';
import { createPageUrl } from "@/utils";

const ProfileHeader = () => {
    const navigate = useNavigate();
    const location = useLocation();

    const handleBack = () => {
        if (location.state?.from) {
            navigate(location.state.from);
        } else if (window.history.length > 1) {
            navigate(-1);
        } else {
            navigate(createPageUrl("Dashboard"));
        }
    };

    return (
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
            <button
                onClick={handleBack}
                className="absolute top-6 right-6 w-10 h-10 bg-white/60 rounded-full flex items-center justify-center backdrop-blur-sm hover:bg-white/80 transition-colors z-20 shadow-sm cursor-pointer border-none"
                aria-label="חזור"
            >
                <ChevronRight className="w-6 h-6 text-[#003566]" />
            </button>
        </div>
    );
};

export default ProfileHeader;