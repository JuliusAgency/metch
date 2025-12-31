import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { createPageUrl } from "@/utils";

const QuestionnaireHeader = ({ jobId }) => (
    <div className="relative">
        <div className="relative h-24 overflow-hidden -m-px">
            <div
                className="absolute inset-0 w-full h-full [clip-path:ellipse(120%_110%_at_50%_100%)]"
                style={{
                  backgroundImage: 'url(https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/689c85a409a96fa6a10f1aca/d9fc7bd69_Rectangle6463.png)',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  backgroundRepeat: 'no-repeat'
                }}
            />
            <Link to={createPageUrl(`JobDetailsSeeker?id=${jobId}`)} className="absolute top-4 right-6 w-10 h-10 bg-white/30 rounded-full flex items-center justify-center backdrop-blur-sm hover:bg-white/50 transition-colors z-10">
                <ChevronRight className="w-6 h-6 text-gray-800 rotate-180" />
            </Link>
        </div>
    </div>
);

export default QuestionnaireHeader;