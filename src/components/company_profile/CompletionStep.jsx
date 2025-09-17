import { Check, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";

export default function CompletionStep() {
  return (
    <div className="max-w-2xl mx-auto text-center" dir="rtl">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, type: "spring" }}
        className="space-y-8"
      >
        {/* Success Icon */}
        <div className="w-24 h-24 mx-auto bg-green-100 rounded-full flex items-center justify-center">
          <Check className="w-12 h-12 text-green-600" />
        </div>

        <div className="space-y-4">
          <h1 className="text-3xl font-bold text-gray-900">פרופיל החברה הושלם בהצלחה!</h1>
          <p className="text-gray-600 text-lg">
            עכשיו אתם מוכנים להתחיל לפרסם משרות ולמצוא את המועמדים הטובים ביותר
          </p>
        </div>

        {/* Features unlocked */}
        <div className="bg-blue-50 p-6 rounded-2xl border border-blue-200">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Sparkles className="w-5 h-5 text-blue-600" />
            <h3 className="font-bold text-blue-800">מה זמין לכם עכשיו</h3>
          </div>
          <div className="space-y-2 text-blue-700">
            <div className="flex items-center justify-center gap-2">
              <Check className="w-4 h-4 text-green-500" />
              <span>פרסום משרות עם פרופיל חברה מקצועי</span>
            </div>
            <div className="flex items-center justify-center gap-2">
              <Check className="w-4 h-4 text-green-500" />
              <span>חשיפה משופרת למועמדים איכותיים</span>
            </div>
            <div className="flex items-center justify-center gap-2">
              <Check className="w-4 h-4 text-green-500" />
              <span>כלי ניתוח ודוחות מתקדמים</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link to={createPageUrl("CreateJob")}>
            <Button className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-full font-bold text-lg shadow-lg w-full sm:w-auto">
              פרסם משרה ראשונה
            </Button>
          </Link>
          <Link to={createPageUrl("Dashboard")}>
            <Button variant="outline" className="border-gray-300 text-gray-700 hover:bg-gray-50 px-8 py-3 rounded-full font-bold text-lg w-full sm:w-auto">
              לדף הבית
            </Button>
          </Link>
        </div>
      </motion.div>
    </div>
  );
}