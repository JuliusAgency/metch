import React from 'react';
import { motion } from 'framer-motion';
import { UserRound, BriefcaseBusiness, GraduationCap, Medal, Sparkles, LayoutList } from 'lucide-react';

const ICONS = [UserRound, BriefcaseBusiness, GraduationCap, Medal, Sparkles, LayoutList];

export default function CVStepper({ currentStep, steps, onStepSelect, disabledSteps = [] }) {
  return (
    <div className="flex justify-center items-center w-full max-w-5xl mx-auto py-2 flex-wrap gap-2 md:gap-4" dir="rtl">
      {steps.map((step, index) => {
        const isActive = index === currentStep;
        const isCompleted = index < currentStep;
        const Icon = ICONS[index] || UserRound;

        const isClickable = typeof onStepSelect === 'function';
        const isDisabled = disabledSteps.includes(index);

        const stateClasses = isDisabled
          ? 'bg-gray-50 text-gray-400 opacity-50'
          : isActive
            ? 'bg-[#2987CD] text-white shadow-md'
            : isCompleted
              ? 'bg-[#7ECD8B]/10 text-[#2987CD]'
              : 'bg-[#F8FAFC] text-gray-500 hover:bg-gray-100';

        const cursorClasses = isClickable && !isDisabled ? 'cursor-pointer' : 'cursor-not-allowed';

        return (
          <motion.button
            key={index}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.2, delay: index * 0.03 }}
            onClick={() => isClickable && !isDisabled && onStepSelect(index)}
            type="button"
            className={`flex items-center gap-2 rounded-full px-4 py-2 font-medium text-xs md:text-sm transition-all duration-200 focus:outline-none 
              ${stateClasses}
              ${cursorClasses}
            `
            }
            disabled={!isClickable || isDisabled}
          >
            <Icon className={`w-4 h-4 md:w-5 md:h-5 ${isActive ? 'text-white' : ''}`} />
            <span className="whitespace-nowrap">{step}</span>
          </motion.button>
        );
      })}
    </div>
  );
}
