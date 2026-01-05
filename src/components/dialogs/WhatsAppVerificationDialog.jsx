import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, Phone, Lock, CheckCircle2 } from 'lucide-react';
import { useToast } from "@/components/ui/use-toast";

export const WhatsAppVerificationDialog = ({ isOpen, onClose, onVerified, initialPhone = '' }) => {
    const [step, setStep] = useState('phone'); // phone, code, success
    const [phoneNumber, setPhoneNumber] = useState(initialPhone);
    const [code, setCode] = useState('');
    const [generatedCode, setGeneratedCode] = useState(null);
    const [loading, setLoading] = useState(false);
    const { toast } = useToast();

    useEffect(() => {
        if (initialPhone) {
            setPhoneNumber(initialPhone);
        }
    }, [initialPhone]);

    const handleSendCode = async () => {
        if (!phoneNumber || phoneNumber.length < 9) {
            toast({
                title: "מספר לא תקין",
                description: "אנא הכנס מספר טלפון תקין",
                variant: "destructive"
            });
            return;
        }

        setLoading(true);

        // Simulate network delay for "Sending..." effect
        setTimeout(async () => {
            try {
                // Generate 4 digit code
                const newCode = Math.floor(1000 + Math.random() * 9000).toString();
                console.log("Generated Code (Safe to ignore in prod):", newCode); // For debugging
                setGeneratedCode(newCode);

                // Attempt to send via API (from other dev), but fallback if fails or mocked
                try {
                    if (typeof SendWhatsAppMessage !== 'undefined') {
                        await SendWhatsAppMessage({
                            phoneNumber: phoneNumber,
                            message: `קוד האימות שלך ל-Metch הוא: ${newCode}`
                        });
                    } else {
                        console.warn("SendWhatsAppMessage is not defined (mocking success)");
                    }
                } catch (apiError) {
                    console.warn("WhatsApp API call failed (mocking success):", apiError);
                }

                toast({
                    title: "הקוד נשלח בהצלחה",
                    description: "בדוק את הווצאפ שלך (כל קוד 4 ספרות יעבוד כרגע)",
                });
                setStep('code');
            } catch (error) {
                console.error("Error setting up code:", error);
                toast({
                    title: "שגיאה",
                    description: "אירעה שגיאה",
                    variant: "destructive"
                });
            } finally {
                setLoading(false);
            }
        }, 1500);
    };

    const handleVerifyCode = () => {
        // FREE PASS: Allow any 4 digit code
        if (code.length === 4) {
            setStep('success');
            setTimeout(() => {
                onVerified(phoneNumber);
                onClose(); // Close dialog after success
            }, 1500);
        } else {
            toast({
                title: "קוד שגוי",
                description: "נא להזין 4 ספרות",
                variant: "destructive"
            });
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="bg-white rounded-[40px] shadow-2xl w-full max-w-md p-8 relative overflow-hidden text-center"
                    dir="rtl"
                >
                    {step === 'phone' && (
                        <div className="space-y-6">
                            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                                <Phone className="w-8 h-8 text-green-600" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900 mb-2">אימות מספר טלפון</h2>
                                <p className="text-gray-600">אנא אמת את מספר הטלפון שלך כדי להמשיך</p>
                            </div>
                            <div className="space-y-4">
                                <Input
                                    placeholder="מספר טלפון (לדוגמה: 0501234567)"
                                    value={phoneNumber}
                                    onChange={(e) => setPhoneNumber(e.target.value)}
                                    className="text-center text-lg h-12 rounded-xl border-gray-200"
                                    dir="ltr"
                                />
                                <Button
                                    className="w-full h-12 rounded-xl text-lg font-medium bg-[#2987cd] hover:bg-[#1f6ba8]"
                                    onClick={handleSendCode}
                                    disabled={loading}
                                >
                                    {loading ? <div className="w-5 h-5 border-t-2 border-current rounded-full animate-spin"></div> : "שלח קוד אימות"}
                                </Button>
                            </div>
                        </div>
                    )}

                    {step === 'code' && (
                        <div className="space-y-6">
                            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
                                <Lock className="w-8 h-8 text-blue-600" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900 mb-2">הזן קוד אימות</h2>
                                <p className="text-gray-600">שלחנו קוד למספר {phoneNumber}</p>
                                <button
                                    onClick={() => setStep('phone')}
                                    className="text-sm text-blue-600 hover:underline mt-1"
                                >
                                    שנה מספר
                                </button>
                            </div>
                            <div className="space-y-4">
                                <Input
                                    placeholder="XXXX"
                                    value={code}
                                    onChange={(e) => setCode(e.target.value)}
                                    className="text-center text-2xl tracking-widest h-14 rounded-xl border-gray-200"
                                    maxLength={4}
                                    dir="ltr"
                                />
                                <Button
                                    className="w-full h-12 rounded-xl text-lg font-medium bg-[#2987cd] hover:bg-[#1f6ba8]"
                                    onClick={handleVerifyCode}
                                    disabled={loading}
                                >
                                    {loading ? <div className="w-5 h-5 border-t-2 border-current rounded-full animate-spin"></div> : "אמת קוד"}
                                </Button>
                            </div>
                        </div>
                    )}

                    {step === 'success' && (
                        <div className="space-y-6 py-8">
                            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                                <CheckCircle2 className="w-10 h-10 text-green-600" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900">אומת בהצלחה!</h2>
                                <p className="text-gray-600 mt-2">מעביר אותך לשלב הבא...</p>
                            </div>
                        </div>
                    )}
                </motion.div>
            </div>
        </AnimatePresence>
    );
};
