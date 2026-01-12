
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Eye, Check, MessageCircle, ChevronRight } from 'lucide-react';
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import PaymentStep, { validationUtils } from "@/components/company_profile/PaymentStep";
import { useToast } from "@/components/ui/use-toast";
import { MetchApi } from "@/api/metchApi";
import { Loader2 } from "lucide-react";
import { useUser } from "@/contexts/UserContext";

export default function Packages() {
    const { toast } = useToast();
    const navigate = useNavigate();
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [paymentData, setPaymentData] = useState({});
    const [quantity, setQuantity] = useState(1);
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});
    const { user, updateProfile } = useUser();

    const getPricePerJob = (qty) => {
        if (qty === 1) return 600;
        if (qty >= 2 && qty <= 3) return 550;
        if (qty >= 4 && qty <= 5) return 500;
        if (qty >= 6 && qty <= 7) return 450;
        if (qty >= 8 && qty <= 9) return 400;
        return 0; // 10+
    };

    const handleSavePaymentMethod = () => {
        const newErrors = {};

        const cardError = validationUtils.validateCardNumber(paymentData.cardNumber || '');
        if (cardError) newErrors.cardNumber = cardError;

        const dateError = validationUtils.validateExpiry(paymentData.expiryDate || '');
        if (dateError) newErrors.expiryDate = dateError;

        const cvvError = validationUtils.validateCvv(paymentData.cvv || '');
        if (cvvError) newErrors.cvv = cvvError;

        const idError = validationUtils.validateId(paymentData.idNumber || '');
        if (idError) newErrors.idNumber = idError;

        const nameError = validationUtils.validateHolderName(paymentData.holderName || '');
        if (nameError) newErrors.holderName = nameError;

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            toast({
                title: "שגיאה בפרטי התשלום",
                description: "נא לתקן את השדות המסומנים באדום",
                variant: "destructive"
            });
            return;
        }

        setShowPaymentModal(false);
        toast({
            title: "אמצעי תשלום עודכן",
            description: "פרטי האשראי עודכנו בהצלחה במערכת",
        });
    };

    const handleContactSupport = () => {
        navigate(createPageUrl("Messages"), { state: { supportChat: true } });
    };

    const handlePurchase = async () => {
        // Validate if payment info exists
        if (!paymentData.cardNumber || !paymentData.expiryDate || !paymentData.cvv) {
            toast({
                title: "חסרים פרטי תשלום",
                description: "נא לעדכן את אמצעי התשלום לפני ביצוע הרכישה",
                variant: "destructive"
            });
            setShowPaymentModal(true);
            return;
        }

        const totalAmount = getPricePerJob(quantity) * quantity;

        setLoading(true);
        try {
            await MetchApi.createTransaction({
                Amount: totalAmount,
                CardNumber: paymentData.cardNumber,
                CardExpirationMMYY: paymentData.expiryDate.replace('/', ''), // Format adjustment
                CVV2: paymentData.cvv,
                CardOwnerName: paymentData.holderName,
                CardOwnerIdentityNumber: paymentData.idNumber,
                NumberOfPayments: 1
            });

            // 1. Update User Credits in Supabase
            const currentCredits = user?.profile?.job_credits || 0;
            const newCredits = currentCredits + quantity;

            await updateProfile({ job_credits: newCredits });

            // 2. Add Transaction to List (handled by backend or Payments page re-fetch usually)
            // For now just success indication

            // 3. Show Success & Update Message
            setShowSuccessModal(true);

            toast({
                title: "יתרת משרות עודכנה",
                description: `נוספו ${quantity} משרות לחשבונך. יתרה נוכחית: ${newCredits}`,
            });

        } catch (error) {
            console.error("Purchase failed:", error);
            toast({
                title: "העסקה נכשלה",
                description: "אירעה שגיאה בעת ביצוע החיוב. אנא ודאו שפרטי הכרטיס תקינים ונסו שוב.",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="relative" dir="rtl">

            {/* Minimal Header for separate page look */}
            <div className="absolute top-8 right-6">
                <Button variant="ghost" className="gap-2" onClick={() => navigate(-1)}>
                    <ChevronRight /> חזרה
                </Button>
            </div>

            <div className="max-w-4xl mx-auto px-6 py-12 space-y-10">

                {/* Page Title */}
                <div className="text-center space-y-2">
                    <h1 className="text-3xl font-bold text-[#1E3A8A]">למצוא את המועמד המדויק</h1>
                    <p className="text-[#1E3A8A]/70">בעזרת הבינה המלאכותית של מאצ׳</p>
                </div>


                {/* Purchase Credits Section */}
                <div className="space-y-8">
                    <h2 className="text-xl font-medium text-gray-800 text-center mb-6">בחרו כמות משרות</h2>

                    {/* Quantity Selector - Delicate Pill Design */}
                    <div className="flex justify-center mb-8">
                        <div className="bg-white border-[1.5px] border-[#001a6e] rounded-full px-2 py-1 flex items-center gap-2 shadow-sm w-auto">
                            {/* Plus Button - SVG */}
                            <svg
                                width="32"
                                height="32"
                                viewBox="0 0 32 32"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                                onClick={() => setQuantity(quantity + 1)}
                                className="w-8 h-8 p-0.5 cursor-pointer hover:scale-110 transition-transform"
                            >
                                <circle cx="16" cy="16" r="16" fill="#001a6e" />
                                <path d="M16 10V22M10 16H22" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>

                            <span className="text-2xl font-bold text-[#1E3A8A] font-['Rubik'] w-6 text-center flex items-center justify-center">{quantity}</span>

                            {/* Minus Button - SVG */}
                            <svg
                                width="32"
                                height="32"
                                viewBox="0 0 32 32"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                className={`w-8 h-8 p-0.5 cursor-pointer transition-transform ${quantity <= 1 ? 'opacity-50 cursor-not-allowed' : 'hover:scale-110'}`}
                            >
                                <circle cx="16" cy="16" r="16" fill="#e2e8f0" />
                                <path d="M10 16H22" stroke="#001a6e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </div>
                    </div>

                    {/* Pricing Card */}
                    <div className="bg-white rounded-[30px] border border-gray-100 shadow-[0_4px_20px_rgba(0,0,0,0.03)] py-8 px-10 max-w-[940px] mx-auto relative overflow-hidden">
                        <div className="flex flex-col md:flex-row items-stretch relative z-10 w-full" dir="rtl">

                            {/* Price Section (Right side in RTL) */}
                            <div className="flex-1 flex flex-col items-center justify-start py-4">
                                <div className="bg-[#EBF5FF] text-[#003566] px-4 py-1.5 rounded-full text-xs font-medium mb-6">
                                    {quantity >= 10 ? 'פנה לנציג' : 'תשלום חד פעמי'}
                                </div>
                                <div className="flex flex-col items-center">
                                    {quantity >= 10 ? (
                                        <Button
                                            onClick={handleContactSupport}
                                            className="bg-[#1e293b] hover:bg-[#0f172a] text-white rounded-full px-8 py-6 text-lg font-bold shadow-lg transition-all hover:scale-105"
                                        >
                                            <MessageCircle className="w-5 h-5 ml-2" />
                                            התחל שיחה עם נציג אישי
                                        </Button>
                                    ) : (
                                        <>
                                            <div className="flex items-baseline gap-1 text-[#003566]">
                                                <span className="text-[45px] font-normal font-['Rubik']">₪{getPricePerJob(quantity)}</span>
                                                <span className="text-2xl font-normal">/למשרה</span>
                                            </div>
                                            {quantity > 1 && (
                                                <div className="text-lg md:text-xl text-[#003566] mt-1 font-['Rubik'] font-bold">
                                                    ({(getPricePerJob(quantity) * quantity).toLocaleString()}₪ סה״כ)
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
                                <h3 className="text-lg font-bold text-[#003566] mb-6">מה כולל?</h3>
                                <ul className="space-y-4">
                                    {[
                                        'פרסום למשך 30 ימים',
                                        'אפשרות לערוך את המשרה בכל רגע',
                                        'ניתוח ומסקנות מועמד בעזרת AI',
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

                    {/* CTA Button */}
                    {quantity < 10 && (
                        <div className="flex justify-center pt-6">
                            <Button
                                onClick={handlePurchase}
                                disabled={loading}
                                className="bg-[#2987cd] hover:bg-[#1f6ba8] text-white rounded-full px-12 py-6 text-xl font-bold shadow-lg shadow-blue-200/50 transition-all hover:-translate-y-1"
                            >
                                {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : (
                                    <>
                                        למאצ׳ המושלם
                                        <Eye className="w-5 h-5 mr-2 scale-x-[-1]" />
                                    </>
                                )}
                            </Button>
                        </div>
                    )}
                </div>

                <div className="my-16 h-px bg-gray-100 w-full max-w-2xl mx-auto"></div>

                {/* Change Payment Method Modal (Replicated here for purchasing flow) */}
                <Dialog open={showPaymentModal} onOpenChange={setShowPaymentModal}>
                    <DialogContent className="sm:max-w-[600px] h-[80vh] overflow-y-auto" dir="rtl">
                        <DialogHeader>
                            <DialogTitle className="text-center text-xl font-bold text-[#1E3A8A]">עדכון אמצעי תשלום</DialogTitle>
                        </DialogHeader>
                        <div className="py-4">
                            <PaymentStep
                                paymentData={paymentData}
                                setPaymentData={setPaymentData}
                                errors={errors}
                                setErrors={setErrors}
                            />
                            <div className="mt-8 flex justify-center">
                                <Button
                                    onClick={handleSavePaymentMethod}
                                    className="bg-[#1E3A8A] text-white rounded-full px-8 w-full md:w-1/2"
                                >
                                    שמור אמצעי תשלום
                                </Button>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>

                {/* Success Modal */}
                <Dialog open={showSuccessModal} onOpenChange={setShowSuccessModal}>
                    <DialogContent className="sm:max-w-[400px] p-8 rounded-[40px]" dir="rtl">
                        <div className="flex flex-col items-center text-center space-y-6">
                            {/* Glowing Checkmark */}
                            <div className="relative">
                                <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(59,130,246,0.3)]">
                                    <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center shadow-lg">
                                        <Check className="w-6 h-6 text-white stroke-[3]" />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <h2 className="text-2xl font-bold text-[#0F172A]">הרכישה בוצעה בהצלחה</h2>
                                <p className="text-gray-500 text-sm">פרטי העסקה נשלחו אל הדוא״ל</p>
                            </div>

                            <Button
                                onClick={() => {
                                    setShowSuccessModal(false);
                                    navigate(createPageUrl("Payments"));
                                }}
                                className="w-[80%] bg-[#2987CD] hover:bg-[#1C649B] text-white rounded-full py-6 text-lg font-bold shadow-lg"
                            >
                                אישור
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>
        </div>
    );
}
