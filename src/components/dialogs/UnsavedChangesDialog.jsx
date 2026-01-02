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
            <AlertDialogContent className="w-[90%] max-w-[400px] bg-white rounded-[20px] p-0 overflow-hidden border-0 shadow-2xl gap-0">
                <div className="flex flex-col items-center pt-8 pb-6 px-4 text-center">
                    {/* Icon - Using the uploaded red alert icon */}
                    <div className="mb-6 relative">
                        <div className="w-20 h-20 flex items-center justify-center">
                            <img
                                src="/assets/images/popup-alert-icon.png"
                                alt="Alert"
                                className="w-full h-full object-contain"
                            />
                        </div>
                    </div>

                    {/* Title */}
                    <AlertDialogHeader className="space-y-4 mb-8 w-full">
                        <AlertDialogTitle className="text-2xl font-bold text-[#0E1B4D] text-center" style={{ fontFamily: 'Rubik, sans-serif' }}>
                            ?האם אתה בטוח שברצונך לסיים
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-base text-[#6B7280] text-center font-medium">
                            פרופיל מלא משפר את סיכוי ההשמה
                        </AlertDialogDescription>
                    </AlertDialogHeader>

                    {/* Actions */}
                    <div className="w-full space-y-4 px-4 pb-4">
                        <AlertDialogAction
                            onClick={onConfirm}
                            className="w-full h-14 rounded-full bg-[#2987CD] hover:bg-[#206FA8] text-white font-bold text-xl shadow-none transition-all duration-200"
                        >
                            להשלמת פרופיל
                        </AlertDialogAction>

                        <AlertDialogCancel
                            onClick={onCancel}
                            className="w-full h-14 rounded-full bg-white border border-[#D1D5DB] hover:bg-gray-50 text-[#0E1B4D] font-bold text-xl shadow-none mt-0"
                            style={{ marginTop: '1rem' }}
                        >
                            סיום
                        </AlertDialogCancel>
                    </div>
                </div>
            </AlertDialogContent>
        </AlertDialog>
    );
}
