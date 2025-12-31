import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Eye, Download, FileOutput, CreditCard, X } from 'lucide-react';
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Card, CardContent } from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import PaymentStep from "@/components/company_profile/PaymentStep";
import { useToast } from "@/components/ui/use-toast";

export default function Payments() {
    const { toast } = useToast();
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [selectedInvoice, setSelectedInvoice] = useState(null);
    const [formData, setFormData] = useState({ payment_info: {} }); // Mock state for PaymentStep

    // Mock data for transactions based on the screenshot
    const transactions = [
        { id: 1, amount: 349, date: '01/01/2025', details: 'מנוי חודשי - חבילת פרימיום' },
        { id: 2, amount: 349, date: '01/01/2025', details: 'מנוי חודשי - חבילת פרימיום' },
        { id: 3, amount: 349, date: '01/01/2025', details: 'מנוי חודשי - חבילת פרימיום' },
    ];

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
        setShowPaymentModal(false);
        toast({
            title: "אמצעי תשלום עודכן",
            description: "פרטי האשראי עודכנו בהצלחה במערכת",
        });
    };

    return (
        <div className="min-h-screen relative overflow-hidden" dir="rtl">
            {/* Top Blue Gradient Background */}
            <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-l from-[#CBE8F6] to-[#E3F2F6] z-0" />

            {/* Main Content with Curve */}
            <div className="relative z-10 pt-[80px]">
                <div className="relative bg-white min-h-[calc(100vh-100px)] rounded-t-[5rem] shadow-[0_-10px_40px_rgba(0,0,0,0.05)] mx-4 md:mx-0">
                    <div className="max-w-4xl mx-auto px-6 py-12 space-y-10">
                        {/* Page Title */}
                        <h1 className="text-3xl font-bold text-center text-[#1E3A8A]">עמוד תשלומים</h1>

                        {/* Payment Method Section */}
                        <Card className="rounded-2xl shadow-[0_2px_15px_rgba(0,0,0,0.04)] border border-gray-100">
                            <CardContent className="p-3">
                                <div className="bg-[#F8FAFC] rounded-xl px-6 py-4 flex flex-col md:flex-row items-center justify-between gap-4">
                                    {/* Right Side: Info */}
                                    <div className="text-right space-y-1">
                                        <p className="text-gray-500 text-sm">אמצעי תשלום</p>
                                        <div className="flex items-center gap-2 justify-end">
                                            <p className="text-gray-500 text-sm tracking-widest font-normal" dir="ltr">xxxx 6655</p>
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
                </div>
            </div>

            {/* Change Payment Method Modal */}
            <Dialog open={showPaymentModal} onOpenChange={setShowPaymentModal}>
                <DialogContent className="sm:max-w-[600px] h-[80vh] overflow-y-auto" dir="rtl">
                    <DialogHeader>
                        <DialogTitle className="text-center text-xl font-bold text-[#1E3A8A]">עדכון אמצעי תשלום</DialogTitle>
                    </DialogHeader>
                    <div className="py-4">
                        <PaymentStep formData={formData} setFormData={setFormData} />
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
        </div>
    );
}
