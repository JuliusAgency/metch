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

import profileSuccessIcon from '@/assets/profile-success-icon.png';
import popupUpdatedFullV2 from '@/assets/popup-updated-full-v2.png';
import popupCardBg from '@/assets/popup-card-background.png';

import popupCompletedFull from '@/assets/popup-completed-full.png';

/**
 * ProfileUpdatedDialog - Success dialog for profile update
 * Matches design: "הפרופיל עודכן !" or "הפרופיל הושלם בהצלחה"
 */
export function ProfileUpdatedDialog({ open, onOpenChange, title = "הפרופיל עודכן !", description = "עדכון קטן - קפיצה גדולה לקריירה" }) {
    const navigate = useNavigate();

    const handleClose = () => {
        onOpenChange(false);
        navigate(createPageUrl('Dashboard'));
    };

    // Unified logic for both "Updated" and "Completed" popups using full images
    const isUpdated = title === "הפרופיל עודכן !";
    const isCompleted = title === "הפרופיל הושלם בהצלחה";

    if (isUpdated || isCompleted) {
        const imageSrc = isUpdated ? popupUpdatedFullV2 : popupCompletedFull;

        return (
            <AlertDialog open={open} onOpenChange={onOpenChange}>
                <AlertDialogContent className="w-auto h-auto max-w-none p-0 bg-transparent border-none shadow-none overflow-visible flex items-center justify-center">

                    <div className="relative inline-block">
                        {/* The popup content itself - No extra background */}
                        <img
                            src={imageSrc}
                            alt={title}
                            className="w-auto h-auto max-w-[500px] max-h-[650px] object-contain pointer-events-none"
                        />

                        {/* Invisible clickable area for the button */}
                        <button
                            onClick={handleClose}
                            className="absolute bottom-[10%] left-1/2 -translate-x-1/2 w-[80%] h-[12%] bg-transparent cursor-pointer outline-none mobile-tap-highlight-transparent z-50 rounded-full"
                            aria-label="לעמוד הראשי"
                        />
                    </div>

                </AlertDialogContent>
            </AlertDialog>
        );
    }

    // Default rendering (for "Profile Completed" or other cases)
    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent className="max-w-sm bg-white rounded-3xl p-8 text-center shadow-2xl">
                {/* Glowing Icon Container */}
                <div className="mx-auto mb-6 flex justify-center">
                    <img
                        src={profileSuccessIcon}
                        alt="Success"
                        className="w-24 h-24 object-contain"
                    />
                </div>

                {/* Content */}
                <AlertDialogHeader className="space-y-2">
                    <AlertDialogTitle className="text-2xl font-bold text-[#1E3A8A] text-center">
                        {title}
                    </AlertDialogTitle>
                    <AlertDialogDescription className="text-base text-[#1E3A8A]/80 text-center font-medium">
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
