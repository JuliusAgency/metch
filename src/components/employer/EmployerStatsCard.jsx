import React from "react";
import { Card, CardContent } from "@/components/ui/card";

export default function EmployerStatsCard({
  icon: Icon,
  title,
  value,
}) {
  return (
    <Card className="bg-white border border-gray-100 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] rounded-2xl h-full">
      <CardContent className="p-6 text-center flex flex-col items-center justify-center h-full">
        {/* Blue circle wrapper matching the design */}
        <div className="w-16 h-16 rounded-full border-[1.8px] flex items-center justify-center mb-4" style={{ borderColor: '#2987cd' }}>
          <Icon className="w-9 h-9 object-contain" style={{ imageRendering: '-webkit-optimize-contrast', filter: 'contrast(1.05)' }} />
        </div>

        <p className="text-blue-900 font-bold text-base mb-2">{title}</p>
        <div className="text-3xl text-gray-500 font-normal">{value}</div>
      </CardContent>
    </Card>
  );
}