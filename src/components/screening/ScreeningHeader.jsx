import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { createPageUrl } from "@/utils";
import settingsHeaderBg from "@/assets/settings_header_bg.png";

const ScreeningHeader = ({ backUrl }) => (
    <div className="relative">
        <div className="relative h-24 overflow-hidden -m-px">
            <div
                className="absolute inset-0 w-full h-full"
                style={{
                    backgroundImage: `url(${settingsHeaderBg})`,
                    backgroundSize: '100% 100%',
                    backgroundPosition: 'center',
                    backgroundRepeat: 'no-repeat'
                }} />
            <Link to={backUrl || createPageUrl("Profile")} className="absolute top-4 right-6 w-10 h-10 bg-white/30 rounded-full flex items-center justify-center backdrop-blur-sm hover:bg-white/50 transition-colors z-10">
                <ChevronRight className="w-6 h-6 text-gray-800 rotate-180" />
            </Link>
        </div>
        <div className="text-center mb-10">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">שאלון סינון</h1>
        </div>
    </div>
);

export default ScreeningHeader;