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
            className={`flex ${isMyMessage ? 'justify-end' : 'justify-start'}`}
        >
            <div className={`max-w-xs lg:max-w-md px-6 py-3 rounded-lg ${isMyMessage
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-900'
                }`}>
                <p className="text-base">{message.content}</p>
                <div className={`flex items-center justify-end gap-1 mt-2 text-xs ${isMyMessage ? 'text-blue-100' : 'text-gray-500'
                    }`}>
                    <span>{format(new Date(message.created_date), "HH:mm")}</span>
                    {isMyMessage && (
                        <CheckCheck className="w-3 h-3" />
                    )}
                </div>
            </div>
        </motion.div>
    );
};

export default SeekerMessageItem;