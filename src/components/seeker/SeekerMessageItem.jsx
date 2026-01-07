import { motion } from "framer-motion";
import { format } from "date-fns";
import { CheckCheck } from "lucide-react";

const SeekerMessageItem = ({ message, index, user }) => {
    const isMyMessage = message.sender_email === user?.email || message.sender_email === "seeker@example.com";

    return (
        <motion.div
            key={message.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
            className={`flex ${isMyMessage ? 'justify-start' : 'justify-end'} mb-2`}
        >
            <div className={`flex flex-col max-w-xs lg:max-w-md ${isMyMessage ? 'items-start' : 'items-end'}`}>
                <div className={`px-5 py-3 text-sm font-light shadow-sm break-words ${isMyMessage
                    ? 'bg-[#001a6e] text-white rounded-2xl rounded-br-none'
                    : 'bg-[#F2F4F7] text-gray-800 rounded-2xl rounded-bl-none'
                    }`}>
                    {message.content}
                </div>
                <div className="flex items-center gap-1 mt-1 px-1">
                    <span className="text-[10px] text-gray-400">
                        {format(new Date(message.created_date), "HH:mm")}
                    </span>
                    {isMyMessage && (
                        <CheckCheck className="w-3 h-3 text-green-500" />
                    )}
                </div>
            </div>
        </motion.div>
    );
};

export default SeekerMessageItem;