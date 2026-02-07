import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Eye, Download, FileOutput, ChevronRight } from 'lucide-react';
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Card, CardContent } from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import PaymentStep, { validationUtils } from "@/components/company_profile/PaymentStep";
import { useToast } from "@/components/ui/use-toast";
import settingsHeaderBg from "@/assets/settings_header_bg.png";
import paymentsMobileBg from "@/assets/payment_mobile_header.png";

export default function Payments() {
    const { toast } = useToast();
    const navigate = useNavigate();
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [selectedInvoice, setSelectedInvoice] = useState(null);
    const [paymentData, setPaymentData] = useState({}); // Mock state for PaymentStep
    const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth < 768 : false);
    const [errors, setErrors] = useState({});

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Mock data initial state
    const [transactions, setTransactions] = useState([
        { id: 1, amount: 349, date: '01/01/2025', details: 'מנוי חודשי - חבילת פרימיום' },
        { id: 2, amount: 349, date: '01/01/2025', details: 'מנוי חודשי - חבילת פרימיום' },
        { id: 3, amount: 349, date: '01/01/2025', details: 'מנוי חודשי - חבילת פרימיום' },
        { id: 4, amount: 349, date: '01/01/2025', details: 'מנוי חודשי - חבילת פרימיום' },
        { id: 5, amount: 349, date: '01/01/2025', details: 'מנוי חודשי - חבילת פרימיום' },
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

    const handleSelectPackage = () => {
        navigate(createPageUrl("Packages"));
    };

    return (
        <div className="h-full relative overflow-visible" dir="rtl">
            {/* Mobile-Only Background Image - Fixed to the top */}
            <div
                className="md:hidden fixed top-0 left-0 right-0 h-[210px] z-0 pointer-events-none"
                style={{
                    backgroundImage: `url(${paymentsMobileBg})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'top center',
                    backgroundRepeat: 'no-repeat'
                }}
            />

            <div className="relative h-full md:w-[98%] mx-auto">
                {/* Desktop Header */}
                <div className="relative h-32 overflow-hidden w-full hidden md:block">
                    <div
                        className="absolute inset-0 w-full h-full"
                        style={{
                            backgroundImage: `url(${settingsHeaderBg})`,
                            backgroundSize: "100% 100%",
                            backgroundPosition: "center",
                            backgroundRepeat: "no-repeat",
                        }}
                    />
                    <button
                        onClick={() => navigate(createPageUrl("Dashboard"))}
                        className="absolute top-4 right-6 w-10 h-10 bg-white/30 rounded-full flex items-center justify-center backdrop-blur-sm hover:bg-white/50 transition-colors z-10"
                    >
                        <ChevronRight className="w-6 h-6 text-gray-800" />
                    </button>
                </div>

                {/* Content Container */}
                <div className="p-0 md:p-8 mt-24 md:-mt-20 relative z-10 w-full mx-auto">
                    {/* Main Card / Container */}
                    <div className="bg-transparent md:bg-transparent min-h-screen md:min-h-0 pt-0 md:pt-0 px-0 md:px-0">
                        {/* Desktop only title */}
                        <div className="text-center pb-4 hidden md:block">
                            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                                עמוד תשלומים
                            </h1>
                        </div>

                        {/* Mobile Title */}
                        <div className="text-center absolute top-[-65px] left-0 right-0 w-full md:hidden">
                            <h1 className="text-[24px] font-bold text-[#001a6e]">
                                עמוד תשלומים
                            </h1>
                        </div>

                        {/* Mobile Content Container - No "frame" or shadow, just content */}
                        <div className="md:hidden bg-transparent p-4">
                            {/* Payment Method Section - Mobile Updated */}
                            <div className="max-w-md mx-auto">
                                <Card className="rounded-[16px] shadow-[0_2px_12px_rgba(0,0,0,0.04)] border border-gray-100 mb-8 bg-white">
                                    <CardContent className="p-0">
                                        <div className="bg-white rounded-[16px] p-4 flex items-center justify-between">
                                            {/* Left Side: Button */}
                                            <div>
                                                <Button
                                                    onClick={() => setShowPaymentModal(true)}
                                                    className="bg-[#001a6e] hover:bg-[#1e293b] text-white text-[12px] rounded-full px-5 py-2 h-9 font-medium shadow-none whitespace-nowrap"
                                                >
                                                    שינוי אמצעי תשלום
                                                </Button>
                                            </div>

                                            {/* Right Side: Info */}
                                            <div className="text-right">
                                                <p className="text-gray-400 text-[11px] mb-0.5">אמצעי תשלום</p>
                                                <p className="text-gray-600 text-[14px] font-normal" dir="ltr">xxxx {paymentData.cardNumber ? paymentData.cardNumber.replace(/\D/g, '').slice(-4) : '6655'}</p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Recent Transactions - Mobile Updated */}
                                <div>
                                    <h2 className="text-[16px] font-bold text-gray-800 text-right mb-4 pr-1">עסקאות אחרונות</h2>
                                    <div className="space-y-4">
                                        {transactions.map((tx, index) => (
                                            <div key={tx.id} className="bg-white p-5 rounded-[20px] shadow-[0_2px_15px_rgba(0,0,0,0.03)] border border-gray-50/50">
                                                <div className="flex flex-col gap-4">
                                                    {/* Top Row: Date & Amount */}
                                                    <div className="flex justify-between items-center w-full">
                                                        <span className="text-[18px] text-gray-900 font-bold">₪{tx.amount}</span>
                                                        <span className="text-[16px] text-gray-900 font-normal tracking-wide">{tx.date}</span>
                                                    </div>

                                                    {/* Buttons Row - Full width buttons outlined */}
                                                    <div className="flex justify-between gap-3 mt-1">
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => setSelectedInvoice(tx)}
                                                            className="flex-1 bg-white hover:bg-gray-50 text-[#54627d] border-[#54627d]/30 rounded-full h-9 text-[13px] font-medium flex items-center justify-center gap-2"
                                                        >
                                                            <Eye className="w-4 h-4 text-[#54627d]" />
                                                            צפייה
                                                        </Button>
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => handleDownload(tx.id)}
                                                            className="flex-1 bg-white hover:bg-gray-50 text-[#54627d] border-[#54627d]/30 rounded-full h-9 text-[13px] font-medium flex items-center justify-center gap-2"
                                                        >
                                                            <Download className="w-4 h-4 text-[#54627d]" />
                                                            הורדה
                                                        </Button>
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => handleExport(tx.id)}
                                                            className="flex-1 bg-white hover:bg-gray-50 text-[#54627d] border-[#54627d]/30 rounded-full h-9 text-[13px] font-medium flex items-center justify-center gap-2"
                                                        >
                                                            <FileOutput className="w-4 h-4 text-[#54627d] scale-x-[-1]" />
                                                            ייצא
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Desktop View (Hidden on Mobile) */}
                        <div className="hidden md:block max-w-5xl mx-auto">
                            {/* Payment Method Section - Desktop */}
                            <Card className="rounded-2xl shadow-[0_2px_15px_rgba(0,0,0,0.04)] border border-gray-100 mb-8">
                                <CardContent className="p-3">
                                    <div className="bg-[#F8FAFC] rounded-xl px-6 py-4 flex flex-col md:flex-row items-center justify-between gap-4">
                                        <div className="text-right space-y-1">
                                            <p className="text-gray-500 text-sm">אמצעי תשלום</p>
                                            <div className="flex items-center gap-2 justify-end">
                                                <p className="text-gray-500 text-sm tracking-widest font-normal" dir="ltr">xxxx {paymentData.cardNumber ? paymentData.cardNumber.replace(/\D/g, '').slice(-4) : '6655'}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3 w-full md:w-auto mt-2 md:mt-0">
                                            <Button
                                                onClick={() => setShowPaymentModal(true)}
                                                className="bg-[#1E3A8A] hover:bg-[#1e293b] text-white rounded-full px-6 py-2 h-auto text-sm font-medium shadow-none w-full md:w-auto"
                                            >
                                                שינוי אמצעי תשלום
                                            </Button>
                                            <Button
                                                onClick={handleSelectPackage}
                                                className="bg-[#2987cd] hover:bg-[#1f6ba8] text-white rounded-full px-6 py-2 h-auto text-sm font-medium shadow-none w-full md:w-auto"
                                            >
                                                לרכישת משרות
                                            </Button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Recent Transactions Section - Desktop */}
                            <div className="space-y-4">
                                <h2 className="text-lg font-bold text-gray-800 text-right">עסקאות אחרונות</h2>
                                <Card className="rounded-2xl shadow-[0_2px_15px_rgba(0,0,0,0.04)] border border-gray-100 p-4">
                                    <div className="space-y-4">
                                        {transactions.map((tx) => (
                                            <div key={tx.id} className="bg-[#F8FAFC] hover:bg-gray-50 transition-colors rounded-xl p-6">
                                                <div className="flex flex-col gap-4">
                                                    <div className="flex justify-between items-center w-full">
                                                        <span className="font-normal text-gray-900">{tx.date}</span>
                                                        <span className="font-normal text-gray-900 text-lg">₪{tx.amount}</span>
                                                    </div>
                                                    <div className="flex justify-end gap-3">
                                                        <Button variant="outline" size="sm" onClick={() => handleExport(tx.id)} className="bg-white hover:bg-blue-50 text-[#1E3A8A] border-blue-200 rounded-full px-4 py-1 h-9 flex items-center gap-2 text-xs font-medium whitespace-nowrap order-1">
                                                            <FileOutput className="w-3.5 h-3.5 scale-x-[-1]" />
                                                            ייצוא למייל
                                                        </Button>
                                                        <Button variant="outline" size="sm" onClick={() => handleDownload(tx.id)} className="bg-white hover:bg-blue-50 text-[#1E3A8A] border-blue-200 rounded-full px-4 py-1 h-9 flex items-center gap-2 text-xs font-medium whitespace-nowrap order-2">
                                                            <Download className="w-3.5 h-3.5" />
                                                            הורדה
                                                        </Button>
                                                        <Button variant="outline" size="sm" onClick={() => setSelectedInvoice(tx)} className="bg-white hover:bg-blue-50 text-[#1E3A8A] border-blue-200 rounded-full px-4 py-1 h-9 flex items-center gap-2 text-xs font-medium whitespace-nowrap order-3">
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

                    </div>
                </div>
            </div>


            {/* Change Payment Method Modal */}
            {/* Mobile Edit Payment Page Overlay */}
            {showPaymentModal && isMobile && (
                <div className="fixed inset-0 z-40 bg-[#eff6ff] overflow-y-auto pt-20 pb-10 px-4 animate-in fade-in slide-in-from-bottom-10 duration-300">
                    <div className="max-w-lg mx-auto">
                        {/* Header Area */}
                        <div className="text-center mb-6 relative">
                            <h2 className="text-[24px] font-bold text-[#001a6e]">עדכון אמצעי תשלום</h2>
                            <button
                                onClick={() => setShowPaymentModal(false)}
                                className="absolute top-1 right-0 p-1.5 rounded-full bg-white/60 hover:bg-white text-gray-500 shadow-sm"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
                            </button>
                        </div>

                        {/* White Card Container */}
                        <div className="bg-white rounded-[24px] shadow-[0_4px_30px_rgba(0,0,0,0.06)] p-6 mb-8 relative border border-white">
                            <PaymentStep
                                paymentData={paymentData}
                                setPaymentData={setPaymentData}
                                errors={errors}
                                setErrors={setErrors}
                            />
                        </div>

                        {/* Action Button */}
                        <div className="mt-4 px-2">
                            <Button
                                onClick={handleSavePaymentMethod}
                                className="w-full bg-[#2987cd] hover:bg-[#2070ab] text-white rounded-full h-14 text-lg font-bold shadow-xl shadow-blue-200/50"
                            >
                                עדכון
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Desktop Modal */}
            {!isMobile && (
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
                                    שמירת אמצעי תשלום
                                </Button>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>
            )}

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
        </div>
    );
}
