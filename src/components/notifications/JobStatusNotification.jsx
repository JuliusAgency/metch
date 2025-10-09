import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, Clock, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const NOTIFICATION_CONFIG = {
  filled: {
    icon: CheckCircle,
    title: "המשרה אוישה בהצלחה!",
    message: "מזל טוב! המועמד שבחרת אושר למשרה",
    bgColor: "bg-green-50",
    borderColor: "border-green-200",
    iconColor: "text-green-600"
  },
  filled_via_metch: {
    icon: CheckCircle, 
    title: "המשרה אוישה דרך Metch!",
    message: "מעולה! המועמד נמצא דרך המערכת שלנו",
    bgColor: "bg-purple-50",
    borderColor: "border-purple-200",
    iconColor: "text-purple-600"
  },
  closed: {
    icon: XCircle,
    title: "המשרה נסגרה",
    message: "המשרה הוסרה מהמערכת וכל הצ'אטים הושבתו",
    bgColor: "bg-red-50", 
    borderColor: "border-red-200",
    iconColor: "text-red-600"
  },
  paused: {
    icon: Clock,
    title: "המשרה הושהתה",
    message: "המשרה הושהתה זמנית ולא תוצג למועמדים חדשים",
    bgColor: "bg-yellow-50",
    borderColor: "border-yellow-200", 
    iconColor: "text-yellow-600"
  }
};

export default function JobStatusNotification({ 
  status, 
  jobTitle, 
  isVisible, 
  onClose,
  autoCloseDelay = 5000 
}) {
  React.useEffect(() => {
    if (isVisible && autoCloseDelay > 0) {
      const timer = setTimeout(() => {
        onClose();
      }, autoCloseDelay);
      
      return () => clearTimeout(timer);
    }
  }, [isVisible, autoCloseDelay, onClose]);

  if (!status || !NOTIFICATION_CONFIG[status]) return null;

  const config = NOTIFICATION_CONFIG[status];
  const Icon = config.icon;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -100, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -100, scale: 0.9 }}
          className="fixed top-4 right-1/2 translate-x-1/2 z-[200] max-w-md w-full mx-4"
          dir="rtl"
        >
          <Card className={`${config.bgColor} ${config.borderColor} border-2 shadow-xl`}>
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <Icon className={`w-6 h-6 ${config.iconColor} flex-shrink-0 mt-0.5`} />
                <div className="flex-1">
                  <h4 className="font-bold text-gray-900 mb-1">
                    {config.title}
                  </h4>
                  <p className="text-sm text-gray-700 mb-2">
                    {config.message}
                  </p>
                  {jobTitle && (
                    <p className="text-xs text-gray-600 font-medium">
                      משרה: {jobTitle}
                    </p>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onClose}
                  className="rounded-full hover:bg-black/10 w-8 h-8 flex-shrink-0"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </AnimatePresence>
  );
}