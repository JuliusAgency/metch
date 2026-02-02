import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, ArrowLeft, X } from 'lucide-react';
import cvCreateIcon from '@/assets/cv_create_icon.png';
import cvExistsIcon from '@/assets/cv_exists_icon.png';
import VectorLogo from '@/assets/Vector.svg';
import mobileWandIcon from '@/assets/mobile_wand_icon.png';
import mobileCvIcon from '@/assets/mobile_cv_icon.png';

const CVChoiceModal = ({ isOpen, onSelect, loading }) => {
    const [selectedOption, setSelectedOption] = useState(null);

    const options = [
        {
            id: 'create',
            title: 'צרו לי קורות חיים',
            subtitle: 'אל דאגה, נבנה יחד איתך קורות חיים שיעזרו לך למצוא את מאצ\' מדויק - בעזרת הבינה המלאכותית שלנו ובחינם לגמרי.',
            imageSrc: cvCreateIcon
        },
        {
            id: 'upload',
            title: 'יש לי קורות חיים',
            subtitle: 'זה אומר שתוכל להעלות את הקובץ ולקבל הצעות עבודה מדויקות כבר עכשיו!',
            imageSrc: cvExistsIcon
        }
    ];

    if (!isOpen) return null;

    const handleContinue = () => {
        if (selectedOption && !loading) {
            onSelect(selectedOption);
        }
    };

    return (
        <AnimatePresence>
            <div className="fixed inset-0 bg-white md:bg-black/50 z-[100] flex items-center justify-center">
                {/* Mobile Background Gradient - Only Top 25% */}
                <div className="absolute top-0 left-0 right-0 h-[15vh] bg-gradient-to-b from-[#dbecf3] to-transparent md:hidden opacity-100 pointer-events-none" />

                <motion.div
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 50 }}
                    className="bg-transparent md:bg-white md:rounded-[40px] md:shadow-2xl w-full h-full md:h-auto md:max-w-4xl p-0 md:p-12 relative overflow-y-auto flex flex-col"
                    dir="rtl"
                >
                    {/* Header (Mobile Design) - Pill Shape */}
                    <div className="w-full px-6 pt-6 pb-2 md:hidden sticky top-0 z-10">
                        <div className="bg-[#e0eef5]/90 backdrop-blur-md border border-white/40 rounded-full px-6 py-3 flex items-center justify-between shadow-sm">
                            <button className="text-[#001d3d] p-1">
                                <Menu className="w-6 h-6" />
                            </button>
                            <div className="flex items-center gap-1">
                                <p className="font-['Poppins',_sans-serif] text-2xl text-[#001d3d] font-light pt-0.5 tracking-tight">Metch</p>
                                <img src={VectorLogo} alt="Metch Logo" className="w-3.5 h-3.5 object-contain" />
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col items-center w-full px-6 py-8 md:p-0">
                        {/* Desktop Header Logo */}
                        <div className="hidden md:flex items-center gap-2 mb-6">
                            <p className="font-['Poppins',_sans-serif] text-2xl text-black font-light">Metch</p>
                            <img src={VectorLogo} alt="Metch Logo" className="w-5 h-5 object-contain" />
                        </div>

                        {/* Titles */}
                        <div className="text-center mb-8 md:mb-10 w-full">
                            <h2 className="text-[#1a1f36] text-2xl md:hidden font-bold mb-1">
                                נרשמת בהצלחה
                            </h2>
                            <h1 className="text-[#0077b6] text-2xl md:text-[#003566] md:text-3xl font-bold mb-4">
                                {window.innerWidth < 768 ? "המאץ' המושלם מחכה לך" : "איך תרצה להוסיף את קורות החיים שלך?"}
                            </h1>
                            <p className="text-gray-600 md:text-[#003566] md:opacity-90 text-base md:text-lg max-w-2xl mx-auto leading-relaxed">
                                {window.innerWidth < 768
                                    ? "רק עוד כמה צעדים ואנחנו נמצא בשבילך את העבודה שהכי מתאימה לדרישות שלך"
                                    : "המענה שלך יעזור לנו למקד עבורך את ההצעות הרלוונטיות ביותר"}
                            </p>
                        </div>

                        <div className="flex flex-col md:flex-row gap-4 md:gap-6 w-full justify-center items-stretch mb-10">
                            {options.map((opt, index) => (
                                <div
                                    key={opt.id}
                                    onClick={() => {
                                        if (loading) return;
                                        if (window.innerWidth >= 768) {
                                            onSelect(opt.id);
                                        } else {
                                            setSelectedOption(opt.id);
                                        }
                                    }}
                                    className={`
                                        cursor-pointer rounded-3xl p-6 flex flex-row md:flex-col items-center justify-start md:justify-center text-right md:text-center gap-6 transition-all duration-300 w-full md:w-[260px] bg-white border-2
                                        ${selectedOption === opt.id
                                            ? 'border-[#0077b6] shadow-xl md:-translate-y-2'
                                            : 'border-gray-50 md:border-gray-100 shadow-md md:shadow-lg hover:shadow-lg md:hover:shadow-xl md:hover:-translate-y-1'
                                        }
                                        ${loading ? 'opacity-50 cursor-not-allowed' : ''}
                                    `}
                                >
                                    {/* Icon in Circle Container (Mobile) or Original Icon (Desktop) */}
                                    <div className="md:hidden w-16 h-16 bg-[#001a6e] rounded-full flex items-center justify-center flex-shrink-0 shadow-lg">
                                        <img
                                            src={index === 0 ? mobileWandIcon : mobileCvIcon}
                                            alt={opt.title}
                                            className="w-8 h-8 object-contain"
                                        />
                                    </div>
                                    <img
                                        src={opt.imageSrc}
                                        alt={opt.title}
                                        className="hidden md:block w-16 h-16 object-contain mb-2"
                                    />

                                    <div className="flex-1 flex flex-col md:items-center">
                                        <h3 className="text-lg md:text-xl font-bold text-[#001d3d] md:text-[#003566] mb-1">
                                            {opt.title}
                                        </h3>
                                        <p className="text-xs md:text-sm text-gray-500 md:text-[#003566]/80 leading-relaxed md:px-2">
                                            {opt.subtitle}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Mobile Only: "Continue" button */}
                        <div className="w-full max-w-sm mt-auto md:hidden flex flex-col items-center">
                            <button
                                onClick={handleContinue}
                                disabled={!selectedOption || loading}
                                className={`
                                    w-full py-4 px-8 rounded-2xl bg-[#3089cd] text-white text-xl font-bold flex items-center justify-center gap-3 transition-all duration-300 shadow-lg hover:shadow-xl active:scale-95
                                    ${(!selectedOption || loading) ? 'opacity-50 grayscale cursor-not-allowed' : 'hover:bg-[#2574ae]'}
                                `}
                            >
                                <span>המשך</span>
                                <ArrowLeft className="w-5 h-5" strokeWidth={1.5} />
                            </button>

                            <p className="mt-6 text-gray-400 text-[10px] text-center">
                                אל דאגה, ניתן לשנות את הבחירה בכל עת.
                            </p>
                        </div>
                    </div>

                    {/* Desktop Close Button */}
                    <button
                        className="hidden md:block absolute top-6 left-6 text-gray-400 hover:text-gray-600 p-2"
                        onClick={() => !loading && setSelectedOption(null)}
                    >
                        <X className="w-6 h-6" />
                    </button>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default CVChoiceModal;

