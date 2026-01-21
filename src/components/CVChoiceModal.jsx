import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import cvCreateIcon from '@/assets/cv_create_icon.png';
import cvExistsIcon from '@/assets/cv_exists_icon.png';
import VectorLogo from '@/assets/Vector.svg';

const CVChoiceModal = ({ isOpen, onSelect, loading }) => {
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
                        {/* Header with Logo */}
                        <div className="flex items-center gap-2 mb-6">
                            <p className="font-['Poppins',_sans-serif] text-2xl text-black font-light">Metch</p>
                            <img src={VectorLogo} alt="Metch Logo" className="w-5 h-5 object-contain" />
                        </div>

                        <h1 className="text-[#003566] text-2xl md:text-3xl font-['Rubik',_sans-serif] font-bold mb-3 text-center">
                            איך תרצה להוסיף את קורות החיים שלך?
                        </h1>
                        <p className="text-[#003566] text-base md:text-lg font-['Rubik',_sans-serif] text-center mb-10 opacity-90 max-w-2xl">
                            המענה שלך יעזור לנו למקד עבורך את ההצעות הרלוונטיות ביותר
                        </p>

                        <div className="flex flex-col md:flex-row gap-6 w-full justify-center items-stretch mb-10">
                            {options.map((opt) => (
                                <div
                                    key={opt.id}
                                    onClick={() => !loading && onSelect(opt.id)}
                                    className={`
                    cursor-pointer rounded-[30px] p-6 flex flex-col items-center justify-center text-center gap-4 transition-all duration-300 w-full md:w-[260px] bg-white text-[#003566] shadow-lg hover:shadow-xl hover:-translate-y-2 border border-gray-100
                    ${loading ? 'opacity-50 cursor-not-allowed' : ''}
                  `}
                                >
                                    <img src={opt.imageSrc} alt={opt.title} className="w-16 h-16 object-contain mb-2" />
                                    <h3 className="text-xl font-['Rubik',_sans-serif] font-bold leading-tight">
                                        {opt.title}
                                    </h3>
                                    <p className="text-sm font-['Rubik',_sans-serif] leading-relaxed px-2 text-[#003566]/80">
                                        {opt.subtitle}
                                    </p>
                                </div>
                            ))}
                        </div>

                        <p className="mt-4 text-[#003566] text-xs md:text-sm font-['Rubik',_sans-serif] opacity-80 text-center">
                            אל דאגה, ניתן לשנות את הבחירה בכל עת.
                        </p>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default CVChoiceModal;
