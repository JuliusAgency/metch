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
      case 'vatNumber':
        // Allow only digits
        formattedValue = value.replace(/\D/g, '');
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
    <div className="max-w-4xl mx-auto text-center" dir="rtl">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="space-y-12"
      >
        {/* Credit Card Visual */}
        <div className="flex flex-col items-center mb-16">
          <div className="relative">
            <div className="w-[360px] h-[220px] bg-[#0a0f18] rounded-[18px] shadow-2xl text-white p-10 flex flex-col justify-between relative overflow-hidden">
              {/* Background Arc Effect - Two-tone split */}
              <div className="absolute top-[-50%] right-[-25%] w-[150%] h-[200%] bg-[#1c2533] rounded-[45%] rotate-[-15deg]"></div>

              {/* Mastercard-style logo top LEFT */}
              <div className="flex justify-start pl-2 relative z-10">
                <div className="flex">
                  <div className="w-11 h-11 bg-white/[0.5] rounded-full"></div>
                  <div className="w-11 h-11 bg-white/[0.9] rounded-full -ml-5 backdrop-blur-[1px]"></div>
                </div>
              </div>

              {/* Card number - Centered vertically */}
              <div className="text-[25px] tracking-[0.14em] text-center w-full font-sans -mt-2 relative z-10 leading-none">
                {paymentData.cardNumber || "0000 0000 0000 0000"}
              </div>

              {/* Expiry and Cardholder info - Bottom row SWAPPED */}
              <div className="flex justify-between items-end w-full pb-2 relative z-10">
                <div className="text-[17px] tracking-widest font-sans opacity-90">
                  {paymentData.expiryDate || "MM/YY"}
                </div>
                <div className="text-[17px] tracking-wide uppercase truncate max-w-[220px] font-sans opacity-90">
                  {paymentData.holderName ? paymentData.holderName : "ISRAEL ISRAELI"}
                </div>
              </div>
            </div>

            {/* Camera icon - Centered BETWEEN the card and inputs */}
            <div className="absolute -bottom-14 left-1/2 -translate-x-1/2 cursor-pointer hover:opacity-80 transition-opacity">
              <div className="relative p-1">
                {/* Viewfinder brackets style icon */}
                <div className="absolute top-0 left-0 border-t-[2px] border-l-[2px] border-slate-400 w-2.5 h-2.5 rounded-tl-[3px]"></div>
                <div className="absolute top-0 right-0 border-t-[2px] border-r-[2px] border-slate-400 w-2.5 h-2.5 rounded-tr-[3px]"></div>
                <div className="absolute bottom-0 left-0 border-b-[2px] border-l-[2px] border-slate-400 w-2.5 h-2.5 rounded-bl-[3px]"></div>
                <div className="absolute bottom-0 right-0 border-b-[2px] border-r-[2px] border-slate-400 w-2.5 h-2.5 rounded-br-[3px]"></div>
                <Camera className="w-7 h-7 text-slate-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Payment Form - 3 Columns Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-5 max-w-[980px] mx-auto pt-6">

          {/* Row 1: VAT, ID, Holder Name */}
          <div className="space-y-1">
            <Input
              placeholder="ח.פ. עבור חשבונית"
              value={paymentData.vatNumber || ''}
              onChange={(e) => handleInputChange('vatNumber', e.target.value)}
              className="h-[44px] rounded-full text-center bg-white border-gray-200 placeholder:text-gray-400 text-sm"
              dir="rtl"
            />
          </div>

          <div className="space-y-1">
            <Input
              placeholder="מספר זיהוי (9 ספרות)"
              value={paymentData.idNumber || ''}
              onChange={(e) => handleInputChange('idNumber', e.target.value)}
              className={`h-[44px] rounded-full text-center bg-white border-gray-200 placeholder:text-gray-400 text-sm ${errors.idNumber ? 'border-red-500' : ''}`}
              dir="rtl"
              maxLength={9}
            />
          </div>

          <div className="space-y-1">
            <Input
              placeholder="שם בעל הכרטיס"
              value={paymentData.holderName || ''}
              onChange={(e) => handleInputChange('holderName', e.target.value)}
              className={`h-[44px] rounded-full text-center bg-white border-gray-200 placeholder:text-gray-400 text-sm ${errors.holderName ? 'border-red-500' : ''}`}
              dir="rtl"
            />
          </div>

          {/* Row 2: CVV, Expiry, Card Number */}
          <div className="space-y-1 relative">
            <Input
              placeholder="CVV"
              value={paymentData.cvv || ''}
              onChange={(e) => handleInputChange('cvv', e.target.value)}
              className="h-[44px] rounded-full text-center bg-white border-gray-200 placeholder:text-gray-400 text-sm"
              maxLength={3}
              dir="rtl"
            />
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300">
              <svg width="20" height="14" viewBox="0 0 24 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="0.5" y="0.5" width="23" height="15" rx="1.5" stroke="currentColor" />
                <rect x="4" y="8" width="8" height="2" fill="currentColor" />
              </svg>
            </div>
          </div>

          <div className="space-y-1">
            <Input
              placeholder="תוקף MM/YY"
              value={paymentData.expiryDate || ''}
              onChange={(e) => handleInputChange('expiryDate', e.target.value)}
              className={`h-[44px] rounded-full text-center bg-white border-gray-200 placeholder:text-gray-400 text-sm ${errors.expiryDate ? 'border-red-500' : ''}`}
              dir="rtl"
              maxLength={5}
            />
          </div>

          <div className="space-y-1">
            <Input
              placeholder="מספר כרטיס אשראי"
              value={paymentData.cardNumber || ''}
              onChange={(e) => handleInputChange('cardNumber', e.target.value)}
              className={`h-[44px] rounded-full text-center bg-white border-gray-200 placeholder:text-gray-400 text-sm ${errors.cardNumber ? 'border-red-500' : ''}`}
              maxLength={19}
              dir="rtl"
            />
          </div>
        </div>

        {/* Security Notice */}
        <div className="mt-8 flex justify-center">
          <div className="text-xs text-gray-500 bg-gray-50/50 px-6 py-2 rounded-full flex items-center gap-2 border border-gray-100">
            <span>🔒</span>
            <span>התשלום מאובטח ומוצפן. אנחנו לא שומרים פרטי אשראי</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}