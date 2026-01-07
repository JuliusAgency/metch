import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Eye, Download, FileOutput, CreditCard, X, Check, MessageCircle } from 'lucide-react';
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Card, CardContent } from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import PaymentStep, { validationUtils } from "@/components/company_profile/PaymentStep";
import { useToast } from "@/components/ui/use-toast";
import { MetchApi } from "@/api/metchApi";
import { Loader2 } from "lucide-react";
import { useUser } from "@/contexts/UserContext";

export default function Payments() {
    const { toast } = useToast();
    const navigate = useNavigate();
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [selectedInvoice, setSelectedInvoice] = useState(null);
    const [paymentData, setPaymentData] = useState({}); // Mock state for PaymentStep
    const [quantity, setQuantity] = useState(1);
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});
    const { user, updateProfile } = useUser();

    // Mock data initial state
    const [transactions, setTransactions] = useState([
        { id: 1, amount: 349, date: '01/01/2025', details: 'מנוי חודשי - חבילת פרימיום' },
        { id: 2, amount: 349, date: '01/01/2025', details: 'מנוי חודשי - חבילת פרימיום' },
        { id: 3, amount: 349, date: '01/01/2025', details: 'מנוי חודשי - חבילת פרימיום' },
    ]);

    const handleExport = (id) => {
        // Find the transaction
        const tx = transactions.find(t => t.id === id);
        if (!tx) return;

        // Mock CSV download with BOM for Hebrew support
        // Columns: Invoice Number, Date, Amount, Description, Status
        const headers = "מספר חשבונית,תאריך,סכום,תיאור,סטטוס";
        const row = `INV-2025-00${tx.id},${tx.date},₪${tx.amount},${tx.details},שולם`;

        const csvContent = "\uFEFF" + headers + "\n" + row;
        const encodedUri = encodeURI(`data:text/csv;charset=utf-8,${csvContent}`);

        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `invoice_INV-2025-00${id}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        toast({
            title: "ייצוא הושלם",
            description: `חשבונית INV-2025-00${id} ירדה בהצלחה`,
        });
    };

    const handleDownload = (id) => {
        const tx = transactions.find(t => t.id === id);
        if (!tx) return;

        // Helper to formatting PDF text
        const createPDF = () => {
            // We must use English for raw PDF mock as Hebrew requires font embedding (complex).
            // We will map the data to English labels.
            const content = `
BT
/F1 24 Tf
50 750 Td
(INVOICE) Tj
/F1 12 Tf
0 -50 Td
(Invoice Number: INV-2025-00${tx.id}) Tj
0 -25 Td
(Date: ${tx.date}) Tj
0 -25 Td
(Amount: 349.00 NIS) Tj
0 -25 Td
(Status: Paid) Tj
0 -25 Td
(Description: Monthly Subscription - Premium) Tj
0 -50 Td
(Thank you for your business!) Tj
ET`;

            const streamLen = content.length;

            // Construct Objects
            // Obj 1: Catalog
            const obj1 = `1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n`;

            // Obj 2: Pages
            const obj2 = `2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n`;

            // Obj 3: Page
            const obj3 = `3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>\nendobj\n`;

            // Obj 4: Font
            const obj4 = `4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n`;

            // Obj 5: Content Stream
            const obj5 = `5 0 obj\n<< /Length ${streamLen} >>\nstream${content}\nendstream\nendobj\n`;

            // Calculate Offsets
            const header = "%PDF-1.4\n";
            let offset = header.length;
            const xref = [];

            // Entry 0 (special)
            xref.push("0000000000 65535 f ");

            // Obj 1
            xref.push(String(offset).padStart(10, '0') + " 00000 n ");
            offset += obj1.length;

            // Obj 2
            xref.push(String(offset).padStart(10, '0') + " 00000 n ");
            offset += obj2.length;

            // Obj 3
            xref.push(String(offset).padStart(10, '0') + " 00000 n ");
            offset += obj3.length;

            // Obj 4
            xref.push(String(offset).padStart(10, '0') + " 00000 n ");
            offset += obj4.length;

            // Obj 5
            xref.push(String(offset).padStart(10, '0') + " 00000 n ");
            offset += obj5.length;

            // Xref Section
            const xrefSection = `xref\n0 6\n${xref.join('\n')}\n`;

            // Trailer
            const trailer = `trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${offset}\n%%EOF`;

            return header + obj1 + obj2 + obj3 + obj4 + obj5 + xrefSection + trailer;
        };

        const pdfContent = createPDF();
        const blob = new Blob([pdfContent], { type: 'application/pdf' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `invoice_INV-2025-00${id}.pdf`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);

        toast({
            title: "הורדה הושלמה",
            description: `חשבונית INV-2025-00${id}.pdf ירדה בהצלחה`,
        });
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

    const getPricePerJob = (qty) => {
        if (qty === 1) return 600;
        if (qty >= 2 && qty <= 3) return 550;
        if (qty >= 4 && qty <= 5) return 500;
        if (qty >= 6 && qty <= 7) return 450;
        if (qty >= 8 && qty <= 9) return 400;
        return 0; // 10+
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

            // 2. Add Transaction to List
            const newTransaction = {
                id: Date.now().toString().slice(-6), // Simple ID generation
                amount: totalAmount,
                date: new Date().toLocaleDateString('en-GB'),
                details: `רכישת ${quantity} משרות חדשות`
            };

            setTransactions(prev => [newTransaction, ...prev]);

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
            <div className="max-w-4xl mx-auto px-6 py-12 space-y-10">

                {/* Page Title */}
                <h1 className="text-3xl font-bold text-center text-[#1E3A8A]">עמוד תשלומים</h1>


                {/* Purchase Credits Section */}
                <div className="space-y-8">
                    <h2 className="text-xl font-medium text-gray-800 text-center mb-6">בחרו כמות משרות</h2>

                    {/* Quantity Selector - Delicate Pill Design */}
                    <div className="flex justify-center mb-8">
                        <div className="bg-white border border-gray-200 rounded-full px-4 py-2 flex items-center justify-between w-[220px] shadow-sm">
                            <button
                                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                className="w-8 h-8 rounded-full bg-[#f0f4f8] text-[#1E3A8A] flex items-center justify-center hover:bg-[#e1eaf0] transition-colors text-xl font-medium"
                            >
                                -
                            </button>
                            <span className="text-3xl font-bold text-[#1E3A8A] font-['Rubik']">{quantity}</span>
                            <button
                                onClick={() => setQuantity(quantity + 1)}
                                className="w-8 h-8 rounded-full bg-[#1e293b] text-white flex items-center justify-center hover:bg-[#0f172a] transition-colors text-xl font-medium"
                            >
                                +
                            </button>
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
                                                <span className="text-[45px] font-normal font-['Rubik']">₪{getPricePerJob(quantity) * quantity}</span>
                                                <span className="text-2xl font-normal">{quantity === 1 ? '/למשרה' : 'סה״כ'}</span>
                                            </div>
                                            {quantity > 1 && (
                                                <div className="text-sm text-gray-500 mt-1">
                                                    (₪{getPricePerJob(quantity)} למשרה)
                                                </div>
                                            )}
                                            <div className="w-full h-[3px] bg-[#003566] mt-2 rounded-full"></div>
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

                {/* Payment Method Section (Existing) */}
                <h2 className="text-lg font-bold text-gray-800 text-right mb-4">אמצעי תשלום</h2>
                <Card className="rounded-2xl shadow-[0_2px_15px_rgba(0,0,0,0.04)] border border-gray-100 mb-10">
                    <CardContent className="p-3">
                        <div className="bg-[#F8FAFC] rounded-xl px-6 py-4 flex flex-col md:flex-row items-center justify-between gap-4">
                            {/* Right Side: Info */}
                            <div className="text-right space-y-1">
                                <p className="text-gray-500 text-sm">אמצעי תשלום</p>
                                <div className="flex items-center gap-2 justify-end">
                                    <p className="text-gray-500 text-sm tracking-widest font-normal" dir="ltr">xxxx {paymentData.cardNumber ? paymentData.cardNumber.replace(/\D/g, '').slice(-4) : '6655'}</p>
                                </div>
                            </div>
                            {/* Left Side: Button */}
                            <Button
                                onClick={() => setShowPaymentModal(true)}
                                className="bg-[#1E3A8A] hover:bg-[#1e293b] text-white rounded-full px-6 py-2 h-auto text-sm font-medium shadow-none w-full md:w-auto"
                            >
                                שינוי אמצעי תשלום
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Recent Transactions Section */}
                <div className="space-y-4">
                    <h2 className="text-lg font-bold text-gray-800 text-right">עסקאות אחרונות</h2>

                    <Card className="rounded-2xl shadow-[0_2px_15px_rgba(0,0,0,0.04)] border border-gray-100 p-4">
                        <div className="space-y-4">
                            {transactions.map((tx) => (
                                <div key={tx.id} className="bg-[#F8FAFC] hover:bg-gray-50 transition-colors rounded-xl p-6">
                                    <div className="flex flex-col gap-4">

                                        {/* Top Row: Date (Right) and Amount (Left) */}
                                        <div className="flex justify-between items-center w-full">
                                            <span className="font-normal text-gray-900">{tx.date}</span>
                                            <span className="font-normal text-gray-900 text-lg">₪{tx.amount}</span>
                                        </div>

                                        {/* Bottom Row: Buttons (Left) */}
                                        <div className="flex justify-end gap-3">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleExport(tx.id)}
                                                className="bg-white hover:bg-blue-50 text-[#1E3A8A] border-blue-200 rounded-full px-4 py-1 h-9 flex items-center gap-2 text-xs font-medium whitespace-nowrap order-1"
                                            >
                                                <FileOutput className="w-3.5 h-3.5 scale-x-[-1]" />
                                                ייצא
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleDownload(tx.id)}
                                                className="bg-white hover:bg-blue-50 text-[#1E3A8A] border-blue-200 rounded-full px-4 py-1 h-9 flex items-center gap-2 text-xs font-medium whitespace-nowrap order-2"
                                            >
                                                <Download className="w-3.5 h-3.5" />
                                                הורדה
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setSelectedInvoice(tx)}
                                                className="bg-white hover:bg-blue-50 text-[#1E3A8A] border-blue-200 rounded-full px-4 py-1 h-9 flex items-center gap-2 text-xs font-medium whitespace-nowrap order-3"
                                            >
                                                <Eye className="w-3.5 h-3.5" />
                                                צפייה
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Card>
                </div>
            </div>


            {/* Change Payment Method Modal */}
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

            {/* View Invoice Modal */}
            <Dialog open={!!selectedInvoice} onOpenChange={(open) => !open && setSelectedInvoice(null)}>
                <DialogContent className="sm:max-w-[425px]" dir="rtl">
                    <DialogHeader>
                        <DialogTitle className="text-center text-xl font-bold text-[#1E3A8A]">פרטי חשבונית</DialogTitle>
                    </DialogHeader>
                    {selectedInvoice && (
                        <div className="space-y-6 py-4">
                            <div className="text-center space-y-2 border-b pb-4">
                                <h3 className="text-2xl font-bold text-gray-900">₪{selectedInvoice.amount}</h3>
                                <p className="text-gray-500">{selectedInvoice.date}</p>
                            </div>
                            <div className="space-y-4">
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-gray-500">מספר חשבונית:</span>
                                    <span className="font-medium">INV-2025-00{selectedInvoice.id}</span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-gray-500">תיאור:</span>
                                    <span className="font-medium">{selectedInvoice.details}</span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-gray-500">סטטוס:</span>
                                    <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded-full text-xs font-medium">שולם</span>
                                </div>
                            </div>
                            <div className="flex gap-3 pt-4">
                                <Button className="flex-1 bg-[#1E3A8A] rounded-full" onClick={() => handleDownload(selectedInvoice.id)}>
                                    <Download className="w-4 h-4 ml-2" />
                                    הורד PDF
                                </Button>
                            </div>
                        </div>
                    )}
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
                            onClick={() => setShowSuccessModal(false)}
                            className="w-[80%] bg-[#2987CD] hover:bg-[#1C649B] text-white rounded-full py-6 text-lg font-bold shadow-lg"
                        >
                            אישור
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
