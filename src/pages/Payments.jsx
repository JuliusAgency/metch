import React from 'react';
import { Button } from "@/components/ui/button";
import { Eye, Download, FileOutput, CreditCard } from 'lucide-react';
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Card, CardContent } from "@/components/ui/card";

export default function Payments() {
    // Mock data for transactions based on the screenshot
    const transactions = [
        { id: 1, amount: 349, date: '01/01/2025' },
        { id: 2, amount: 349, date: '01/01/2025' },
        { id: 3, amount: 349, date: '01/01/2025' },
    ];

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
                                    <Button className="bg-[#1E3A8A] hover:bg-[#1e293b] text-white rounded-full px-6 py-2 h-auto text-sm font-medium shadow-none w-full md:w-auto">
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
                                                        className="bg-white hover:bg-blue-50 text-[#1E3A8A] border-blue-200 rounded-full px-4 py-1 h-9 flex items-center gap-2 text-xs font-medium whitespace-nowrap order-1"
                                                    >
                                                        <FileOutput className="w-3.5 h-3.5" />
                                                        ייצא
                                                    </Button>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        className="bg-white hover:bg-blue-50 text-[#1E3A8A] border-blue-200 rounded-full px-4 py-1 h-9 flex items-center gap-2 text-xs font-medium whitespace-nowrap order-2"
                                                    >
                                                        <Download className="w-3.5 h-3.5" />
                                                        הורדה
                                                    </Button>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
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
        </div>
    );
}
