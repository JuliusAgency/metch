import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

const ScreeningQuestion = ({ question, index, handleAnswerChange, disabled }) => (
    <motion.div
        key={question.id}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.1 }}
        className="space-y-4"
    >
        <div className="flex justify-end">
            <div className="bg-white border border-gray-300 rounded-full px-5 py-2 self-end text-gray-800">
                {question.text}
            </div>
        </div>
        <div className="flex justify-start">
            {question.type === 'text' ? (
                <Input
                    value={question.answer}
                    onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                    placeholder="תשובה"
                    className="h-12 rounded-full border-gray-300 text-right w-full max-w-sm disabled:opacity-70 disabled:cursor-not-allowed"
                    dir="rtl"
                    disabled={disabled}
                />
            ) : (
                <div className="flex items-center gap-4">
                    <RadioGroup
                        value={question.answer || ''}
                        onValueChange={(value) => handleAnswerChange(question.id, value)}
                        className="flex gap-3"
                        disabled={disabled}
                    >
                        <div className="flex items-center">
                            <RadioGroupItem value="כן" id={`q-${question.id}-yes`} className="sr-only" disabled={disabled} />
                            <Label
                                htmlFor={`q-${question.id}-yes`}
                                className={`cursor-pointer w-11 h-11 flex items-center justify-center rounded-full border text-sm transition-colors ${question.answer === 'כן' ? 'bg-blue-600 border-blue-600 text-white font-semibold' : 'bg-white border-gray-300 text-gray-700'
                                    } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                                כן
                            </Label>
                        </div>
                        <div className="flex items-center">
                            <RadioGroupItem value="לא" id={`q-${question.id}-no`} className="sr-only" disabled={disabled} />
                            <Label
                                htmlFor={`q-${question.id}-no`}
                                className={`cursor-pointer w-11 h-11 flex items-center justify-center rounded-full border text-sm transition-colors ${question.answer === 'לא' ? 'bg-blue-600 border-blue-600 text-white font-semibold' : 'bg-white border-gray-300 text-gray-700'
                                    } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                                לא
                            </Label>
                        </div>
                    </RadioGroup>
                </div>
            )}
        </div>
    </motion.div>
);

export default ScreeningQuestion;