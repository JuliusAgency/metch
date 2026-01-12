import { ChevronRight } from "lucide-react";

const ChatHeader = ({ setSelectedConversation, selectedConversation, ConversationStatusIndicator }) => (
    <>
        <div className="relative h-4" />
        <div className="text-center py-0 -mt-2 relative z-10 space-y-0 text-sm">
            <h1 className="text-lg md:text-xl font-bold text-[#001a6e]">
                {selectedConversation.candidate_name || "מועמד"}
            </h1>
            <div className="flex justify-center items-center gap-2 text-sm text-gray-600">
                <span>
                    {selectedConversation.is_support
                        ? selectedConversation.job_title
                        : `מועמד למשרת: ${selectedConversation.job_title}`}
                </span>
                {selectedConversation.job_location && (
                    <>
                        <span>•</span>
                        <span>{selectedConversation.job_location}</span>
                    </>
                )}
                <ConversationStatusIndicator jobStatus={selectedConversation.job_status} />
            </div>
        </div>
    </>
);

export default ChatHeader;