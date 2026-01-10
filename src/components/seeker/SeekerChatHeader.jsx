import { ChevronRight } from "lucide-react";
import settingsHeaderBg from "@/assets/settings_header_bg.png";

const SeekerChatHeader = ({ setSelectedConversation, selectedConversation }) => {
    const getStatusBadge = (status) => {
        const statuses = {
            'active': { label: 'פעילה', color: 'bg-green-100 text-green-800' },
            'open': { label: 'פתוחה', color: 'bg-green-100 text-green-800' },
            'closed': { label: 'סגורה', color: 'bg-red-100 text-red-800' },
            'filled': { label: 'אויישה', color: 'bg-blue-100 text-blue-800' },
            'filled_via_metch': { label: 'אויישה דרך המערכת', color: 'bg-blue-100 text-blue-800' },
            'paused': { label: 'מושהית', color: 'bg-yellow-100 text-yellow-800' },
            'unknown': { label: '', color: '' }
        };
        return statuses[status] || statuses['unknown'];
    };

    const statusBadge = getStatusBadge(selectedConversation.job_status);

    return (
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
                    className="absolute top-4 right-6 w-10 h-10 bg-white/30 rounded-full flex items-center justify-center backdrop-blur-sm hover:bg-white/50 transition-colors z-[60]"
                >
                    <ChevronRight className="w-6 h-6 text-gray-800" />
                </button>
            </div>
            <div className="text-center py-1 -mt-6 relative z-10 space-y-1">
                <h1 className="text-2xl md:text-3xl font-bold text-[#001a6e]">
                    {selectedConversation.employer_name || "מעסיק"}
                </h1>
                <div className="flex justify-center items-center gap-2 text-sm text-gray-600">
                    <span>
                        {selectedConversation.is_support
                            ? selectedConversation.job_title
                            : `מגייס לתפקיד: ${selectedConversation.job_title}`}
                    </span>
                    {selectedConversation.job_location && (
                        <>
                            <span>•</span>
                            <span>{selectedConversation.job_location}</span>
                        </>
                    )}
                    {statusBadge.label && (
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusBadge.color}`}>
                            {statusBadge.label}
                        </span>
                    )}
                </div>
            </div>
        </>
    );
};

export default SeekerChatHeader;