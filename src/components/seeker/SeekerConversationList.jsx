import { motion } from "framer-motion";
import { format } from "date-fns";

const SeekerConversationList = ({ conversations, handleConversationSelect }) => {
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

    return (
        <div className="space-y-1.5 mb-6 max-w-4xl mx-auto px-4 sm:px-8">
            {Array.isArray(conversations) && conversations.map((conversation, index) => {
                const statusBadge = getStatusBadge(conversation.job_status);

                return (
                    <motion.div
                        key={conversation.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.1 }}
                        className={`flex items-center justify-between p-4 hover:bg-gray-50/80 rounded-xl cursor-pointer transition-colors border h-16 ${conversation.is_unread ? 'bg-blue-50 border-blue-200' : 'border-gray-100 shadow-sm'
                            }`}
                        onClick={() => handleConversationSelect(conversation)}
                    >
                        <div className="flex items-center gap-4">
                            <span className="text-gray-500 text-xs whitespace-nowrap">
                                {format(new Date(conversation.last_message_time), "dd.MM.yy")}
                            </span>
                            <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-gray-200 bg-white flex items-center justify-center">
                                {conversation.profileImage && conversation.profileImage !== "" ? (
                                    <img
                                        src={conversation.profileImage}
                                        alt={conversation.employer_name}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full bg-gray-200 rounded-full flex items-center justify-center">
                                        <span className="text-[10px] font-bold text-gray-600">
                                            {conversation.employer_name.slice(0, 2)}
                                        </span>
                                    </div>
                                )}
                            </div>
                            <div className="text-right">
                                <span className="font-medium text-gray-800 block text-sm">{conversation.employer_name}</span>
                                <div className="flex items-center gap-2">
                                    <span className="text-xs text-gray-500">{conversation.job_title}</span>
                                    {statusBadge.label && (
                                        <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-medium ${statusBadge.color}`}>
                                            {statusBadge.label}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </motion.div>
                );
            })}
        </div>
    );
};

export default SeekerConversationList;