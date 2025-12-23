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

        setIsImproving(true);
        try {
            const response = await Core.InvokeLLM({
                prompt: `Improve the following professional summary for a CV. Make it professional, concise, and impressive. 
                You must output the result in Hebrew language only, regardless of the input language.
                
                Input text:
                "${data}"
                
                Output only the improved text in Hebrew, nothing else.`,
                temperature: 0.7
            });

            if (response.content) {
                setData(response.content.trim());
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
        <div className="max-w-2xl mx-auto text-center" dir="rtl">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">תמצית מקצועית</h2>
            <p className="text-gray-600 mb-8">כתוב 2-3 משפטים שמסכמים את הניסיון והמטרות שלך. זה הדבר הראשון שמעסיקים קוראים.</p>

            <div className="relative">
                <Textarea
                    placeholder="לדוגמה: מנהל/ת מוצר עם 5 שנות ניסיון בבניית מוצרי SaaS. מתמחה באסטרטגיה ועבודה עם צוותי פיתוח. מחפש/ת את האתגר הבא שלי..."
                    value={data}
                    onChange={(e) => setData(e.target.value)}
                    className="min-h-[150px] text-right pb-12"
                />
                <div className="absolute bottom-3 left-3">
                    <Button
                        variant="ghost"
                        size="sm"
                        className="text-purple-600 hover:text-purple-700 hover:bg-purple-50 gap-2 transition-all duration-300"
                        onClick={handleImproveText}
                        disabled={isImproving || !data}
                    >
                        {isImproving ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <Sparkles className="w-4 h-4" />
                        )}
                        {isImproving ? 'משפר...' : 'שפר באמצעות AI'}
                    </Button>
                </div>
            </div>
        </div>
    );
}