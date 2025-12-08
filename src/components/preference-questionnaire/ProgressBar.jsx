import React from 'react';
import { cn } from "@/lib/utils";

export default function ProgressBar({ currentStep, totalSteps = 2 }) {
    // We render standard LTR DOM order, but RTL direction handles the visual order.
    // Actually, if dir="rtl", first child is on the Right.
    // Step 1 is "First", so it should be the Rightmost bar.
    // Step 2 is "Second", so it should be to the Left of Step 1.

    // So:
    // [Step 1 (Right)] [Step 2 (Left)]

    return (
        <div className="flex gap-2 w-[120px] mb-8" dir="rtl">
            {/* Bar 1: Step 1 */}
            <div
                className={cn(
                    "h-1.5 flex-1 rounded-full transition-colors duration-300",
                    currentStep >= 1 ? "bg-green-400" : "bg-gray-200"
                )}
            />

            {/* Bar 2: Step 2 */}
            <div
                className={cn(
                    "h-1.5 flex-1 rounded-full transition-colors duration-300",
                    currentStep >= 2 ? "bg-green-400" : "bg-gray-200"
                )}
            />
        </div>
    );
}
