import React, { useState } from 'react';
import { useUser } from '@/contexts/UserContext';
import { useToast } from '@/components/ui/use-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
const CareerStageModal = ({ isOpen, onComplete }) => {
    const [selected, setSelected] = useState(null);
    const [loading, setLoading] = useState(false);
    const { user, updateProfile } = useUser();
    const { toast } = useToast();

    // Load initial selection from user profile
    React.useEffect(() => {
        if (isOpen && user) {
            if (user.career_stage) {
                setSelected(user.career_stage);
            } else if (user.prefers_no_career_change !== undefined && user.prefers_no_career_change !== null) {
                // Fallback for legacy data
                setSelected(user.prefers_no_career_change ? 'career_continuing' : 'open_to_new');
            }
        }
    }, [isOpen, user]);

    // The options based on the user request
    const options = [
        {
            id: 'open_to_new',
            title: 'פתוח/ה לכיוונים חדשים',
            subtitle: 'נציע לך עבודה במקצוע שביקשת וגם במקצועות שקשורים אליך ובעבודות נוספות'
        },
        {
            id: 'career_continuing',
            title: 'הקריירה ממשיכה',
            subtitle: 'נציע לך עבודה במקצוע שביקשת וגם בתפקידים דומים'
        }
    ];

    const handleSubmit = async () => {
        if (!selected) return;

        setLoading(true);
        try {
            // "career_continuing" means they want to stay in their field -> prefers_no_career_change = true
            // "open_to_new" means they are open to changes -> prefers_no_career_change = false
            const prefersNoChange = selected === 'career_continuing';

            await updateProfile({
                career_stage: selected,
                prefers_no_career_change: prefersNoChange
            });

            toast({
                title: "הבחירה נשמרה בהצלחה",
                description: "המשך גלישה נעימה",
            });

            // Only close and trigger completion after successful save
            onComplete();
        } catch (e) {
            console.error("Failed to save career stage:", e);
            toast({
                title: "שגיאה בשמירה",
                description: "אירעה שגיאה בעת שמירת הבחירה, אנא נסו שוב",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    }

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="bg-white rounded-[40px] shadow-2xl w-full max-w-3xl p-6 md:p-10 relative overflow-hidden"
                    dir="rtl"
                >
                    {/* Close Button */}
                    <button
                        onClick={onComplete}
                        className="absolute top-4 left-4 p-2 rounded-full hover:bg-gray-100 transition-colors text-gray-500 hover:text-gray-700"
                    >
                        <X className="w-6 h-6" />
                    </button>

                    <div className="flex flex-col items-center w-full">
                        <h1 className="text-[#003566] text-xl md:text-3xl font-['Rubik:Bold',_sans-serif] font-bold mb-3 text-center">
                            מה השלב שלך בקריירה?
                        </h1>
                        <p className="text-[#003566] text-sm md:text-lg font-['Rubik:Regular',_sans-serif] text-center mb-8 opacity-90 max-w-2xl">
                            המענה שלך יעזור לנו למקד עבורך את ההצעות הרלוונטיות ביותר
                        </p>

                        <div className="flex flex-col md:flex-row gap-4 w-full justify-center items-stretch mb-8">
                            {options.map((opt) => (
                                <div
                                    key={opt.id}
                                    onClick={() => setSelected(opt.id)}
                                    className={`
                                        cursor-pointer rounded-[24px] p-5 flex flex-col items-center justify-center text-center gap-3 transition-all duration-300 w-full md:w-[240px] lg:w-[280px] relative
                                        ${selected === opt.id
                                            ? 'bg-[#003566] text-white shadow-xl scale-105'
                                            : 'bg-white text-[#003566] shadow-md hover:shadow-lg hover:-translate-y-1 border border-gray-100'
                                        }
                                    `}
                                    style={{
                                        boxShadow: selected === opt.id
                                            ? '0px 15px 30px rgba(0, 53, 102, 0.25)'
                                            : '0px 8px 20px rgba(0, 0, 0, 0.05)'
                                    }}
                                >
                                    <h3 className="text-lg font-['Rubik:Bold',_sans-serif] font-bold leading-tight min-h-[44px] flex items-center justify-center">
                                        {opt.title}
                                    </h3>

                                    {/* Separator Line */}
                                    <div className={`h-[1px] w-full max-w-[50px] my-1 ${selected === opt.id ? 'bg-white/20' : 'bg-[#003566]/10'}`} />

                                    <p className={`text-sm font-['Rubik:Regular',_sans-serif] leading-relaxed px-2 min-h-[60px] flex items-center justify-center ${selected === opt.id ? 'text-gray-200' : 'text-[#003566]/80'}`}>
                                        {opt.subtitle}
                                    </p>
                                </div>
                            ))}
                        </div>

                        <button
                            onClick={handleSubmit}
                            disabled={!selected || loading}
                            className={`
                                rounded-full px-10 py-3 text-lg font-['Rubik:Bold',_sans-serif] font-bold transition-all duration-300 flex items-center gap-3
                                ${!selected || loading
                                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                    : 'bg-[#2987cd] text-white hover:bg-[#1f6ba8] shadow-lg hover:shadow-[#2987cd]/30 transform hover:-translate-y-1'
                                }
                            `}
                        >
                            {loading ? (
                                <>
                                    <span className="w-5 h-5 border-t-2 border-white rounded-full animate-spin" />
                                    <span>שומר...</span>
                                </>
                            ) : (
                                <span>שמירה וסיום</span>
                            )}
                        </button>

                        <p className="mt-4 text-[#003566] text-xs md:text-sm font-['Rubik:Regular',_sans-serif] opacity-80 text-center">
                            אל דאגה, ניתן לשנות את הבחירה בעמוד הקו״ח שלי בכל עת.
                        </p>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default CareerStageModal;
