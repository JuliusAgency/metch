import React from 'react';
import { Textarea } from "@/components/ui/textarea";

export default function Step6_Summary({ data, setData }) {
    return (
        <div className="max-w-2xl mx-auto text-center" dir="rtl">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">תמצית מקצועית</h2>
            <p className="text-gray-600 mb-8">כתוב 2-3 משפטים שמסכמים את הניסיון והמטרות שלך. זה הדבר הראשון שמעסיקים קוראים.</p>
            <Textarea
                placeholder="לדוגמה: מנהל/ת מוצר עם 5 שנות ניסיון בבניית מוצרי SaaS. מתמחה באסטרטגיה ועבודה עם צוותי פיתוח. מחפש/ת את האתגר הבא שלי..."
                value={data}
                onChange={(e) => setData(e.target.value)}
                className="min-h-[150px] text-right"
            />
        </div>
    );
}