import { Link } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import { createPageUrl } from "@/utils";
import settingsHeaderBg from "@/assets/settings_header_bg.png";

const InsightsHeader = () => (
    <div className="relative h-24 overflow-hidden -m-px">
        <div
            className="absolute inset-0 w-full h-full"
            style={{
                backgroundImage: `url(${settingsHeaderBg})`,
                backgroundSize: '100% 100%',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat'
            }}
        />
        <Link
            to={createPageUrl("Dashboard")}
            className="absolute top-4 right-6 w-10 h-10 bg-white/30 rounded-full flex items-center justify-center backdrop-blur-sm hover:bg-white/50 transition-colors z-10"
        >
            <ChevronLeft className="w-6 h-6 text-gray-800 rotate-180" />
        </Link>
    </div>
);

export default InsightsHeader;