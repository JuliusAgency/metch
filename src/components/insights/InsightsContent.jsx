import { Card } from "@/components/ui/card";

const InsightsContent = () => (
    <Card className="bg-gray-50/80 p-6 md:p-8 rounded-2xl border border-gray-200/80 shadow-inner">
        <div className="space-y-6 text-right">
            <div>
                <h2 className="font-bold text-blue-600 text-lg mb-3">ביצועי קורות החיים שלך</h2>
                <ul className="list-disc list-inside space-y-2 text-gray-700">
                    <li>סה״כ משרות שנשלחו אליהן קורות חיים: 42</li>
                    <li>פניות חוזרות (ראיונות, יצירת קשר): 11</li>
                    <li>יחס המרה (response rate): 26%</li>
                </ul>
                <p className="mt-3 text-gray-600">זהו יחס טוב מהממוצע, שמעיד שהקורות חיים שלך מצליחים לבלוט – אבל יש עוד מקום לשיפור.</p>
            </div>

            <div className="border-t border-gray-200 pt-6">
                <h2 className="font-bold text-blue-600 text-lg mb-3">תובנות מרכזיות</h2>
                <ul className="list-disc list-inside space-y-2 text-gray-700">
                    <li>במשרות שדורשות יכולת מכירה, ההישגים שלך פחות ממוקדים. כדאי להוסיף תוצאות מדידות (לדוגמה: "העליתי מכירות ב-15% תוך 3 חודשים").</li>
                    <li>קובץ קורות החיים שלך נפתח בממוצע תוך 2.3 ימים.</li>
                </ul>
            </div>
        </div>
    </Card>
);

export default InsightsContent;