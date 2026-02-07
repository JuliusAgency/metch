import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Minus, ChevronRight, Sparkles, MessageCircle, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { useUser } from "@/contexts/UserContext";

export default function PackageSelectionStep({ packageData = {}, setPackageData, onBack }) {
  const { user } = useUser();
  const [quantity, setQuantity] = useState(packageData.quantity || 1);
  const navigate = useNavigate();
  const [isFreeJobEligible, setIsFreeJobEligible] = useState(false);
  const [checkingEligibility, setCheckingEligibility] = useState(true);

  // Check if user is eligible for free job
  useEffect(() => {
    const checkEligibility = async () => {
      if (!user?.email) return;
      try {
        if (user.profile?.is_free_job_redeemed) {
          setIsFreeJobEligible(false);
          setCheckingEligibility(false);
          return;
        }
        const { Job } = await import('@/api/entities');
        const userJobs = await Job.filter({ created_by: user.email });
        setIsFreeJobEligible(!userJobs || userJobs.length === 0);
      } catch (error) {
        console.error("Error checking free job eligibility:", error);
      } finally {
        setCheckingEligibility(false);
      }
    };
    checkEligibility();
  }, [user?.email, user.profile?.is_free_job_redeemed]);

  const getTierPrice = (qty) => {
    if (qty === 1) return 599;
    if (qty >= 2 && qty <= 3) return 550;
    if (qty >= 4 && qty <= 5) return 500;
    if (qty >= 6 && qty <= 7) return 450;
    if (qty >= 8 && qty <= 9) return 400;
    return 0; // 10+
  };

  const calculateTotal = (qty) => {
    const price = getTierPrice(qty);
    if (qty === 1) return isFreeJobEligible ? 0 : price;

    // If eligible for free job: first job is 0, rest are at tier price
    if (isFreeJobEligible) {
      return (qty - 1) * price;
    }
    return qty * price;
  };

  useEffect(() => {
    // Initial sync and sync on eligibility change
    if (setPackageData && !checkingEligibility) {
      setPackageData({
        type: 'per_job',
        quantity: quantity,
        price: calculateTotal(quantity)
      });
    }
  }, [checkingEligibility, quantity, isFreeJobEligible]);

  const handleQuantityChange = (amount) => {
    const newQuantity = Math.max(1, quantity + amount);
    setQuantity(newQuantity);

    const total = calculateTotal(newQuantity);

    if (setPackageData) {
      setPackageData({
        type: 'per_job',
        quantity: newQuantity,
        price: total
      });
    }
  };

  const handleContactSupport = () => {
    navigate(createPageUrl("Messages"), {
      state: { supportChat: true }
    });
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
          <p className="text-gray-600">בחרו כמות משרות</p>
        </div>

        {/* Quantity Selector - Delicate Pill Design */}
        <div className="flex justify-center mb-8">
          <div className="bg-white border-[1.5px] border-[#001a6e] rounded-full px-2 py-1 flex items-center gap-2 shadow-sm w-auto">
            {/* Plus Button - SVG */}
            <svg
              width="52"
              height="52"
              viewBox="0 0 52 52"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              onClick={() => handleQuantityChange(1)}
              style={{ width: '52px', height: '52px' }}
              className="cursor-pointer hover:scale-110 transition-transform"
            >
              <circle cx="26" cy="26" r="26" fill="#001a6e" />
              <path d="M26 19V33M19 26H33" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>

            <span className="text-2xl font-bold text-[#1E3A8A] font-['Rubik']">{quantity}</span>

            {/* Minus Button - SVG */}
            <svg
              width="52"
              height="52"
              viewBox="0 0 52 52"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              onClick={() => handleQuantityChange(-1)}
              style={{ width: '52px', height: '52px' }}
              className={`cursor-pointer transition-transform ${quantity <= 1 ? 'opacity-50 cursor-not-allowed' : 'hover:scale-110'}`}
            >
              <circle cx="26" cy="26" r="26" fill="#e2e8f0" />
              <path d="M19 26H33" stroke="#001a6e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </div>

        {/* Pricing Card */}
        <div className="bg-white rounded-[30px] border border-gray-100 shadow-[0_4px_20px_rgba(0,0,0,0.03)] py-8 px-10 max-w-[940px] mx-auto relative overflow-hidden">
          <div className="flex flex-col md:flex-row items-stretch relative z-10 w-full" dir="rtl">

            {/* Price Section (Right side in RTL) */}
            <div className="flex-1 flex flex-col items-center justify-start py-4">
              <div className="bg-[#EBF5FF] text-[#003566] px-4 py-1.5 rounded-full text-xs font-medium mb-6">
                {quantity >= 10 ? 'פנייה לנציג' : 'תשלום חד פעמי'}
              </div>

              <div className="flex flex-col items-center">
                {quantity >= 10 ? (
                  <Button
                    onClick={handleContactSupport}
                    className="bg-[#1e293b] hover:bg-[#0f172a] text-white rounded-full px-8 py-6 text-lg font-bold shadow-lg transition-all hover:scale-105"
                  >
                    <MessageCircle className="w-5 h-5 ml-2" />
                    התחלת שיחה עם נציג אישי
                  </Button>
                ) : (
                  <>
                    <div className="flex items-baseline gap-1 text-[#003566]">
                      {checkingEligibility ? (
                        <Loader2 className="w-8 h-8 animate-spin" />
                      ) : quantity === 1 && isFreeJobEligible ? (
                        <span className="text-[45px] font-normal font-['Rubik']">חינם</span>
                      ) : (
                        <>
                          <span className="text-[45px] font-normal font-['Rubik']">₪{getTierPrice(quantity)}</span>
                          <span className="text-2xl font-normal">/למשרה</span>
                        </>
                      )}
                    </div>
                    {quantity > 1 && (
                      <div className="text-lg text-[#003566] mt-1 font-['Rubik'] font-bold">
                        ({(calculateTotal(quantity)).toLocaleString()}₪ סה״כ)
                      </div>
                    )}
                    <div className="w-full h-[3px] bg-[#003566] mt-1 rounded-full"></div>
                  </>
                )}
              </div>
            </div>

            {/* Vertical Divider */}
            <div className="hidden md:block w-px bg-gray-100 mx-10"></div>
            <div className="h-px w-full bg-gray-100 md:hidden my-6"></div>

            {/* Features Section (Left side in RTL) */}
            <div className="flex-1 text-right py-4">
              <h3 className="text-lg font-bold text-[#003566] mb-6">מה זה כולל?</h3>
              <ul className="space-y-4">
                {[
                  'פרסום למשך 30 ימים',
                  'אפשרות לערוך את המשרה בכל רגע',
                  'ניתוח ומסקנות מועמד בעזרת AI',
                  'דשבורד נתונים מלא ',
                  'סינון חכם מבוסס AI',
                  'כולל שאלון סינון',
                  'צ׳אט ישיר עם מועמדים'
                ].map((feature, idx) => (
                  <li key={idx} className="flex items-start gap-3 justify-start text-[#003566]">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#003566] mt-2 flex-shrink-0"></div>
                    <span className="text-sm font-normal leading-tight">{feature}</span>
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