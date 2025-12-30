import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";

const Question = ({ index, text, value, onAnswer, type }) => (
    <motion.div
        key={index}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.1 }}
        className="flex flex-col items-start w-full mb-6"
    >
        <div className="bg-white border border-gray-200 rounded-[20px] px-6 py-3 mb-3 text-right shadow-sm inline-block max-w-full">
            <span className="text-gray-900 font-medium text-sm md:text-base">
                {text}
            </span>
        </div>
        <div className="w-full flex items-center gap-3">
            <Input
                value={value || ''}
                onChange={(e) => onAnswer(e.target.value)}
                placeholder="תשובה"
                className="w-full h-12 border-gray-300 rounded-[20px] text-right px-6 bg-white focus:bg-white focus:ring-1 focus:ring-blue-200 transition-all placeholder:text-gray-300"
                dir="rtl"
            />
            {type === 'yes_no' && (
                <div className="flex gap-2 shrink-0">
                    <button
                        type="button"
                        onClick={() => onAnswer('כן')}
                        className={`w-10 h-10 rounded-full border flex items-center justify-center transition-all text-sm font-medium ${value === 'כן' ? 'bg-blue-600 text-white border-blue-600 shadow-md' : 'bg-white text-blue-600 border-blue-200 hover:bg-blue-50'}`}
                    >
                        כן
                    </button>
                    <button
                        type="button"
                        onClick={() => onAnswer('לא')}
                        className={`w-10 h-10 rounded-full border flex items-center justify-center transition-all text-sm font-medium ${value === 'לא' ? 'bg-blue-600 text-white border-blue-600 shadow-md' : 'bg-white text-blue-600 border-blue-200 hover:bg-blue-50'}`}
                    >
                        לא
                    </button>
                </div>
            )}
        </div>
    </motion.div>
);

export default Question;