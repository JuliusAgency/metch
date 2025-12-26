import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '@/contexts/UserContext';
import { useToast } from '@/components/ui/use-toast';

const CareerStageSelection = () => {
    const [selected, setSelected] = useState(null);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const { updateProfile } = useUser();
    const { toast } = useToast();

    // The options based on the user request
    const options = [
        {
            id: 'open_to_new',
            title: 'פתוח/ה לכיוונים חדשים',
            subtitle: 'נציע לך תפקידים במקצוע שביקשת וגם במקצועות דומים ועבודות נוספות'
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
            // Navigate to main CV generator
            navigate('/CVGenerator');
        } catch (err) {
            console.error(err);
            toast({
                title: "שגיאה",
                description: "אירעה שגיאה בעת שמירת הבחירה",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="bg-gradient-to-b from-[#dbecf3] from-[12.35%] to-[#ffffff] via-[#ffffff] via-[32.336%] min-h-screen w-full flex flex-col items-center justify-center p-4 relative overflow-hidden" dir="rtl">

            {/* Background elements if needed, keeping it clean for now */}

            <div className="z-10 flex flex-col items-center w-full max-w-7xl">
                <h1 className="text-[#003566] text-3xl md:text-5xl font-['Rubik:Bold',_sans-serif] font-bold mb-4 text-center">
                    מה השלב שלך בקריירה?
                </h1>
                <p className="text-[#003566] text-lg md:text-2xl font-['Rubik:Regular',_sans-serif] text-center mb-12 opacity-90 max-w-2xl">
                    המענה שלך יעזור לנו למקד עבורך את ההצעות הרלוונטיות ביותר
                </p>

                <div className="flex flex-col md:flex-row gap-6 w-full justify-center items-stretch mb-16 px-4">
                    {options.map((opt) => (
                        <div
                            key={opt.id}
                            onClick={() => setSelected(opt.id)}
                            className={`
                                cursor-pointer rounded-[30px] p-8 flex flex-col items-center justify-center text-center gap-6 transition-all duration-300 w-full md:w-[320px] lg:w-[360px] relative
                                ${selected === opt.id
                                    ? 'bg-[#003566] text-white shadow-2xl scale-105'
                                    : 'bg-white text-[#003566] shadow-lg hover:shadow-xl hover:-translate-y-2'
                                }
                            `}
                            style={{
                                boxShadow: selected === opt.id
                                    ? '0px 20px 40px rgba(0, 53, 102, 0.3)'
                                    : '0px 10px 30px rgba(0, 0, 0, 0.05)'
                            }}
                        >
                            <h3 className="text-2xl font-['Rubik:Bold',_sans-serif] font-bold leading-tight min-h-[64px] flex items-center justify-center">
                                {opt.title}
                            </h3>

                            {/* Separator Line */}
                            <div className={`h-[1px] w-full max-w-[80px] my-2 ${selected === opt.id ? 'bg-white/20' : 'bg-[#003566]/10'}`} />

                            <p className={`text-lg font-['Rubik:Regular',_sans-serif] leading-relaxed px-2 min-h-[84px] flex items-center justify-center ${selected === opt.id ? 'text-gray-200' : 'text-[#003566]/80'}`}>
                                {opt.subtitle}
                            </p>

                            {/* Selection Indicator Circle */}
                            <div className={`
                                mt-2 flex items-center justify-center w-8 h-8 rounded-full border-2 transition-colors duration-300
                                ${selected === opt.id ? 'border-white bg-white text-[#003566]' : 'border-gray-200 text-transparent'}
                            `}>
                                {selected === opt.id && (
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                                        <polyline points="20 6 9 17 4 12"></polyline>
                                    </svg>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                <button
                    onClick={handleSubmit}
                    disabled={!selected || loading}
                    className={`
                        rounded-full px-16 py-5 text-2xl font-['Rubik:Bold',_sans-serif] font-bold transition-all duration-300 flex items-center gap-3
                        ${!selected || loading
                            ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                            : 'bg-[#2987cd] text-white hover:bg-[#1f6ba8] shadow-lg hover:shadow-[#2987cd]/30 transform hover:-translate-y-1'
                        }
                    `}
                >
                    {loading ? (
                        <>
                            <span className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            <span>שומר...</span>
                        </>
                    ) : (
                        <span>שמירה וסיום</span>
                    )}
                </button>

                <p className="mt-8 text-[#003566] text-sm md:text-base font-['Rubik:Regular',_sans-serif] opacity-80 text-center">
                    אל דאגה, ניתן לשנות את הבחירה בעמוד הקו״ח שלי בכל עת.
                </p>
            </div>
        </div>
    );
};

export default CareerStageSelection;
