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

export function WarningDialog({
    open,
    onOpenChange,
    title,
    description,
    onConfirm,
    confirmText = "כן, אני בטוח",
    cancelText = "ביטול"
}) {
    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent className="max-w-[360px] w-[90%] bg-white rounded-[24px] p-6 text-center shadow-2xl border-none gap-5">

                <div className="flex flex-col items-center gap-3">
                    {/* Icon above Title */}
                    <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center shrink-0">
                        <AlertCircle className="w-6 h-6 text-red-500" />
                    </div>
                    <AlertDialogTitle className="text-xl font-bold text-gray-900">
                        {title}
                    </AlertDialogTitle>

                    <AlertDialogDescription className="text-sm text-gray-500 text-center leading-relaxed px-2">
                        {description}
                    </AlertDialogDescription>
                </div>

                <div className="flex flex-col gap-2 w-full mt-2">
                    <AlertDialogAction
                        onClick={(e) => {
                            e.preventDefault();
                            onConfirm();
                        }}
                        className="w-full h-10 rounded-full bg-red-500 hover:bg-red-600 text-white font-bold text-base shadow-md shadow-red-100 transition-all"
                    >
                        {confirmText}
                    </AlertDialogAction>
                    <AlertDialogCancel
                        className="w-full h-10 rounded-full border-gray-200 text-gray-500 hover:bg-gray-50 hover:text-gray-700 font-semibold text-sm mt-0 border-0"
                    >
                        {cancelText}
                    </AlertDialogCancel>
                </div>
            </AlertDialogContent>
        </AlertDialog>
    );
}
