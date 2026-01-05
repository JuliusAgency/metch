import { motion } from "framer-motion";
import { format } from "date-fns";


const ConversationList = ({ conversations, selectConversation }) => (
    <div className="space-y-4 mb-8">
        {conversations.map((conversation, index) => {
            const names = conversation.candidate_name ? conversation.candidate_name.split(' ') : [];
            const firstName = names[0] || "";
            const lastInitial = names.length > 1 ? names[names.length - 1].charAt(0) : "";

            return (
                <motion.div
                    key={conversation.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                    className="flex items-center justify-between p-4 bg-[#F4F9FF] mb-2 hover:bg-[#EBF5FF] cursor-pointer transition-colors h-20 rounded-xl"
                    onClick={() => selectConversation(conversation)}
                >
                    <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-full overflow-hidden ${['filled', 'filled_via_metch', 'closed'].includes(conversation.job_status) ? 'grayscale opacity-75' : ''
                            }`}>
                            <img
                                src={conversation.profileImage || "/assets/images/avatar-placeholder.png"}
                                alt={conversation.candidate_name}
                                className="w-full h-full object-cover"
                            />
                        </div>
                        <div className="text-right">
                            <span className={`text-lg text-gray-900 font-bold ${['filled', 'filled_via_metch', 'closed'].includes(conversation.job_status) ? 'text-gray-500' : ''
                                }`}>
                                {firstName} {lastInitial && <span>{lastInitial}</span>}
                            </span>
                        </div>
                    </div>
                    <span className="text-gray-400 text-sm font-light whitespace-nowrap px-4">
                        {format(new Date(conversation.last_message_time), "dd.MM.yy")}
                    </span>
                </motion.div>
            );
        })}
    </div>
);

export default ConversationList;