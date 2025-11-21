import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Check, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

const ApplicationSuccessModal = ({ isOpen, onClose }) => {
    const navigate = useNavigate();

    const handleGoToHomepage = () => {
        onClose();
        navigate(createPageUrl("Dashboard"));
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md md:max-w-lg p-0 overflow-hidden border-0 bg-white rounded-3xl" dir="rtl">
                <div className="relative p-8 sm:p-12 text-center">
                    {/* Decorative Stars */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.2, duration: 0.5 }}
                        className="absolute top-8 right-12 text-blue-500"
                    >
                        <Sparkles className="w-8 h-8 fill-blue-500" />
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.3, duration: 0.5 }}
                        className="absolute top-16 right-20 text-blue-400"
                    >
                        <Sparkles className="w-5 h-5 fill-blue-400" />
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.25, duration: 0.5 }}
                        className="absolute top-6 left-16 text-blue-500"
                    >
                        <Sparkles className="w-6 h-6 fill-blue-500" />
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.35, duration: 0.5 }}
                        className="absolute top-12 left-12 text-blue-300"
                    >
                        <Sparkles className="w-7 h-7 fill-blue-300" />
                    </motion.div>

                    {/* Checkmark Icon with Glow */}
                    <motion.div
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ duration: 0.6, type: "spring", bounce: 0.5 }}
                        className="mx-auto mb-6 w-24 h-24 relative"
                    >
                        {/* Glow effect */}
                        <div className="absolute inset-0 bg-blue-400/30 rounded-full blur-2xl" />

                        {/* Icon container */}
                        <div className="relative w-full h-full bg-gradient-to-br from-blue-100 to-blue-200 rounded-full flex items-center justify-center border-4 border-white shadow-lg">
                            <Check className="w-12 h-12 text-blue-600 stroke-[3]" />
                        </div>
                    </motion.div>

                    {/* Title */}
                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3, duration: 0.5 }}
                        className="text-3xl md:text-4xl font-bold text-gray-900 mb-4"
                    >
                        היה פה מאצ'
                    </motion.h2>

                    {/* Subtitle */}
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4, duration: 0.5 }}
                        className="text-gray-600 text-lg mb-8"
                    >
                        מועמדותך הוגשה בהצלחה!
                    </motion.p>

                    {/* Button */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5, duration: 0.5 }}
                    >
                        <Button
                            onClick={handleGoToHomepage}
                            className="w-full sm:w-auto px-12 py-6 bg-blue-600 hover:bg-blue-700 text-white rounded-full font-bold text-lg shadow-lg hover:shadow-xl transition-all"
                        >
                            לעמוד הראשי
                        </Button>
                    </motion.div>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default ApplicationSuccessModal;
