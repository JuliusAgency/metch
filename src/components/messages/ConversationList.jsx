import { motion } from "framer-motion";
import { format } from "date-fns";
import ConversationStatusIndicator from "@/components/conversations/ConversationStatusIndicator";

const ConversationList = ({ conversations, selectConversation }) => (
    <div className="space-y-4 mb-8">
        {conversations.map((conversation, index) => (
            <motion.div
                key={conversation.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                className="flex items-center justify-between p-4 hover:bg-gray-50/80 rounded-xl cursor-pointer transition-colors"
                onClick={() => selectConversation(conversation)}
            >
                <div className="flex items-center gap-4">
                    <div className="space-y-1 text-right">
                        <span className={`font-medium ${
                            ['filled', 'filled_via_metch', 'closed'].includes(conversation.job_status) ? 'text-gray-500' : 'text-gray-800'
                        }`}>
                            {conversation.candidate_name}
                        </span>
                        <div className="text-xs text-gray-500">{conversation.job_title}</div>
                        <ConversationStatusIndicator jobStatus={conversation.job_status} className="text-xs" />
                    </div>
                    <div className={`w-12 h-12 rounded-full overflow-hidden border-2 border-gray-200 ${
                        ['filled', 'filled_via_metch', 'closed'].includes(conversation.job_status) ? 'grayscale opacity-75' : ''
                    }`}>
                        <img
                            src={conversation.profileImage}
                            alt={conversation.candidate_name}
                            className="w-full h-full object-cover"
                        />
                    </div>
                </div>
                <span className="text-gray-500 text-sm whitespace-nowrap">
                    {format(new Date(conversation.last_message_time), "dd.MM.yy")}
                </span>
            </motion.div>
        ))}
    </div>
);

export default ConversationList;