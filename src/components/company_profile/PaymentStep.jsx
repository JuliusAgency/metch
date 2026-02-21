import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Camera, Loader2, RefreshCw } from "lucide-react";
import { motion } from "framer-motion";
import { generateLowProfileUrl } from "@/services/cardcomService";
import { Button } from "@/components/ui/button";
import { supabase } from "@/api/supabaseClient";
import { useToast } from "@/components/ui/use-toast";

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


export default function PaymentStep({ paymentData, setPaymentData, errors: propErrors, setErrors: propSetErrors, userProfile, amount = 349, quantity = 1 }) {
  const [iframeUrl, setIframeUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [requestId, setRequestId] = useState(null);
  const [verifying, setVerifying] = useState(false);
  const { toast } = useToast();

  React.useEffect(() => {
    const fetchUrl = async () => {
      setLoading(true);
      try {
        const result = await generateLowProfileUrl(
          {
            amount: amount,
            productName: quantity > 1 ? `רכישת ${quantity} משרות` : 'מנוי חודשי Metch'
          },
          {
            name: userProfile?.full_name || 'Customer',
            email: userProfile?.email || 'customer@example.com'
          },
          { quantity },
          userProfile.id // Pass explicitly for iframe safety
        );
        // Supports both object return (new) and string return (old/fallback)
        if (typeof result === 'object' && result.url) {
          console.log("Redirecting to full page payment:", result.url);
          window.location.href = result.url;
        } else if (typeof result === 'string') {
          window.location.href = result;
        }
      } catch (error) {
        console.error("Failed to load payment page", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUrl();
  }, [userProfile, amount]);

  // Listen for postMessage from the iframe (PaymentSuccess page or Redirector)
  React.useEffect(() => {
    const handleMessage = (event) => {
      // Check for our specific message types from Cardcom flow
      if (event.data?.type === 'CARDCOM_PAYMENT_SUCCESS' || event.data?.type === 'CARDCOM_PAYMENT_REDIRECT') {
        console.log('Received payment message from iframe:', event.data);
        const targetUrl = event.data.url;

        if (targetUrl) {
          // Navigate the top-level window
          if (targetUrl.startsWith('http')) {
            window.top.location.href = targetUrl;
          } else {
            window.top.location.href = window.location.origin + (targetUrl.startsWith('/') ? '' : '/') + targetUrl;
          }
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const handleManualVerification = async () => {
    if (!requestId) return;
    setVerifying(true);
    try {
      const { data, error } = await supabase.functions.invoke('verify-payment', {
        body: { requestId }
      });

      if (error) throw error;

      toast({
        title: "התשלום אומת בהצלחה",
        description: "היתרה עודכנה בחשבונך",
      });

      // Reload page or trigger balance refresh? 
      // Best to just let user close modal and see it.
      window.location.reload();

    } catch (error) {
      console.error("Verification error:", error);
      toast({
        title: "שגיאה באימות",
        description: "לא הצלחנו לאמת את התשלום כרגע.",
        variant: "destructive"
      });
    } finally {
      setVerifying(false);
    }
  };




  return (
    <div className="max-w-4xl mx-auto text-center h-full" dir="rtl">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full h-full min-h-[500px] flex flex-col"
      >
        {loading ? (
          <div className="flex flex-col items-center justify-center h-[400px]">
            <Loader2 className="w-12 h-12 text-[#2987cd] animate-spin mb-4" />
            <p className="text-gray-500">טוען דף תשלום מאובטח...</p>
          </div>
        ) : iframeUrl ? (
          <div className="w-full h-full flex-1 md:h-[600px] h-[500px] bg-white rounded-xl overflow-hidden border border-gray-200 shadow-inner">
            <iframe
              key={iframeUrl}
              src={iframeUrl}
              title="Cardcom Payment"
              className="w-full h-full border-none"
              allow="payment; camera; clipboard-write; gpay; autoplay; fullscreen"
              sandbox="allow-forms allow-modals allow-popups allow-scripts allow-same-origin allow-downloads allow-payment-request allow-top-navigation allow-top-navigation-by-user-activation allow-popups-to-escape-sandbox"
            />
          </div>
        ) : (
          <div className="flex items-center justify-center h-[400px]">
            <p className="text-red-500">שגיאה בטעינת מערכת הסליקה. אנא נסה שוב.</p>
          </div>
        )}

        {/* Security Notice */}
        <div className="mt-4 flex justify-center">
          <div className="text-xs text-gray-500 bg-gray-50/50 px-6 py-2 rounded-full flex items-center gap-2 border border-gray-100">
            <span>🔒</span>
            <span>התשלום מאובטח ומוצפן ע"י קארדקום (PCI-DSS)</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}