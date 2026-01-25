import React from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { HelpCircle } from 'lucide-react';

export default function InfoPopup({ triggerText, title, content, children }) {
    return (
        <Dialog>
            <DialogTrigger asChild>
                <span className="text-blue-500 underline cursor-pointer hover:text-blue-700 text-sm font-medium inline-flex items-center gap-1">
                    {triggerText}
                </span>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md bg-white p-6 rounded-2xl" dir="rtl">
                {(title) && (
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold text-gray-900 text-center mb-2">
                            {title}
                        </DialogTitle>
                    </DialogHeader>
                )}
                <div className="text-center text-gray-700 leading-relaxed text-base">
                    {content || children}
                </div>
            </DialogContent>
        </Dialog>
    );
}
