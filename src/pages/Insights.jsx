import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import InsightsHeader from "@/components/insights/InsightsHeader";
import InsightsContent from "@/components/insights/InsightsContent";
import InsightChart from "@/components/insights/InsightChart";

export default function Insights() {
  const [chartData1, setChartData1] = useState([]);
  const [chartData2, setChartData2] = useState([]);
  const [chartData3, setChartData3] = useState([]);

  return (
    <div className="p-4 md:p-6" dir="rtl">
      <div className="w-[85vw] mx-auto">
        <Card className="bg-white rounded-2xl md:rounded-[2.5rem] shadow-xl border border-gray-100 overflow-hidden">
          <div className="relative">
            <InsightsHeader />
            <CardContent className="p-4 sm:p-6 md:p-8 -mt-6 relative z-10">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="space-y-8"
              >
                <div className="text-center flex items-center justify-center gap-2">
                  <Sparkles className="w-6 h-6 text-yellow-500" />
                  <h1 className="text-2xl md:text-3xl font-bold text-gray-900">התובנות שלי</h1>
                  <Sparkles className="w-6 h-6 text-yellow-500" />
                </div>
                <InsightsContent />
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
