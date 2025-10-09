import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, XCircle, Clock, Users } from "lucide-react";
import { motion } from "framer-motion";

const STATUS_CONFIG = {
  filled: {
    icon: CheckCircle,
    title: "המשרה אוישה",
    message: "המשרה כבר אוישה על ידי מועמד אחר",
    bgColor: "bg-green-50",
    borderColor: "border-green-200",
    textColor: "text-green-800",
    iconColor: "text-green-600"
  },
  filled_via_metch: {
    icon: CheckCircle,
    title: "המשרה אוישה דרך Metch",
    message: "המשרה אוישה בהצלחה דרך המערכת שלנו",
    bgColor: "bg-purple-50",
    borderColor: "border-purple-200", 
    textColor: "text-purple-800",
    iconColor: "text-purple-600"
  },
  closed: {
    icon: XCircle,
    title: "המשרה נסגרה",
    message: "המעסיק החליט לסגור את המשרה",
    bgColor: "bg-red-50",
    borderColor: "border-red-200",
    textColor: "text-red-800",
    iconColor: "text-red-600"
  },
  paused: {
    icon: Clock,
    title: "המשרה מושהית זמנית",
    message: "המעסיק השהה את המשרה לזמן קצוב",
    bgColor: "bg-yellow-50",
    borderColor: "border-yellow-200",
    textColor: "text-yellow-800",
    iconColor: "text-yellow-600"
  }
};

export default function JobStatusBanner({ status, className = "" }) {
  if (!status || status === 'active' || status === 'draft') {
    return null;
  }

  const config = STATUS_CONFIG[status];
  if (!config) return null;

  const Icon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`${className}`}
    >
      <Card className={`${config.bgColor} ${config.borderColor} border-2`}>
        <CardContent className="p-4">
          <div className="flex items-center gap-3" dir="rtl">
            <Icon className={`w-6 h-6 ${config.iconColor} flex-shrink-0`} />
            <div>
              <h3 className={`font-bold text-lg ${config.textColor}`}>
                {config.title}
              </h3>
              <p className={`${config.textColor} opacity-80`}>
                {config.message}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}