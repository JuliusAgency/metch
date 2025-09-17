import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Camera } from "lucide-react";
import { motion } from "framer-motion";

export default function PaymentStep({ formData: _formData, setFormData }) {
  const [paymentData, setPaymentData] = useState({
    cardNumber: "",
    expiryDate: "",
    cvv: "",
    holderName: "",
    idNumber: ""
  });

  const handleInputChange = (field, value) => {
    setPaymentData(prev => ({ ...prev, [field]: value }));
    setFormData(prev => ({ ...prev, payment_info: { ...prev.payment_info, [field]: value } }));
  };

  return (
    <div className="max-w-2xl mx-auto text-center" dir="rtl">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="space-y-8"
      >
        {/* Credit Card Visual */}
        <div className="flex justify-center mb-8">
          <div className="relative">
            <div className="w-80 h-48 bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl shadow-2xl text-white p-6 relative overflow-hidden">
              {/* Card circles design */}
              <div className="absolute top-4 left-4 w-8 h-8 bg-white/20 rounded-full"></div>
              <div className="absolute top-4 left-10 w-8 h-8 bg-white/10 rounded-full"></div>
              
              {/* Card number */}
              <div className="absolute bottom-20 left-6 text-xl font-mono tracking-wider">
                {paymentData.cardNumber || "1313 5555 1313 5555"}
              </div>
              
              {/* Cardholder info */}
              <div className="absolute bottom-6 left-6 flex justify-between w-64">
                <div>
                  <div className="text-xs text-gray-300 mb-1">ISRAEL ISRAELI</div>
                </div>
                <div className="text-right">
                  <div className="text-sm">{paymentData.expiryDate || "05/25"}</div>
                </div>
              </div>
            </div>
            
            {/* Camera icon */}
            <div className="absolute -bottom-4 right-6 w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center border-4 border-gray-100">
              <Camera className="w-6 h-6 text-gray-400" />
            </div>
          </div>
        </div>

        {/* Payment Form */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-lg mx-auto">
          <Input
            placeholder="שם בעל הכרטיס"
            value={paymentData.holderName}
            onChange={(e) => handleInputChange('holderName', e.target.value)}
            className="rounded-full text-center"
          />
          <Input
            placeholder="מספר זיהוי"
            value={paymentData.idNumber}
            onChange={(e) => handleInputChange('idNumber', e.target.value)}
            className="rounded-full text-center"
          />
          <Input
            placeholder="CVV"
            value={paymentData.cvv}
            onChange={(e) => handleInputChange('cvv', e.target.value)}
            className="rounded-full text-center"
            maxLength={3}
          />
          <Input
            placeholder="תוקף"
            value={paymentData.expiryDate}
            onChange={(e) => handleInputChange('expiryDate', e.target.value)}
            className="rounded-full text-center"
            placeholder="MM/YY"
          />
        </div>

        <Input
          placeholder="מספר כרטיס אשראי"
          value={paymentData.cardNumber}
          onChange={(e) => handleInputChange('cardNumber', e.target.value)}
          className="rounded-full text-center max-w-lg mx-auto"
          maxLength={19}
        />

        {/* Security Notice */}
        <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded-lg max-w-lg mx-auto">
          <p>🔒 התשלום מאובטח ומוצפן. אנחנו לא שומרים פרטי אשראי</p>
        </div>
      </motion.div>
    </div>
  );
}