import { Link } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import { createPageUrl } from "@/utils";

const JobHeader = () => (
    <div className="relative h-24 overflow-hidden -m-px">
        <div
            className="absolute inset-0 w-full h-full [clip-path:ellipse(120%_100%_at_50%_100%)]"
            style={{
                backgroundImage: 'url(https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/ca93821b0_image.png)',
                backgroundSize: 'cover',
                backgroundPosition: 'center top'
            }}
        />
        <Link
            to={createPageUrl("JobManagement")}
            className="absolute top-4 right-6 w-10 h-10 bg-white/30 rounded-full flex items-center justify-center backdrop-blur-sm hover:bg-white/50 transition-colors z-10"
        >
            <ChevronLeft className="w-6 h-6 text-gray-800 rotate-180" />
        </Link>
    </div>
);

export default JobHeader;