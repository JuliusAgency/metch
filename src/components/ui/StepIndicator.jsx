import React from 'react';

export default function StepIndicator({ totalSteps = 5, currentStep }) {
    return (
        <div className="flex justify-center mb-8" dir="rtl">
            <div className="flex gap-2.5">
                {Array.from({ length: totalSteps }).map((_, index) => (
                    <div
                        key={index}
                        className={`w-16 h-1.5 rounded-full transition-colors duration-300 ${index + 1 <= currentStep ? 'bg-[#86D2A4]' : 'bg-gray-200'
                            }`}
                    ></div>
                ))}
            </div>
        </div>
    );
}
