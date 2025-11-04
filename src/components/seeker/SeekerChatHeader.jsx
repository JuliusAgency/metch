import { ChevronLeft } from "lucide-react";

const SeekerChatHeader = ({ setSelectedConversation, selectedConversation }) => (
    <>
        <div className="relative h-24 overflow-hidden -m-px">
            <div
                className="absolute inset-0 w-full h-full [clip-path:ellipse(120%_100%_at_50%_100%)]"
                style={{
                    backgroundImage: 'url(https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/689c85a409a96fa6a10f1aca/d9fc7bd69_Rectangle6463.png)',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    backgroundRepeat: 'no-repeat'
                }}
            />
            <button
                onClick={() => setSelectedConversation(null)}
                className="absolute top-4 right-6 w-10 h-10 bg-white/30 rounded-full flex items-center justify-center backdrop-blur-sm hover:bg-white/50 transition-colors z-10"
            >
                <ChevronLeft className="w-6 h-6 text-gray-800 rotate-180" />
            </button>
        </div>
        <div className="text-center py-4 -mt-6 relative z-10">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">הודעות</h1>
            <p className="text-gray-600 mt-1">{selectedConversation.employer_name} - {selectedConversation.job_title}</p>
        </div>
    </>
);

export default SeekerChatHeader;