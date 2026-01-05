import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import Lottie from 'lottie-react';
import confettiAnimation from '../../../Confetti banner.json';

const Star = ({ className, filled, delay = 0, rotate = 0 }) => (
    <motion.svg
        initial={{ scale: 0, opacity: 0, rotate: rotate - 45 }}
        animate={{ scale: 1, opacity: 1, rotate: rotate }}
        transition={{ delay, duration: 0.5, type: "spring", stiffness: 200 }}
        viewBox="0 0 24 24"
        fill={filled ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth={filled ? "0" : "1.5"}
        className={className}
    >
        <path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z" />
    </motion.svg>
);

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
                    {/* Decorative Stars - Left Cluster */}
                    <div className="absolute bottom-20 left-8 z-0">
                        <Star className="w-8 h-8 text-[#2987cd]" filled delay={0.2} rotate={-15} />
                    </div>
                    <div className="absolute bottom-12 left-4 z-0">
                        <Star className="w-6 h-6 text-[#2987cd]" filled delay={0.3} rotate={10} />
                    </div>
                    <div className="absolute bottom-16 left-16 z-0">
                        <Star className="w-6 h-6 text-[#2987cd]" delay={0.4} rotate={-20} />
                    </div>

                    {/* Decorative Stars - Right Cluster */}
                    <div className="absolute top-24 right-8 z-0">
                        <Star className="w-6 h-6 text-[#2987cd]" filled delay={0.2} rotate={15} />
                    </div>
                    <div className="absolute top-16 right-16 z-0">
                        <Star className="w-5 h-5 text-[#2987cd]" delay={0.3} rotate={-10} />
                    </div>
                    <div className="absolute top-32 right-6 z-0">
                        <Star className="w-8 h-8 text-[#2987cd]" filled delay={0.4} rotate={30} />
                    </div>


                    {/* Lottie Confetti Animation */}
                    <div className="absolute inset-x-0 top-0 flex justify-center pointer-events-none z-0 opacity-80">
                        <Lottie
                            animationData={confettiAnimation}
                            loop={false}
                            style={{ width: '400px', height: '200px' }}
                        />
                    </div>

                    {/* Checkmark Icon with Glow */}
                    <motion.div
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ duration: 0.6, type: "spring", bounce: 0.5 }}
                        className="mx-auto mb-6 w-24 h-24 relative z-10"
                    >
                        {/* Glow effect */}
                        <div className="absolute inset-0 bg-blue-400/30 rounded-full blur-2xl" />

                        {/* Icon container */}
                        <div className="relative w-full h-full bg-gradient-to-br from-blue-100 to-blue-200 rounded-full flex items-center justify-center border-4 border-white shadow-lg">
                            <Check className="w-12 h-12 text-white stroke-[3]" />
                        </div>
                    </motion.div>

                    {/* Title */}
                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3, duration: 0.5 }}
                        className="text-4xl font-extrabold text-[#0a1f44] mb-4 relative z-10"
                    >
                        היה פה מאצ'
                    </motion.h2>

                    {/* Subtitle */}
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4, duration: 0.5 }}
                        className="text-[#0a1f44]/80 text-xl mb-10 relative z-10 font-medium"
                    >
                        מועמדותך הוגשה בהצלחה!
                    </motion.p>

                    {/* Button */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5, duration: 0.5 }}
                        className="relative z-10"
                    >
                        <Button
                            onClick={handleGoToHomepage}
                            className="w-full sm:w-auto px-16 py-6 bg-[#2987cd] hover:bg-[#2070ab] text-white rounded-full font-bold text-lg shadow-lg hover:shadow-xl transition-all"
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
