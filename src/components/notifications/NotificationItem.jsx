import { motion } from "framer-motion";

const NotificationItem = ({ notif, index }) => (
    <motion.div
        key={notif.id}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, delay: index * 0.1 }}
        className="flex items-center justify-between p-4 border-b border-gray-200/80 last:border-b-0"
    >
        <span className="text-gray-500 text-sm whitespace-nowrap">{notif.date}</span>
        <div className="flex-1 text-right px-4 sm:px-8">
            <p className="font-semibold text-gray-800">{notif.title}</p>
            <p className="text-gray-600">{notif.message}</p>
        </div>
        <div className="flex items-center justify-center w-10 h-10 rounded-full border border-gray-300 bg-white flex-shrink-0">
            <notif.icon className="w-5 h-5 text-gray-600" />
        </div>
    </motion.div>
);

export default NotificationItem;