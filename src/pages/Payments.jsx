import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Eye, Download, FileOutput, ChevronRight } from 'lucide-react';
import { useNavigate, useSearchParams } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Card, CardContent } from "@/components/ui/card";
import { useUser } from "@/contexts/UserContext";
import { UserProfile, Job } from "@/api/entities";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import PaymentStep from "@/components/company_profile/PaymentStep";
import { useToast } from "@/components/ui/use-toast";
import settingsHeaderBg from "@/assets/settings_header_bg.png";
import paymentsMobileBg from "@/assets/payment_mobile_header.png";

export default function Payments() {
    const { toast } = useToast();
    const navigate = useNavigate();
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [selectedInvoice, setSelectedInvoice] = useState(null);
    const [paymentData, setPaymentData] = useState({}); // Mock state for PaymentStep
    const [searchParams] = useSearchParams();
    const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth < 768 : false);
    const [errors, setErrors] = useState({});

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Fetch User Profile and Jobs for Statistics
    const { user } = useUser();
    const [userProfile, setUserProfile] = useState(null);
    const [userJobs, setUserJobs] = useState([]);

    useEffect(() => {
        const fetchData = async () => {
            if (user?.id) {
                try {
                    // Fetch Profile for Credits
                    const profileData = await UserProfile.filter({ id: user.id });
                    if (profileData && profileData.length > 0) {
                        setUserProfile(profileData[0]);
                    }

                    // Fetch Jobs for Stats
                    const jobsData = await Job.filter({ created_by: user.email }); // Assuming filter by email based on JobManagement.jsx
                    if (jobsData) {
                        setUserJobs(jobsData);
                    }
                } catch (error) {
                    console.error("Error fetching payment stats data:", error);
                }
            }
        };
        fetchData();
    }, [user]);

    // Mock data initial state
    const [transactions, setTransactions] = useState([]);
    const [loadingTransactions, setLoadingTransactions] = useState(true);

    // Fetch Transactions
    useEffect(() => {
        const fetchTransactions = async () => {
            if (user?.id) {
                try {
                    console.log("Fetching transactions for user:", user.id);
                    setLoadingTransactions(true);

                    const { Transaction } = await import("@/api/entities");

                    // Fetch transactions for user, newest first
                    // Try/Catch specifically for the filter call
                    try {
                        const userTransactions = await Transaction.filter({ user_id: user.id }, '-created_at');
                        console.log("Transactions fetched:", userTransactions);

                        const formatted = userTransactions
                            .filter(t => {
                                if (t.status === 'pending') {
                                    const ageMinutes = (new Date().getTime() - new Date(t.created_at).getTime()) / (1000 * 60);
                                    return ageMinutes < 30; // Show pending only if fresh
                                }
                                return true;
                            })
                            .map(t => ({
                                id: t.id,
                                displayId: t.id.slice(0, 8),
                                amount: t.amount,
                                date: new Date(t.created_at).toLocaleDateString('he-IL'),
                                details: t.description || 'מנוי חודשי',
                                status: t.status,
                                invoiceNumber: t.metadata?.invoice_number,
                                invoiceUrl: t.metadata?.invoice_url
                            }));

                        setTransactions(formatted);
                    } catch (dbError) {
                        console.error("Database error fetching transactions:", dbError);
                        // If table not found, it might throw
                    }
                } catch (error) {
                    console.error("Failed to load entities or fetch transactions:", error);
                } finally {
                    setLoadingTransactions(false);
                }
            }
        };
        fetchTransactions();

        const handleRefresh = () => fetchTransactions();
        window.addEventListener('refresh-payments', handleRefresh);
        return () => window.removeEventListener('refresh-payments', handleRefresh);
    }, [user]);


    useEffect(() => {
        if (searchParams.get('success') === 'true') {
            toast({
                title: "התשלום עבר בהצלחה",
                description: "יתרת המשרות שלך עודכנה!",
            });
            // Force refresh data
            const fetchData = async () => {
                if (user?.id) {
                    console.log('Force refreshing data for success state. User ID:', user.id);
                    const { UserProfile, Job, Transaction } = await import("@/api/entities");

                    const profileData = await UserProfile.filter({ id: user.id });
                    console.log('--- REFRESH: Profile Data ---', profileData);
                    if (profileData && profileData.length > 0) {
                        console.log('Updating userProfile state with credits:', profileData[0].job_credits);
                        setUserProfile(profileData[0]);
                    }

                    console.log('Fetching transactions for refresh...');
                    const userTransactions = await Transaction.filter({ user_id: user.id }, '-created_at');
                    console.log('--- REFRESH: Transactions Raw ---', userTransactions);

                    console.log('Fetching jobs for stats refresh...');
                    const jobsData = await Job.filter({ created_by: user.email });
                    console.log('--- REFRESH: Jobs Data ---', jobsData);
                    if (jobsData) setUserJobs(jobsData);

                    const formatted = userTransactions
                        .filter(t => {
                            if (t.status === 'pending') {
                                const ageMinutes = (new Date().getTime() - new Date(t.created_at).getTime()) / (1000 * 60);
                                return ageMinutes < 30; // Show pending only if fresh
                            }
                            return true;
                        })
                        .map(t => ({
                            id: t.id,
                            displayId: t.id.slice(0, 8),
                            amount: t.amount,
                            date: new Date(t.created_at).toLocaleDateString('he-IL'),
                            details: t.description || 'מנוי חודשי',
                            status: t.status,
                            invoiceNumber: t.metadata?.invoice_number,
                            invoiceUrl: t.metadata?.invoice_url
                        }));
                    console.log('Formatted transactions:', formatted);
                    setTransactions(formatted);
                } else {
                    console.warn('Cannot refresh data: No user ID found');
                }
            };
            fetchData();
        }
    }, [searchParams, user, toast]);

    const handleExport = (id) => {
        // Find the transaction
        const tx = transactions.find(t => t.id === id);
        if (!tx) return;

        // Mock CSV download with BOM for Hebrew support
        // Columns: Invoice Number, Date, Amount, Description, Status
        const headers = "מספר חשבונית,תאריך,סכום,תיאור,סטטוס";
        const displayInv = tx.invoiceNumber || "בטיפול";
        const row = `${displayInv},${tx.date},₪${tx.amount},${tx.details},שולם`;

        const csvContent = "\uFEFF" + headers + "\n" + row;
        const encodedUri = encodeURI(`data:text/csv;charset=utf-8,${csvContent}`);

        const fileName = tx.invoiceNumber ? `invoice_${tx.invoiceNumber}.csv` : `transaction_${tx.displayId || id}.csv`;

        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", fileName);
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

        // If we have a real invoice URL from Cardcom, open it
        if (tx.invoiceUrl) {
            window.open(tx.invoiceUrl, '_blank');
            return;
        }

        // Helper to formatting PDF text (Fallback mock)
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
(Invoice Number: ${tx.invoiceNumber || 'Processing...'}) Tj
0 -25 Td
(Date: ${tx.date}) Tj
0 -25 Td
(Amount: ${tx.amount} NIS) Tj
0 -25 Td
(Status: Paid) Tj
0 -25 Td
(Description: ${tx.details || 'Job Purchase'}) Tj
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
        const fileName = tx.invoiceNumber ? `invoice_${tx.invoiceNumber}.pdf` : `transaction_${tx.displayId || id}.pdf`;
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', fileName);
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
                                {/* Mobile Statistics Bar with Integrated Button (Side-by-side) */}
                                <div className="bg-white rounded-[20px] shadow-[0_2px_15px_rgba(0,0,0,0.04)] border border-gray-100 p-3 mb-6 relative z-10">
                                    <div className="flex items-center gap-2">
                                        {/* Statistics Row (NARROWER) */}
                                        <div className="flex-1 flex justify-between items-center text-center">
                                            <div className="flex flex-col items-center flex-1 border-l border-gray-100 px-0.5">
                                                <span className="text-gray-900 font-bold text-base leading-tight">
                                                    {(userProfile?.job_credits || 0) + (userJobs.filter(j => j.status === 'active').length || 0) + (userJobs.filter(j => j.status === 'closed' || j.status === 'ended').length || 0)}
                                                </span>
                                                <span className="text-gray-500 text-[9px] whitespace-nowrap">חבילה</span>
                                            </div>

                                            <div className="flex flex-col items-center flex-1 border-l border-gray-100 px-0.5">
                                                <span className="text-gray-500 font-bold text-base leading-tight">{userProfile?.job_credits || 0}</span>
                                                <span className="text-gray-500 text-[9px] whitespace-nowrap">יתרה</span>
                                            </div>

                                            <div className="flex flex-col items-center flex-1 border-l border-gray-100 px-0.5">
                                                <span className="text-gray-500 font-bold text-base leading-tight">{userJobs.filter(j => j.status === 'active').length || 0}</span>
                                                <span className="text-gray-500 text-[9px] whitespace-nowrap">בפרסום</span>
                                            </div>

                                            <div className="flex flex-col items-center flex-1 px-0.5">
                                                <span className="text-gray-500 font-bold text-base leading-tight">{userJobs.filter(j => j.status === 'closed' || j.status === 'ended').length || 0}</span>
                                                <span className="text-gray-500 text-[9px] whitespace-nowrap">הסתיימו</span>
                                            </div>
                                        </div>

                                        {/* Side Button */}
                                        <div className="w-[75px] flex-shrink-0">
                                            <Button
                                                onClick={handleSelectPackage}
                                                className="w-full bg-[#2987cd] hover:bg-[#1f6ba8] text-white text-[11px] leading-tight rounded-xl h-[40px] font-bold shadow-sm p-1"
                                            >
                                                לרכישה
                                            </Button>
                                        </div>
                                    </div>
                                </div>

                                {/* Recent Transactions - Mobile Updated */}
                                <div>
                                    <h2 className="text-[16px] font-bold text-gray-800 text-right mb-4 pr-1">עסקאות אחרונות</h2>
                                    <div className="space-y-4">
                                        {transactions.map((tx, index) => (
                                            <div key={tx.id} className="bg-white p-5 rounded-[20px] shadow-[0_2px_15px_rgba(0,0,0,0.04)] border border-gray-50/50">
                                                <div className="flex flex-col gap-4">
                                                    {/* Top Row: Date & Amount */}
                                                    <div className="flex justify-between items-center w-full">
                                                        <div className="flex flex-col items-start">
                                                            <span className="text-[18px] text-gray-900 font-bold">₪{tx.amount}</span>
                                                            <div className="flex items-center gap-2">
                                                                <span className={`text-[12px] font-medium ${tx.status === 'pending' ? 'text-amber-500' : 'text-green-600'}`}>
                                                                    {tx.status === 'pending' ? 'בטיפול' : 'שולם'}
                                                                </span>
                                                                {tx.invoiceNumber && (
                                                                    <span className="text-[11px] text-gray-400">#{tx.invoiceNumber}</span>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <span className="text-[16px] text-gray-900 font-normal tracking-wide">{tx.date}</span>
                                                    </div>

                                                    {/* Buttons Row */}
                                                    <div className="flex justify-between gap-3 mt-1">
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => tx.invoiceUrl ? window.open(tx.invoiceUrl, '_blank') : setSelectedInvoice(tx)}
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
                            {/* Statistics Bar - Desktop */}
                            <Card className="rounded-2xl shadow-[0_2px_15px_rgba(0,0,0,0.04)] border border-gray-100 mb-8">
                                <CardContent className="p-1">
                                    <div className="bg-[#F8FAFC] rounded-xl px-6 py-4 flex flex-col md:flex-row items-center justify-between gap-4 h-20">
                                        <div className="flex items-center gap-8 w-full">
                                            <div className="flex-1 text-right border-l border-gray-200 pl-8">
                                                <div className="flex items-center gap-2 whitespace-nowrap">
                                                    <span className="text-gray-900 font-bold text-lg">חבילת משרות פעילה:</span>
                                                    <span className="text-gray-900 font-bold text-xl">
                                                        {(userProfile?.job_credits || 0) + (userJobs.filter(j => j.status === 'active').length || 0) + (userJobs.filter(j => j.status === 'closed' || j.status === 'ended').length || 0)}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="flex-1 text-right border-l border-gray-200 pl-8">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-gray-500 text-sm">זמינות לפרסום:</span>
                                                    <span className="text-gray-500 font-bold text-lg">{userProfile?.job_credits || 0}</span>
                                                </div>
                                            </div>

                                            <div className="flex-1 text-right border-l border-gray-200 pl-8">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-gray-500 text-sm">בפרסום פעיל:</span>
                                                    <span className="text-gray-500 font-bold text-lg">{userJobs.filter(j => j.status === 'active').length || 0}</span>
                                                </div>
                                            </div>

                                            <div className="flex-1 text-right">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-gray-500 text-sm">משרות שהסתיימו:</span>
                                                    <span className="text-gray-500 font-bold text-lg">{userJobs.filter(j => j.status === 'closed' || j.status === 'ended').length || 0}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3 w-auto">
                                            <Button
                                                onClick={handleSelectPackage}
                                                className="bg-[#2987cd] hover:bg-[#1f6ba8] text-white rounded-full px-8 py-2 h-10 text-sm font-bold shadow-none whitespace-nowrap"
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
                                                        <div className="flex items-center gap-4">
                                                            <span className="font-normal text-gray-900">{tx.date}</span>
                                                            <div className="flex items-center gap-2">
                                                                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${tx.status === 'pending' ? 'bg-amber-50 text-amber-600' : 'bg-green-50 text-green-600'}`}>
                                                                    {tx.status === 'pending' ? 'בטיפול' : 'שולם'}
                                                                </span>
                                                                {tx.invoiceNumber && (
                                                                    <span className="text-[11px] text-gray-400">#{tx.invoiceNumber}</span>
                                                                )}
                                                            </div>
                                                        </div>
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
                                                        <Button variant="outline" size="sm" onClick={() => tx.invoiceUrl ? window.open(tx.invoiceUrl, '_blank') : setSelectedInvoice(tx)} className="bg-white hover:bg-blue-50 text-[#1E3A8A] border-blue-200 rounded-full px-4 py-1 h-9 flex items-center gap-2 text-xs font-medium whitespace-nowrap order-3">
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
                                        {showPaymentModal && (
                                            <PaymentStep
                                                setPaymentData={setPaymentData}
                                                errors={errors}
                                                setErrors={setErrors}
                                                userProfile={userProfile}
                                            />
                                        )}
                                    </div>

                                    {/* Action Button - Hidden for Iframe flow (iframe has its own button) */}
                                    {/* <div className="mt-4 px-2">
                             <Button onClick={handleSavePaymentMethod} ... >עדכון</Button>
                        </div> */}
                                </div>
                            </div>
                        )
                        }

                        {/* Desktop Modal */}
                        {!isMobile && (
                            <Dialog open={showPaymentModal} onOpenChange={setShowPaymentModal}>
                                <DialogContent className="sm:max-w-[700px] h-[80vh] overflow-y-auto" dir="rtl">
                                    <DialogHeader>
                                        <DialogTitle className="text-center text-xl font-bold text-[#1E3A8A]">עדכון אמצעי תשלום</DialogTitle>
                                    </DialogHeader>
                                    <div className="py-4 h-full">
                                        {showPaymentModal && (
                                            <PaymentStep
                                                paymentData={paymentData}
                                                setPaymentData={setPaymentData}
                                                errors={errors}
                                                setErrors={setErrors}
                                                userProfile={userProfile}
                                            />
                                        )}
                                        {/* Action Button - Hidden for Iframe flow */}
                                        {/* <div className="mt-8 flex justify-center">
                                <Button onClick={handleSavePaymentMethod} ... >שמירת אמצעי תשלום</Button>
                            </div> */}
                                    </div>
                                </DialogContent>
                            </Dialog>
                        )
                        }

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
                                                <span className="font-medium text-left" dir="ltr">{selectedInvoice.invoiceNumber || "בביצוע (קיימת במייל)"}</span>
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
                </div>
            </div>
        </div>
    );
}
