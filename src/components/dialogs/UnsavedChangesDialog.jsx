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
            <AlertDialogContent className="max-w-md bg-white rounded-2xl p-8 text-center">
                {/* Icon */}
                <div className="w-16 h-16 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-4">
                    <AlertCircle className="w-8 h-8" />
                </div>

                {/* Title */}
                <AlertDialogHeader>
                    <AlertDialogTitle className="text-xl font-bold text-gray-900 text-center">
                        האם אתה בטוח שברצונך לסיים?
                    </AlertDialogTitle>
                    <AlertDialogDescription className="text-sm text-gray-600 text-center mt-2">
                        פרופיל מלא מעלה את סיכויי ההשמה
                    </AlertDialogDescription>
                </AlertDialogHeader>

                {/* Actions */}
                <AlertDialogFooter className="flex flex-col gap-3 mt-6 sm:flex-col">
                    <AlertDialogAction
                        onClick={onConfirm}
                        className="w-full h-10 rounded-full bg-[#2987CD] text-white font-semibold hover:bg-[#2987CD]/90"
                    >
                        להשלמת פרופיל
                    </AlertDialogAction>
                    <AlertDialogCancel
                        onClick={onCancel}
                        className="w-full text-gray-500 hover:text-gray-700 bg-transparent border-0 shadow-none"
                    >
                        סיום
                    </AlertDialogCancel>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
