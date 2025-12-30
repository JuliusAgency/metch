import React, { useState } from 'react';
import { useUser } from '@/contexts/UserContext';
import { useToast } from '@/components/ui/use-toast';
import { motion, AnimatePresence } from 'framer-motion';

const CareerStageModal = ({ isOpen, onComplete }) => {
    const [selected, setSelected] = useState(null);
    const [loading, setLoading] = useState(false);
    const { updateProfile } = useUser();
    const { toast } = useToast();

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
            await updateProfile({ career_stage: selected });

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
                    className="bg-white rounded-[40px] shadow-2xl w-full max-w-4xl p-8 md:p-12 relative overflow-hidden"
                    dir="rtl"
                >
                    <div className="flex flex-col items-center w-full">
                        <h1 className="text-[#003566] text-2xl md:text-4xl font-['Rubik:Bold',_sans-serif] font-bold mb-3 text-center">
                            מה השלב שלך בקריירה?
                        </h1>
                        <p className="text-[#003566] text-base md:text-xl font-['Rubik:Regular',_sans-serif] text-center mb-10 opacity-90 max-w-2xl">
                            המענה שלך יעזור לנו למקד עבורך את ההצעות הרלוונטיות ביותר
                        </p>

                        <div className="flex flex-col md:flex-row gap-6 w-full justify-center items-stretch mb-10">
                            {options.map((opt) => (
                                <div
                                    key={opt.id}
                                    onClick={() => setSelected(opt.id)}
                                    className={`
                                        cursor-pointer rounded-[30px] p-6 flex flex-col items-center justify-center text-center gap-4 transition-all duration-300 w-full md:w-[280px] lg:w-[320px] relative
                                        ${selected === opt.id
                                            ? 'bg-[#003566] text-white shadow-2xl scale-105'
                                            : 'bg-white text-[#003566] shadow-lg hover:shadow-xl hover:-translate-y-2 border border-gray-100'
                                        }
                                    `}
                                    style={{
                                        boxShadow: selected === opt.id
                                            ? '0px 20px 40px rgba(0, 53, 102, 0.3)'
                                            : '0px 10px 30px rgba(0, 0, 0, 0.05)'
                                    }}
                                >
                                    <h3 className="text-xl font-['Rubik:Bold',_sans-serif] font-bold leading-tight min-h-[50px] flex items-center justify-center">
                                        {opt.title}
                                    </h3>

                                    {/* Separator Line */}
                                    <div className={`h-[1px] w-full max-w-[60px] my-1 ${selected === opt.id ? 'bg-white/20' : 'bg-[#003566]/10'}`} />

                                    <p className={`text-base font-['Rubik:Regular',_sans-serif] leading-relaxed px-2 min-h-[70px] flex items-center justify-center ${selected === opt.id ? 'text-gray-200' : 'text-[#003566]/80'}`}>
                                        {opt.subtitle}
                                    </p>
                                </div>
                            ))}
                        </div>

                        <button
                            onClick={handleSubmit}
                            disabled={!selected || loading}
                            className={`
                                rounded-full px-12 py-4 text-xl font-['Rubik:Bold',_sans-serif] font-bold transition-all duration-300 flex items-center gap-3
                                ${!selected || loading
                                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                    : 'bg-[#2987cd] text-white hover:bg-[#1f6ba8] shadow-lg hover:shadow-[#2987cd]/30 transform hover:-translate-y-1'
                                }
                            `}
                        >
                            {loading ? (
                                <>
                                    <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    <span>שומר...</span>
                                </>
                            ) : (
                                <span>שמירה וסיום</span>
                            )}
                        </button>

                        <p className="mt-6 text-[#003566] text-xs md:text-sm font-['Rubik:Regular',_sans-serif] opacity-80 text-center">
                            אל דאגה, ניתן לשנות את הבחירה בעמוד הקו״ח שלי בכל עת.
                        </p>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default CareerStageModal;
