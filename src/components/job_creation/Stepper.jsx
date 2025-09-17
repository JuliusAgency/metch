import { Fragment } from 'react';
import { motion } from 'framer-motion';

export default function Stepper({ currentStep, steps }) {
  return (
    <div className="flex justify-center items-center w-full max-w-2xl mx-auto py-8">
      {steps.map((step, index) => {
        const stepIndex = index + 1;
        const isActive = stepIndex === currentStep;
        const isCompleted = stepIndex < currentStep;

        return (
          <Fragment key={stepIndex}>
            <div className="flex flex-col items-center relative">
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center transition-all duration-300 ${
                  isActive ? 'bg-green-500 scale-110' : isCompleted ? 'bg-green-500' : 'bg-gray-200'
                }`}
              >
              </div>
            </div>
            {stepIndex < steps.length && (
              <div className="flex-1 h-1 mx-2 rounded-full relative">
                <div className="absolute top-0 left-0 h-full w-full bg-gray-200 rounded-full" />
                <motion.div
                  className="absolute top-0 left-0 h-full bg-green-500 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: isCompleted ? '100%' : isActive ? '50%' : '0%' }}
                  transition={{ duration: 0.5, ease: "easeInOut" }}
                />
              </div>
            )}
          </Fragment>
        );
      })}
    </div>
  );
}