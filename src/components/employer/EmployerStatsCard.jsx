import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, TrendingDown } from "lucide-react";

export default function EmployerStatsCard({ 
  icon: Icon, 
  title, 
  value, 
  subtitle = null,
  trend = null,
  trendValue = null,
  color = "bg-blue-50 text-blue-600"
}) {
  const getTrendIcon = () => {
    if (trend === 'up') return <TrendingUp className="w-3 h-3 text-green-500" />;
    if (trend === 'down') return <TrendingDown className="w-3 h-3 text-red-500" />;
    return null;
  };

  const getTrendColor = () => {
    if (trend === 'up') return 'text-green-600';
    if (trend === 'down') return 'text-red-600';
    return 'text-gray-500';
  };

  return (
    <Card className="bg-white border-gray-200/80 shadow-sm hover:shadow-md transition-all duration-300 rounded-2xl">
      <CardContent className="p-6 text-center">
        <div className={`w-12 h-12 ${color} rounded-full flex items-center justify-center mx-auto mb-3`}>
          <Icon className="w-6 h-6" />
        </div>
        <div className="text-2xl font-bold text-gray-900 mb-2">{value}</div>
        <p className="text-gray-600 font-medium text-sm mb-1">{title}</p>
        
        {subtitle && (
          <p className="text-xs text-gray-500">{subtitle}</p>
        )}
        
        {trend && trendValue && (
          <div className={`flex items-center justify-center gap-1 mt-2 text-xs ${getTrendColor()}`}>
            {getTrendIcon()}
            <span>{trendValue}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}