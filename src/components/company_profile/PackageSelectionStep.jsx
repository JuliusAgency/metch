import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Minus, ChevronRight, Sparkles } from "lucide-react";
import { motion } from "framer-motion";

export default function PackageSelectionStep({ packageData = {}, setPackageData, onBack }) {
  const [quantity, setQuantity] = useState(packageData.quantity || 1);
  const pricePerJob = 499;

  const handleQuantityChange = (amount) => {
    const newQuantity = Math.max(1, quantity + amount);
    setQuantity(newQuantity);
    if (setPackageData) {
      setPackageData({
        type: 'per_job',
        quantity: newQuantity,
        price: pricePerJob * newQuantity
      });
    }
  };

  return (
    <div className="max-w-4xl mx-auto text-center" dir="rtl">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="space-y-8"
      >


        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">למצוא את המועמד המדויק</h1>
          <p className="text-gray-600">בעזרת הבינה המלאכותית של מאצ'</p>
        </div>

        {/* Quantity Selector - Delicate Pill Design */}
        <div className="flex justify-center mb-8">
          <div className="bg-white border border-gray-200 rounded-full px-4 py-2 flex items-center justify-between w-[220px] shadow-sm">
            <button
              onClick={() => handleQuantityChange(-1)}
              disabled={quantity <= 1}
              className="w-8 h-8 rounded-full bg-[#f0f4f8] text-[#1E3A8A] flex items-center justify-center hover:bg-[#e1eaf0] transition-colors text-xl font-medium disabled:opacity-50"
            >
              -
            </button>
            <span className="text-3xl font-bold text-[#1E3A8A] font-['Rubik']">{quantity}</span>
            <button
              onClick={() => handleQuantityChange(1)}
              className="w-8 h-8 rounded-full bg-[#1e293b] text-white flex items-center justify-center hover:bg-[#0f172a] transition-colors text-xl font-medium"
            >
              +
            </button>
          </div>
        </div>

        {/* Pricing Card */}
        <div className="bg-white rounded-[30px] border border-gray-100 shadow-[0_4px_20px_rgba(0,0,0,0.03)] p-8 md:p-10 max-w-3xl mx-auto relative overflow-hidden">
          <div className="flex flex-col md:flex-row gap-8 items-start justify-between relative z-10 w-full h-full">

            {/* Price Section (Visually Right in RTL) */}
            <div className="flex-1 flex flex-col items-center md:items-start order-3 md:order-1 pt-2">
              <div className="bg-[#EBF5FF] text-[#003566] px-4 py-1.5 rounded-full text-xs font-medium mb-3 inline-block">
                תשלום חד פעמי
              </div>
              <div className="flex items-center gap-2 text-[#003566]">
                <span className="text-5xl font-light font-['Rubik']">₪{pricePerJob * quantity}</span>
                <span className="text-xl font-light">/ למשרה</span>
              </div>
            </div>

            {/* Vertical Divider for desktop */}
            <div className="hidden md:block w-px self-stretch bg-gray-100 order-2 mx-10"></div>

            {/* Divider for mobile */}
            <div className="h-px w-full bg-gray-100 md:hidden order-2"></div>

            {/* Features Section (Visually Left in RTL) */}
            <div className="flex-1 w-full order-1 md:order-3 text-right">
              <h3 className="text-lg font-bold text-[#003566] mb-4">מה כולל?</h3>
              <ul className="space-y-3 pr-0">
                {[
                  'פרסום למשך 30 ימים',
                  'אפשרות לערוך את המשרה בכל רגע',
                  'ניתוח ומסקנות מועמד בעזרת AI',
                  'כולל שאלון סינון',
                  'צ׳אט ישיר עם מועמדים'
                ].map((feature, idx) => (
                  <li key={idx} className="flex items-center gap-2.5 justify-start text-[#003566] font-normal text-sm">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#003566] flex-shrink-0"></div>
                    <span className="text-right leading-tight">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}