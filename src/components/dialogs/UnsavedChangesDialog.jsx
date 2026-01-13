import React from 'react';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { AlertCircle } from 'lucide-react';

/**
 * UnsavedChangesDialog - Warning dialog for unsaved changes
 * Matches the design from mockup: "האם אתה בטוח שברצונך לסיים?"
 */
export function UnsavedChangesDialog({ open, onOpenChange, onConfirm, onCancel }) {
    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent className="w-[90%] max-w-[500px] bg-white rounded-[20px] p-0 overflow-hidden border-0 shadow-2xl gap-0">
                <div className="flex flex-col items-center pt-6 pb-5 px-6 text-center">
                    {/* Icon - Using the uploaded red alert icon */}
                    <div className="mb-4 relative">
                        <div className="w-20 h-20 flex items-center justify-center">
                            <img
                                src="/assets/images/popup-alert-icon.png"
                                alt="Alert"
                                className="w-full h-full object-contain"
                            />
                        </div>
                    </div>

                    {/* Title */}
                    <AlertDialogHeader className="space-y-3 mb-6 w-full px-2">
                        <AlertDialogTitle className="text-2xl font-bold text-[#0E1B4D] text-center" style={{ fontFamily: 'Rubik, sans-serif' }}>
                            האם ברצונך לסיים?
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-lg text-[#0E1B4D] text-center font-normal">
                           פרופיל מלא מביא מועמדים איכותיים ומעלה את סיכויי ההשמה
                        </AlertDialogDescription>
                    </AlertDialogHeader>

                    {/* Actions */}
                    <div className="w-full space-y-3 px-6 pb-2">
                        <AlertDialogAction
                            onClick={onConfirm}
                            className="w-full h-12 rounded-full bg-[#2987CD] hover:bg-[#206FA8] text-white font-bold text-xl shadow-none transition-all duration-200"
                        >
                            להשלמת פרופיל
                        </AlertDialogAction>

                        <AlertDialogCancel
                            onClick={onCancel}
                            className="w-full h-12 rounded-full bg-white border border-[#D1D5DB] hover:bg-gray-50 text-[#0E1B4D] font-bold text-xl shadow-none mt-0"
                            style={{ marginTop: '0.75rem' }}
                        >
                            סיום
                        </AlertDialogCancel>
                    </div>
                </div>
            </AlertDialogContent>
        </AlertDialog>
    );
}
