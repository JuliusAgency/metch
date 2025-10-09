import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { ChevronLeft, Sparkles, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

// Mock data for the charts
const chartData1 = [
  { name: 'ינו', uv: 12 }, { name: 'פבר', uv: 19 }, { name: 'מרץ', uv: 15 },
  { name: 'אפר', uv: 22 }, { name: 'מאי', uv: 18 }, { name: 'יונ', uv: 25 }, { name: 'יול', uv: 20 }
];
const chartData2 = [
  { name: 'ינו', uv: 15 }, { name: 'פבר', uv: 13 }, { name: 'מרץ', uv: 18 },
  { name: 'אפר', uv: 16 }, { name: 'מאי', uv: 23 }, { name: 'יונ', uv: 21 }, { name: 'יול', uv: 24 }
];
const chartData3 = [
  { name: 'ינו', uv: 10 }, { name: 'פבר', uv: 15 }, { name: 'מרץ', uv: 12 },
  { name: 'אפר', uv: 18 }, { name: 'מאי', uv: 20 }, { name: 'יונ', uv: 17 }, { name: 'יול', uv: 22 }
];

const InsightChart = ({ data, percentage }) => (
  <Card className="bg-white p-4 rounded-xl shadow-md border border-gray-200">
    <div className="text-center font-bold text-blue-600 mb-2">{percentage}%</div>
    <ResponsiveContainer width="100%" height={120}>
      <AreaChart data={data} margin={{ top: 5, right: 0, left: 0, bottom: 5 }}>
        <defs>
          <linearGradient id="colorUv" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#8884d8" stopOpacity={0.4}/>
            <stop offset="95%" stopColor="#8884d8" stopOpacity={0}/>
          </linearGradient>
        </defs>
        <Tooltip
          contentStyle={{ 
            backgroundColor: 'rgba(255, 255, 255, 0.8)', 
            border: '1px solid #ccc',
            borderRadius: '10px'
          }}
          itemStyle={{ color: '#333' }}
        />
        <Area type="monotone" dataKey="uv" stroke="#8884d8" fillOpacity={1} fill="url(#colorUv)" />
        <XAxis dataKey="name" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
      </AreaChart>
    </ResponsiveContainer>
  </Card>
);

export default function Insights() {
  return (
    <div className="p-4 md:p-6" dir="rtl">
      <div className="w-[85vw] mx-auto">
        <Card className="bg-white rounded-2xl md:rounded-[2.5rem] shadow-xl border border-gray-100 overflow-hidden">
          <div className="relative">
            {/* Header with curved background */}
            <div className="relative h-24 overflow-hidden -m-px">
              <div
                className="absolute inset-0 w-full h-full [clip-path:ellipse(120%_100%_at_50%_100%)]"
                style={{
                  backgroundImage: 'url(https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/689c85a409a96fa6a10f1aca/d9fc7bd69_Rectangle6463.png)',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  backgroundRepeat: 'no-repeat'
                }}
              />
              <Link
                to={createPageUrl("Dashboard")}
                className="absolute top-4 right-6 w-10 h-10 bg-white/30 rounded-full flex items-center justify-center backdrop-blur-sm hover:bg-white/50 transition-colors z-10"
              >
                <ChevronLeft className="w-6 h-6 text-gray-800 rotate-180" />
              </Link>
            </div>

            <CardContent className="p-4 sm:p-6 md:p-8 -mt-6 relative z-10">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="space-y-8"
              >
                {/* Title */}
                <div className="text-center flex items-center justify-center gap-2">
                  <Sparkles className="w-6 h-6 text-yellow-500" />
                  <h1 className="text-2xl md:text-3xl font-bold text-gray-900">התובנות שלי</h1>
                  <Sparkles className="w-6 h-6 text-yellow-500" />
                </div>

                {/* Main Insights Card */}
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
                
                {/* Charts Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <InsightChart data={chartData1} percentage={15} />
                  <InsightChart data={chartData2} percentage={10} />
                  <InsightChart data={chartData3} percentage={18} />
                </div>

              </motion.div>
            </CardContent>
          </div>
        </Card>
      </div>
    </div>
  );
}