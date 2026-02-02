/* eslint-disable no-unused-vars */
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
import { ClipboardCheck, Check, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { motion, AnimatePresence } from 'framer-motion';

import profileSuccessIcon from '@/assets/profile-success-icon.png';
import popupUpdatedFullV2 from '@/assets/popup-updated-full-v2.png';
import popupCardBg from '@/assets/popup-card-background.png';

import popupCompletedFull from '@/assets/popup-completed-full.png';

/**
 * ProfileUpdatedDialog - Success dialog for profile update
 * Matches design: "הפרופיל עודכן !" or "הפרופיל הושלם בהצלחה"
 */
export function ProfileUpdatedDialog({
    open,
    onOpenChange,
    title = "הפרופיל עודכן !",
    description = "עדכון קטן - קפיצה גדולה לקריירה",
    redirectUrl = null
}) {
    const navigate = useNavigate();

    const handleClose = () => {
        onOpenChange(false);
        navigate(redirectUrl || createPageUrl('Dashboard'), { replace: true });
    };

    const isUpdated = title === "הפרופיל עודכן !";
    const isCompleted = title === "הפרופיל הושלם בהצלחה";

    // Specific mobile-first design for completion success
    if (isCompleted) {
        return (
            <AlertDialog open={open} onOpenChange={onOpenChange}>
                <AlertDialogContent
                    overlayClassName="bg-[#dbecf3]/95 backdrop-blur-sm"
                    className="w-[98%] max-w-sm bg-white rounded-[40px] p-8 md:p-10 text-center shadow-[0_10px_40px_rgba(0,0,0,0.08)] border-none relative overflow-visible"
                >

                    {/* Centered Checkmark Icon with Glow */}
                    <div className="relative mx-auto mb-8 w-24 h-24 flex items-center justify-center">
                        {/* Glow Effect */}
                        <div className="absolute inset-0 bg-blue-100 rounded-full blur-2xl opacity-60 animate-pulse"></div>
                        <div className="relative w-24 h-24 rounded-full bg-[#E5F2FF] flex items-center justify-center shadow-inner">
                            <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center shadow-sm">
                                <Check className="w-8 h-8 text-[#2987CD] stroke-[3.5px]" />
                            </div>
                        </div>

                        {/* Top Right Sparkles */}
                        <div className="absolute -top-1 -right-4 flex flex-col gap-1 items-start rotate-[10deg]">
                            <Sparkles className="w-6 h-6 text-[#2987CD]/80 fill-[#2987CD]/40" />
                            <Sparkles className="w-4 h-4 text-[#2987CD]/60 ml-4 fill-[#2987CD]/20" />
                        </div>
                    </div>

                    {/* Title Area */}
                    <div className="relative mb-10 w-full">
                        {/* Left Sparkles */}
                        <div className="absolute -left-2 -top-6 flex flex-col gap-1 rotate-[-15deg]">
                            <Sparkles className="w-6 h-6 text-[#2987CD]/80 fill-[#2987CD]/40" />
                            <Sparkles className="w-3 h-3 text-[#2987CD]/60 ml-4 fill-[#2987CD]/20" />
                        </div>

                        <AlertDialogTitle className="text-2xl font-bold text-[#003B71] text-center leading-tight">
                            {title}
                        </AlertDialogTitle>
                    </div>

                    {/* Footer Button */}
                    <AlertDialogFooter className="flex justify-center sm:justify-center p-0">
                        <AlertDialogAction
                            onClick={handleClose}
                            className="w-full h-14 rounded-full bg-[#2987CD] hover:bg-[#206fa6] text-white font-bold text-xl shadow-lg shadow-blue-100 transition-all active:scale-95 flex items-center justify-center"
                        >
                            לעמוד הראשי
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        );
    }

    // Existing logic for "Updated" (Image based)
    if (isUpdated) {
        return (
            <AlertDialog open={open} onOpenChange={onOpenChange}>
                <AlertDialogContent className="w-auto h-auto max-w-none p-0 bg-transparent border-none shadow-none overflow-visible flex items-center justify-center">
                    <div className="relative inline-block">
                        <img
                            src={popupUpdatedFullV2}
                            alt={title}
                            className="w-auto h-auto max-w-[500px] max-h-[650px] object-contain pointer-events-none"
                        />
                        <button
                            onClick={handleClose}
                            className="absolute bottom-[19%] left-1/2 -translate-x-1/2 w-[261px] h-[45px] bg-transparent cursor-pointer outline-none mobile-tap-highlight-transparent z-50 rounded-full"
                            aria-label="לעמוד הראשי"
                        />
                    </div>
                </AlertDialogContent>
            </AlertDialog>
        );
    }

    // Default rendering
    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent className="max-w-sm bg-white rounded-3xl p-8 text-center shadow-2xl">
                <div className="mx-auto mb-6 flex justify-center">
                    <img
                        src={profileSuccessIcon}
                        alt="Success"
                        className="w-24 h-24 object-contain"
                    />
                </div>
                <AlertDialogHeader className="space-y-2">
                    <AlertDialogTitle className="text-2xl font-bold text-[#1E3A8A] text-center">
                        {title}
                    </AlertDialogTitle>
                    <AlertDialogDescription className="text-base text-[#1E3A8A]/80 text-center font-medium">
                        {description}
                    </AlertDialogDescription>
                </AlertDialogHeader>
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
