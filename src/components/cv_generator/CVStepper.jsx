import React from 'react';
import { motion } from 'framer-motion';
import { User, Briefcase, GraduationCap, Award, Sparkles, List, Eye } from 'lucide-react';

const ICONS = [User, Briefcase, GraduationCap, Award, Sparkles, List, Eye];

export default function CVStepper({ currentStep, steps }) {
  return (
    <div className="flex justify-center items-center w-full max-w-5xl mx-auto py-4 flex-wrap gap-3" dir="rtl">
      {steps.map((step, index) => {
        const isActive = index === currentStep;
        const isCompleted = index < currentStep;
        const Icon = ICONS[index] || User;

        return (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
            className={`flex items-center gap-2 rounded-full px-5 py-2.5 font-semibold text-sm transition-all duration-300
              ${isActive 
                ? 'bg-[#2987CD] text-white border-2 border-transparent' 
                : isCompleted
                ? 'bg-[#7ECD8B] text-white border-2 border-transparent'
                : 'bg-white border-2 border-[#2987CD] text-[#2987CD]'
              }`
            }
          >
            <Icon className="w-5 h-5" />
            <span>{step}</span>
          </motion.div>
        );
      })}
    </div>
  );
}