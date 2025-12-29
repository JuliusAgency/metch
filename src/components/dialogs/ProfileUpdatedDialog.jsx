import React from 'react';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ClipboardCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';

/**
 * ProfileUpdatedDialog - Success dialog for profile update
 * Matches design: "הפרופיל עודכן!"
 */
export function ProfileUpdatedDialog({ open, onOpenChange, title = "הפרופיל עודכן!", description = "עדכון קטן - קפיצה גדולה לקריירה" }) {
    const navigate = useNavigate();

    const handleClose = () => {
        onOpenChange(false);
        navigate(createPageUrl('Dashboard'));
    };

    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent className="max-w-sm bg-white rounded-3xl p-8 text-center shadow-2xl">
                {/* Glowing Icon Container */}
                <div className="mx-auto mb-6 relative w-20 h-20 flex items-center justify-center">
                    <div className="absolute inset-0 bg-blue-100 rounded-full blur-xl opacity-50" />
                    <div className="relative w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center border-2 border-white shadow-sm">
                        <ClipboardCheck className="w-8 h-8 text-blue-500" />
                    </div>
                </div>

                {/* Content */}
                <AlertDialogHeader className="space-y-2">
                    <AlertDialogTitle className="text-2xl font-black text-[#0F172A] text-center">
                        {title}
                    </AlertDialogTitle>
                    <AlertDialogDescription className="text-base text-[#475569] text-center font-medium">
                        {description}
                    </AlertDialogDescription>
                </AlertDialogHeader>

                {/* Action */}
                <AlertDialogFooter className="mt-8">
                    <AlertDialogAction
                        onClick={handleClose}
                        className="w-full h-12 rounded-full bg-[#2987CD] hover:bg-[#206fa6] text-white font-bold text-lg shadow-lg hover:shadow-xl transition-all"
                    >
                        לעמוד הראשי
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
