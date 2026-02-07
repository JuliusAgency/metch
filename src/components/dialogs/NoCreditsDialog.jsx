import React from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function NoCreditsDialog({ open, onOpenChange, isActivation = true }) {
    const navigate = useNavigate();

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]" dir="rtl">
                <DialogHeader>
                    <DialogTitle className="text-center text-xl font-bold font-['Rubik']">נגמרה חבילת המשרות</DialogTitle>
                </DialogHeader>
                <div className="text-center space-y-4 py-4 font-['Rubik']">
                    <p className="text-gray-600">
                        {isActivation
                            ? "אין לך יתרת משרות להפעלת משרה זו."
                            : "אין לך יתרת משרות לפרסום, לכן המשרה נשמרה כטיוטה בלבד."}
                        <br />
                        כדי לפרסם את המשרה, יש לרכוש חבילת משרות חדשה.
                    </p>
                    <div className="flex flex-col gap-3">
                        <Button
                            className="bg-blue-600 hover:bg-blue-700 text-white rounded-full w-full font-bold"
                            onClick={() => navigate(createPageUrl('Packages'))}
                        >
                            לרכישת חבילה
                        </Button>
                        <Button
                            variant="outline"
                            className="rounded-full w-full font-bold border-gray-200"
                            onClick={() => onOpenChange(false)}
                        >
                            סגור
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
