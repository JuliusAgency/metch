import React from "react";
import { Card, CardContent } from "@/components/ui/card";

export default function EmployerStatsCard({
  icon: Icon,
  title,
  value,
  color // Added ensuring we can pass color if needed, though mostly stylistic
}) {
  return (
    <Card className="bg-white border-[0.5px] md:border border-gray-100 shadow-md md:shadow-[0_8px_30px_-8px_rgba(0,0,0,0.12)] rounded-[8px] md:rounded-2xl w-[148px] md:w-full h-[97px] md:h-full">
      <CardContent className="py-2 md:py-3 px-2 md:px-3 text-center flex flex-col items-center justify-center h-full">
        {/* Blue circle wrapper matching the design */}
        <div className="w-[32px] md:w-[44px] h-[32px] md:h-[44px] rounded-full border-[1px] md:border-[1.8px] flex items-center justify-center mb-1 md:mb-2" style={{ borderColor: '#2987cd' }}>
          <Icon className="w-[18px] md:w-[22px] h-[18px] md:h-[22px] object-contain" style={{ imageRendering: '-webkit-optimize-contrast', filter: 'contrast(1.05)' }} />
        </div>

        <p className="text-blue-900 font-bold text-[12px] md:text-[15px] mb-0.5 leading-tight">{title}</p>
        <div className="text-[18px] md:text-[22px] text-gray-500 font-normal">{value}</div>
      </CardContent>
    </Card>
  );
}