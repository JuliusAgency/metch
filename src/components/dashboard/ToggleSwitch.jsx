
import React from 'react';
import { motion } from 'framer-motion';

const ToggleSwitch = ({ options, value, onChange }) => {
    // options is array of { value: string, label: string }
    // value is the current selected value

    const activeIndex = options.findIndex(o => o.value === value);

    return (
        <div className="relative flex items-center bg-white border border-[#2563EB] rounded-full p-[2px] h-[46px] w-full md:w-[340px] shadow-sm select-none direction-ltr" dir="ltr">
            {/* Sliding Background */}
            <motion.div
                className="absolute top-[2px] bottom-[2px] bg-[#2C86D6] rounded-full shadow-sm z-0"
                initial={false}
                animate={{
                    left: activeIndex === 0 ? '2px' : '50%',
                    width: 'calc(50% - 2px)'
                }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
            />

            {/* Buttons */}
            {options.map((option, index) => {
                const isActive = value === option.value;
                return (
                    <button
                        key={option.value}
                        onClick={() => onChange(option.value)}
                        className={`relative z-10 flex-1 h-full text-base font-bold transition-colors duration-200 focus:outline-none ${isActive ? 'text-white' : 'text-[#6B7280]'
                            }`}
                    >
                        {option.label}
                    </button>
                );
            })}
        </div>
    );
};

export default ToggleSwitch;
