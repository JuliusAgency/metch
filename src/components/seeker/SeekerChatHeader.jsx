import { ChevronRight } from "lucide-react";

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
            <div className="relative h-4" />
            <div className="text-center py-0 -mt-2 relative z-10 space-y-0 text-sm">
                <h1 className="text-lg md:text-xl font-bold text-[#001a6e]">
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