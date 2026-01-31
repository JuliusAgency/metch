import React, { useState } from 'react';
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Sparkles, Loader2 } from "lucide-react";
import { Core } from '../../api/integrations';
import { toast } from "sonner";

export default function Step6_Summary({ data, setData }) {
    const [isImproving, setIsImproving] = useState(false);

    const handleImproveText = async () => {
        if (!data || data.trim().length < 10) {
            toast.error("נא לכתוב לפחות כמה מילים כדי שנוכל לשפר אותן");
            return;
        }

        const assistantId = import.meta.env.VITE_REWRITE_EMPLOYEE_SUMMARY;
        if (!assistantId) {
            console.error("VITE_REWRITE_EMPLOYEE_SUMMARY is missing");
            toast.error("חסרה הגדרת Assistant במערכת");
            return;
        }

        setIsImproving(true);
        try {
            const response = await Core.InvokeAssistant({
                assistantId: assistantId,
                prompt: `Improve the following professional summary for a CV. Make it professional, concise, and impressive. 
                You must output the result in Hebrew language only, regardless of the input language.
                
                Input text:
                "${data}"
                
                Output only the improved text in Hebrew, nothing else.`
            });

            if (response.content) {
                let cleanContent = response.content.trim();

                // Remove markdown code blocks if present
                cleanContent = cleanContent.replace(/^```json\s*/g, '').replace(/^```\s*/g, '').replace(/\s*```$/g, '');

                try {
                    const parsed = JSON.parse(cleanContent);
                    if (parsed.summary) {
                        cleanContent = parsed.summary;
                    } else if (parsed.text) {
                        cleanContent = parsed.text;
                    }
                } catch (e) {
                    // Not a JSON object, use as is
                }

                setData(cleanContent);
                toast.success("הטקסט שופר בהצלחה!");
            }
        } catch (error) {
            console.error("Error improving text:", error);
            if (error.message.includes('429')) {
                toast.error("שגיאת עומס/מכסה: נראה שנגמרה מכסת השימוש ב-AI או שיש עומס. אנא נסה שוב מאוחר יותר.");
            } else {
                toast.error("אירעה שגיאה בשיפור הטקסט. אנא נסה שוב.");
            }
        } finally {
            setIsImproving(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto text-center" dir="rtl">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">תמצית</h2>
            <p className="text-gray-600 mb-6 md:mb-12 max-w-[320px] md:max-w-lg mx-auto">בחלק הזה תכתבו בצורה חופשית מי אתם ומה אתם מחפשים ואנחנו כבר נסנן אם זה עבורכם</p>

            <div className="bg-white/40 backdrop-blur-sm rounded-3xl p-6 pb-12 md:p-8 shadow-[0_2px_12px_rgba(0,0,0,0.08)] mx-3 md:mx-0">
                <div className="relative">
                    <Textarea
                        placeholder="לדוגמה: אני אדם חרוץ ואחראי, יודע לעבוד בלחץ..."
                        value={data}
                        onChange={(e) => setData(e.target.value)}
                        className="min-h-[350px] md:min-h-[300px] text-right bg-white/50 border-transparent focus:border-blue-400 focus:ring-0 rounded-2xl p-4 text-gray-700 placeholder:text-gray-400"
                    />
                    <div className="absolute bottom-3 left-3 hidden md:block">
                        <Button
                            variant="ghost"
                            size="sm"
                            className="text-purple-600 hover:text-purple-700 hover:bg-purple-50 gap-2 transition-all duration-300"
                            onClick={handleImproveText}
                            disabled={isImproving || !data}
                        >
                            {isImproving ? (
                                <div className="w-4 h-4 border-t-2 border-current rounded-full animate-spin"></div>
                            ) : (
                                <Sparkles className="w-4 h-4" />
                            )}
                            {isImproving ? 'משפר...' : 'שפר באמצעות AI'}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}