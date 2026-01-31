import React from 'react';
import { motion } from 'framer-motion';
import { User, Briefcase, GraduationCap, Award, Sparkles, List, Eye } from 'lucide-react';

const ICONS = [User, Briefcase, GraduationCap, Award, Sparkles, List, Eye];

export default function CVStepper({ currentStep, steps, mobileSteps, onStepSelect, disabledSteps = [] }) {
  const scrollRef = React.useRef(null);

  React.useEffect(() => {
    if (scrollRef.current) {
      const activeBtn = scrollRef.current.children[currentStep];
      if (activeBtn) {
        activeBtn.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }
    }
  }, [currentStep]);

  return (
    <div ref={scrollRef} className="flex flex-nowrap md:flex-wrap overflow-x-auto md:overflow-visible justify-start md:justify-center items-center w-full max-w-5xl mx-auto py-4 gap-2 md:gap-3 pr-6 md:pr-0 pl-4 md:pl-0 no-scrollbar" dir="rtl">
      {steps.map((step, index) => {
        const isActive = index === currentStep;
        const isCompleted = index < currentStep;
        const Icon = ICONS[index] || User;

        const isClickable = typeof onStepSelect === 'function';
        const isDisabled = disabledSteps.includes(index);

        const stateClasses = isActive
          ? 'bg-[#2987CD] text-white border-2 border-transparent'
          : isDisabled
            ? 'bg-transparent border-2 border-[#2987CD] text-[#2987CD] opacity-60'
            : isCompleted
              ? 'bg-[#7ECD8B] text-white border-2 border-transparent'
              : 'bg-transparent border-2 border-[#2987CD] text-[#2987CD]';

        const cursorClasses = isClickable && !isDisabled ? 'cursor-pointer hover:opacity-90' : 'cursor-not-allowed';

        return (
          <motion.button
            key={index}
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
            onClick={() => isClickable && !isDisabled && onStepSelect(index)}
            type="button"
            className={`flex flex-row items-center justify-center gap-1.5 md:gap-2 rounded-full px-3 md:px-5 py-2 md:py-2.5 font-semibold text-[11px] md:text-sm transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 flex-shrink-0 md:w-auto
              ${stateClasses}
              ${cursorClasses}
            `
            }
            disabled={!isClickable || isDisabled}
          >
            <Icon className="w-4 h-4 md:w-5 md:h-5 flex-shrink-0" />
            <span className="leading-tight whitespace-nowrap md:hidden">{mobileSteps ? mobileSteps[index] : step}</span>
            <span className="leading-tight whitespace-nowrap hidden md:inline">{step}</span>
          </motion.button>
        );
      })}
    </div>
  );
}
