import { ChevronRight } from "lucide-react";
import settingsHeaderBg from "@/assets/settings_header_bg.png";

const ChatHeader = ({ setSelectedConversation, selectedConversation, ConversationStatusIndicator }) => (
    <>
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
            <button
                onClick={() => setSelectedConversation(null)}
                className="absolute top-4 right-6 w-10 h-10 bg-white/30 rounded-full flex items-center justify-center backdrop-blur-sm hover:bg-white/50 transition-colors z-20"
            >
                <ChevronRight className="w-6 h-6 text-gray-800" />
            </button>
        </div>
        <div className="text-center py-4 -mt-6 relative z-10 space-y-2">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">הודעות</h1>
            <div className="flex justify-center items-center gap-2">
                <span className="text-sm text-gray-600">{selectedConversation.job_title}</span>
                <ConversationStatusIndicator jobStatus={selectedConversation.job_status} />
            </div>
        </div>
    </>
);

export default ChatHeader;