import React from 'react';
import { motion } from 'framer-motion';
import { User, Briefcase, GraduationCap, Award, Sparkles, List, Eye } from 'lucide-react';

const ICONS = [User, Briefcase, GraduationCap, Award, Sparkles, List, Eye];

export default function CVStepper({ currentStep, steps, onStepSelect, disabledSteps = [] }) {
  return (
    <div className="flex justify-center items-center w-full max-w-5xl mx-auto py-4 flex-wrap gap-3" dir="rtl">
      {steps.map((step, index) => {
        const isActive = index === currentStep;
        const isCompleted = index < currentStep;
        const Icon = ICONS[index] || User;

        const isClickable = typeof onStepSelect === 'function';
        const isDisabled = disabledSteps.includes(index);

        const stateClasses = isDisabled
          ? 'bg-gray-100 border-2 border-gray-200 text-gray-400 opacity-60'
          : isActive
          ? 'bg-[#2987CD] text-white border-2 border-transparent'
          : isCompleted
          ? 'bg-[#7ECD8B] text-white border-2 border-transparent'
          : 'bg-white border-2 border-[#2987CD] text-[#2987CD]';

        const cursorClasses = isClickable && !isDisabled ? 'cursor-pointer hover:opacity-90' : 'cursor-not-allowed';

        return (
          <motion.button
            key={index}
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
            onClick={() => isClickable && !isDisabled && onStepSelect(index)}
            type="button"
            className={`flex items-center gap-2 rounded-full px-5 py-2.5 font-semibold text-sm transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2
              ${stateClasses}
              ${cursorClasses}
            `
            }
            disabled={!isClickable || isDisabled}
          >
            <Icon className="w-5 h-5" />
            <span>{step}</span>
          </motion.button>
        );
      })}
    </div>
  );
}
