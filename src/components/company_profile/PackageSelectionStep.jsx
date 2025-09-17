import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Minus, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";

export default function PackageSelectionStep({ formData, setFormData }) {
  const [quantity, setQuantity] = useState(formData.selected_package?.quantity || 1);
  const pricePerJob = 499;

  const handleQuantityChange = (amount) => {
    const newQuantity = Math.max(1, quantity + amount);
    setQuantity(newQuantity);
    setFormData(prev => ({
      ...prev,
      selected_package: {
        type: 'per_job',
        quantity: newQuantity,
        price: pricePerJob * newQuantity
      }
    }));
  };

  return (
    <div className="max-w-4xl mx-auto text-center" dir="rtl">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="space-y-8"
      >
        <div className="flex justify-end -mt-4 -mr-4">
             <Button variant="ghost" size="icon" className="bg-gray-100 rounded-full hover:bg-gray-200">
                <ChevronRight className="w-6 h-6 text-gray-600 rotate-180" />
            </Button>
        </div>

        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">למצוא את המועמד המדויק</h1>
          <p className="text-gray-600">בעזרת הבינה המלאכותית של מאצ'</p>
        </div>

        <div className="space-y-4">
            <h2 className="text-lg font-semibold">בחרו כמות משרות</h2>
            <div className="flex justify-center items-center gap-4">
                 <Button size="icon" variant="outline" className="rounded-full w-12 h-12 border-gray-300" onClick={() => handleQuantityChange(-1)} disabled={quantity <= 1}>
                    <Minus className="w-6 h-6" />
                </Button>
                <span className="text-4xl font-bold w-16 text-center text-gray-800">{quantity}</span>
                <Button size="icon" className="rounded-full w-12 h-12 bg-gray-800 hover:bg-gray-900" onClick={() => handleQuantityChange(1)}>
                    <Plus className="w-6 h-6" />
                </Button>
            </div>
        </div>

        <Card className="max-w-lg mx-auto bg-white rounded-2xl shadow-lg border border-gray-200">
            <CardContent className="p-6">
                <div className="flex justify-between items-start">
                    <div className="text-right space-y-4">
                        <h3 className="font-bold text-lg">מה כולל?</h3>
                        <ul className="space-y-2 text-gray-700 text-sm">
                            <li className="flex items-center gap-2"><span>•</span><span>פרסום למשך 30 ימים</span></li>
                            <li className="flex items-center gap-2"><span>•</span><span>אפשרות לערוך את המשרה בכל רגע</span></li>
                            <li className="flex items-center gap-2"><span>•</span><span>ניתוח ומסקנות מועמד בעזרת AI</span></li>
                            <li className="flex items-center gap-2"><span>•</span><span>כולל שאלון סינון</span></li>
                            <li className="flex items-center gap-2"><span>•</span><span>צ'אט ישיר עם מועמדים</span></li>
                        </ul>
                    </div>
                    <div className="text-left flex-shrink-0">
                         <div className="bg-blue-100 text-blue-700 text-xs font-semibold px-3 py-1 rounded-full mb-2 inline-block">
                            תשלום חד פעמי
                        </div>
                        <div className="text-4xl font-bold text-gray-900">₪{pricePerJob}</div>
                        <div className="text-gray-600">/ למשרה</div>
                    </div>
                </div>
            </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}