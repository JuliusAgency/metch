import { Card } from "@/components/ui/card";

const InsightsContent = ({ 
  totalApplications = 0, 
  responses = 0, 
  conversionRate = 0,
  avgCvOpeningTime = null,
  insights = []
}) => {
  const getConversionRateMessage = () => {
    if (conversionRate === 0) {
      return "עדיין לא קיבלת תגובות. המשך לשלוח מועמדויות!";
    } else if (conversionRate < 20) {
      return "יחס ההמרה שלך נמוך מהממוצע. נסה להתאים את קורות החיים לכל משרה ספציפית.";
    } else if (conversionRate >= 25) {
      return "זהו יחס טוב מהממוצע, שמעיד שהקורות חיים שלך מצליחים לבלוט – אבל יש עוד מקום לשיפור.";
    } else {
      return "יחס ההמרה שלך סביב הממוצע. המשך לשפר את קורות החיים שלך.";
    }
  };

  return (
    <Card className="bg-gray-50/80 p-6 md:p-8 rounded-2xl border border-gray-200/80 shadow-inner">
        <div className="space-y-6 text-right">
            <div>
                <h2 className="font-bold text-blue-600 text-lg mb-3">ביצועי קורות החיים שלך</h2>
                <ul className="list-disc list-inside space-y-2 text-gray-700">
                    <li>סה״כ משרות שנשלחו אליהן קורות חיים: {totalApplications}</li>
                    <li>פניות חוזרות (ראיונות, יצירת קשר): {responses}</li>
                    <li>יחס המרה (response rate): {conversionRate}%</li>
                </ul>
                <p className="mt-3 text-gray-600">{getConversionRateMessage()}</p>
            </div>

            {insights.length > 0 && (
              <div className="border-t border-gray-200 pt-6">
                  <h2 className="font-bold text-blue-600 text-lg mb-3">תובנות מרכזיות</h2>
                  <ul className="list-disc list-inside space-y-2 text-gray-700">
                      {insights.map((insight, index) => (
                        <li key={index}>{insight}</li>
                      ))}
                  </ul>
              </div>
            )}
        </div>
    </Card>
);
};

export default InsightsContent;