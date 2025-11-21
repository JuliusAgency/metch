import { motion } from "framer-motion";
import { format } from "date-fns";

const SeekerConversationList = ({ conversations, handleConversationSelect }) => (
    <div className="space-y-4 mb-8">
        {Array.isArray(conversations) && conversations.map((conversation, index) => (
            <motion.div
                key={conversation.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                className={`flex items-center justify-between p-4 hover:bg-gray-50/80 rounded-xl cursor-pointer transition-colors border ${conversation.is_unread ? 'bg-blue-50 border-blue-200' : 'border-gray-100'
                    }`}
                onClick={() => handleConversationSelect(conversation)}
            >
                <div className="flex items-center gap-4">
                    <span className="text-gray-500 text-sm whitespace-nowrap">
                        {format(new Date(conversation.last_message_time), "dd.MM.yy")}
                    </span>
                    <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-gray-200 bg-white flex items-center justify-center">
                        {conversation.profileImage && conversation.profileImage !== "" ? (
                            <img
                                src={conversation.profileImage}
                                alt={conversation.employer_name}
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <div className="w-full h-full bg-gray-200 rounded-full flex items-center justify-center">
                                <span className="text-xs font-bold text-gray-600">
                                    {conversation.employer_name.slice(0, 2)}
                                </span>
                            </div>
                        )}
                    </div>
                    <div className="text-right">
                        <span className="font-medium text-gray-800 block">{conversation.employer_name}</span>
                        <span className="text-sm text-gray-500">{conversation.job_title}</span>
                    </div>
                </div>
            </motion.div>
        ))}
    </div>
);

export default SeekerConversationList;