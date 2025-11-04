import { motion } from "framer-motion";
import { Textarea } from "@/components/ui/textarea";

const Question = ({ index, text, value, onChange }) => (
    <motion.div
        key={index}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.1 }}
        className="bg-white rounded-xl p-6 border border-gray-200"
    >
        <label className="block text-right font-semibold text-gray-900 mb-4">
            {text}
        </label>
        <Textarea
            value={value || ''}
            onChange={(e) => onChange(text, e.target.value)}
            placeholder="הקלד את תשובתך כאן..."
            className="w-full min-h-[120px] border-gray-300 rounded-xl text-right resize-none"
            dir="rtl"
        />
    </motion.div>
);

export default Question;