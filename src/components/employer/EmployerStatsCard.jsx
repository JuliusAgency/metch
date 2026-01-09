import React from "react";
import { Card, CardContent } from "@/components/ui/card";

export default function EmployerStatsCard({
  icon: Icon,
  title,
  value,
}) {
  return (
    <Card className="bg-white border border-gray-100 shadow-[0_8px_30px_-8px_rgba(0,0,0,0.12)] rounded-2xl h-full">
      <CardContent className="py-3 px-3 text-center flex flex-col items-center justify-center h-full">
        {/* Blue circle wrapper matching the design */}
        <div className="w-[44px] h-[44px] rounded-full border-[1.8px] flex items-center justify-center mb-2" style={{ borderColor: '#2987cd' }}>
          <Icon className="w-[22px] h-[22px] object-contain" style={{ imageRendering: '-webkit-optimize-contrast', filter: 'contrast(1.05)' }} />
        </div>

        <p className="text-blue-900 font-bold text-[15px] mb-0.5">{title}</p>
        <div className="text-[22px] text-gray-500 font-normal">{value}</div>
      </CardContent>
    </Card>
  );
}