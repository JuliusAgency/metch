import { motion } from "framer-motion";
import { format } from "date-fns";
import { CheckCheck } from "lucide-react";

const MessageItem = ({ message, index, user }) => {
    const isMyMessage = message.sender_email === user?.email || message.sender_email === "employer@example.com";

    return (
        <motion.div
            key={message.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
            className={`flex ${isMyMessage ? 'justify-start' : 'justify-end'}`}
        >
            <div className={`max-w-xs lg:max-w-md px-6 py-3 rounded-2xl ${
                isMyMessage
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-900'
            }`}>
                <p className="text-base">{message.content}</p>
                <div className={`flex items-center justify-start gap-1 mt-2 text-xs ${
                    isMyMessage ? 'text-blue-100' : 'text-gray-500'
                }`}>
                    {isMyMessage && (
                        <CheckCheck className="w-3 h-3" />
                    )}
                    <span>{format(new Date(message.created_date), "HH:mm")} PM</span>
                </div>
            </div>
        </motion.div>
    );
};

export default MessageItem;