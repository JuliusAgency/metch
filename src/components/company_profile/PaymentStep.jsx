import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Camera } from "lucide-react";
import { motion } from "framer-motion";

export const validationUtils = {
  validateCardNumber: (number) => {
    if (!number) return "שדה חובה";
    const digits = number.replace(/\D/g, '');
    if (digits.length < 16) return "מספר כרטיס לא תקין (חסרות ספרות)";

    let sum = 0;
    let isEven = false;
    for (let i = digits.length - 1; i >= 0; i--) {
      let digit = parseInt(digits.charAt(i));
      if (isEven) {
        digit *= 2;
        if (digit > 9) digit -= 9;
      }
      sum += digit;
      isEven = !isEven;
    }
    return (sum % 10 === 0) ? "" : "מספר כרטיס לא תקין";
  },
  validateExpiry: (date) => {
    if (!date) return "שדה חובה";
    if (date.length < 5) return "תאריך לא מלא";
    const [month, year] = date.split('/');
    if (!month || !year) return "תאריך לא תקין";

    const currentYear = new Date().getFullYear() % 100;
    const currentMonth = new Date().getMonth() + 1;

    const monthNum = parseInt(month);
    const yearNum = parseInt(year);

    if (monthNum < 1 || monthNum > 12) return "חודש לא תקין";
    if (yearNum < currentYear) return "כרטיס פג תוקף";
    if (yearNum === currentYear && monthNum < currentMonth) return "כרטיס פג תוקף";

    return "";
  },
  validateHolderName: (name) => {
    if (!name) return "שדה חובה";
    const englishRegex = /^[a-zA-Z\s]*$/;
    if (!englishRegex.test(name)) return "יש להזין שם באנגלית בלבד";
    if (name.length < 2) return "שם קצר מדי";
    return "";
  },
  validateId: (id) => {
    if (!id || id.length < 9) return "מספר זיהוי לא תקין";
    return "";
  },
  validateCvv: (cvv) => {
    if (!cvv || cvv.length < 3) return "CVV לא תקין";
    return "";
  }
};

export default function PaymentStep({ paymentData, setPaymentData, errors: propErrors, setErrors: propSetErrors }) {
  const [internalErrors, setInternalErrors] = useState({});

  const errors = propErrors || internalErrors;
  const setErrors = propSetErrors || setInternalErrors;

  const formatCardNumber = (value) => {
    const v = value.replace(/\D/g, '').substring(0, 16);
    const parts = [];
    for (let i = 0; i < v.length; i += 4) {
      parts.push(v.substring(i, i + 4));
    }
    return parts.join('-');
  };

  const formatExpiryDate = (value) => {
    const v = value.replace(/\D/g, '').substring(0, 4);
    if (v.length >= 2) {
      return `${v.substring(0, 2)}/${v.substring(2)}`;
    }
    return v;
  };

  const handleInputChange = (field, value) => {
    let formattedValue = value;
    let error = "";

    switch (field) {
      case 'cardNumber':
        formattedValue = formatCardNumber(value);
        // Always validate on change to show red status if incomplete
        error = validationUtils.validateCardNumber(formattedValue);
        break;
      case 'expiryDate':
        formattedValue = formatExpiryDate(value);
        if (formattedValue.length === 5) {
          error = validationUtils.validateExpiry(formattedValue);
        }
        break;
      case 'cvv':
        formattedValue = value.replace(/\D/g, '').substring(0, 3);
        error = validationUtils.validateCvv(formattedValue);
        break;
      case 'idNumber':
        // Allow only digits
        formattedValue = value.replace(/\D/g, '');
        error = validationUtils.validateId(formattedValue);
        break;
      case 'holderName':
        error = validationUtils.validateHolderName(value);
        break;
      default:
        break;
    }

    setPaymentData(prev => ({ ...prev, [field]: formattedValue }));

    // Manage errors
    if (error) {
      setErrors(prev => ({ ...prev, [field]: error }));
    } else {
      // If no error, clear it from the state
      if (errors[field]) {
        const newErrors = { ...errors };
        delete newErrors[field];
        setErrors(newErrors);
      }
    }
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
              <div className="absolute top-4 right-4 w-8 h-8 bg-white/20 rounded-full"></div>
              <div className="absolute top-4 right-10 w-8 h-8 bg-white/10 rounded-full"></div>

              {/* Card number */}
              <div className="absolute bottom-20 right-6 text-xl font-mono tracking-wider">
                {paymentData.cardNumber || "0000 0000 0000 0000"}
              </div>

              {/* Cardholder info */}
              <div className="absolute bottom-6 right-6 flex justify-between w-64">
                <div className="text-right">
                  <div className="text-sm">{paymentData.expiryDate || "MM/YY"}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-300 mb-1">
                    {paymentData.holderName ? paymentData.holderName.toUpperCase() : "ISRAEL ISRAELI"}
                  </div>
                </div>
              </div>
            </div>

            {/* Camera icon */}
            <div className="absolute -bottom-4 left-6 w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center border-4 border-gray-100">
              <Camera className="w-6 h-6 text-gray-400" />
            </div>
          </div>
        </div>

        {/* Payment Form */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-lg mx-auto">
          <div className="space-y-1">
            <Input
              placeholder="שם בעל הכרטיס"
              value={paymentData.holderName || ''}
              onChange={(e) => handleInputChange('holderName', e.target.value)}
              className={`rounded-full text-center ${errors.holderName ? 'border-red-500' : ''}`}
              dir="rtl"
            />
            {errors.holderName && <p className="text-xs text-red-500">{errors.holderName}</p>}
          </div>
          <div className="space-y-1">
            <Input
              placeholder="מספר זיהוי (9 ספרות)"
              value={paymentData.idNumber || ''}
              onChange={(e) => handleInputChange('idNumber', e.target.value)}
              className={`rounded-full text-center ${errors.idNumber ? 'border-red-500' : ''}`}
              dir="rtl"
              maxLength={9}
            />
            {errors.idNumber && <p className="text-xs text-red-500">{errors.idNumber}</p>}
          </div>
          <div className="space-y-1">
            <Input
              placeholder="CVV"
              value={paymentData.cvv || ''}
              onChange={(e) => handleInputChange('cvv', e.target.value)}
              className="rounded-full text-center"
              maxLength={3}
              dir="rtl"
            />
          </div>
          <div className="space-y-1">
            <Input
              placeholder="תוקף MM/YY"
              value={paymentData.expiryDate || ''}
              onChange={(e) => handleInputChange('expiryDate', e.target.value)}
              className={`rounded-full text-center ${errors.expiryDate ? 'border-red-500' : ''}`}
              dir="rtl"
              maxLength={5}
            />
            {errors.expiryDate && <p className="text-xs text-red-500">{errors.expiryDate}</p>}
          </div>
        </div>

        <div className="space-y-1 max-w-lg mx-auto">
          <Input
            placeholder="מספר כרטיס אשראי"
            value={paymentData.cardNumber || ''}
            onChange={(e) => handleInputChange('cardNumber', e.target.value)}
            className={`rounded-full text-center ${errors.cardNumber ? 'border-red-500' : ''}`}
            maxLength={19}
            dir="rtl"
          />
          {errors.cardNumber && <p className="text-xs text-red-500">{errors.cardNumber}</p>}
        </div>

        {/* Security Notice */}
        <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded-lg max-w-lg mx-auto">
          <p>🔒 התשלום מאובטח ומוצפן. אנחנו לא שומרים פרטי אשראי</p>
        </div>
      </motion.div>
    </div>
  );
}