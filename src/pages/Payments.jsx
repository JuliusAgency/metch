import React from 'react';
import { Button } from "@/components/ui/button";
import { Eye, Download, LogOut } from 'lucide-react';

export default function Payments() {
    // Mock data for transactions based on the screenshot
    const transactions = [
        { id: 1, amount: 349, date: '01/01/2025' },
        { id: 2, amount: 349, date: '01/01/2025' },
        { id: 3, amount: 349, date: '01/01/2025' },
    ];

    return (
        <div className="container mx-auto px-4 py-8 max-w-5xl" dir="rtl">
            {/* Page Title */}
            <h1 className="text-3xl font-bold text-center text-[#0F172A] mb-8">עמוד תשלומים</h1>

            {/* Payment Method Section */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-8 flex items-center justify-between">
                {/* Right Side: Info */}
                <div className="text-right">
                    <p className="text-gray-400 text-xs mb-1">אמצעי תשלום</p>
                    <p className="font-medium text-gray-600 text-sm" dir="ltr">xxxx 6655</p>
                </div>
                {/* Left Side: Button */}
                <Button className="bg-[#0F172A] hover:bg-[#1e293b] text-white rounded-full px-6 py-2 h-auto text-sm font-medium">
                    שינוי אמצעי תשלום
                </Button>
            </div>

            {/* Recent Transactions Title */}
            <h2 className="text-lg font-bold text-gray-800 mb-4 text-right">עסקאות אחרונות</h2>

            {/* Transactions List */}
            <div className="space-y-4">
                {transactions.map((tx) => (
                    <div key={tx.id} className="bg-gray-50/50 rounded-xl p-6 flex items-center justify-between">
                        {/* Right Side: Info */}
                        <div className="flex items-center gap-16 text-right">
                            <span className="font-medium text-gray-600 text-sm">{tx.date}</span>
                            <span className="font-bold text-gray-900 text-lg min-w-[60px]">₪{tx.amount}</span>
                        </div>

                        {/* Left Side: Buttons */}
                        <div className="flex items-center gap-3">
                            <Button
                                variant="outline"
                                size="sm"
                                className="bg-white hover:bg-gray-50 text-[#1e3a8a] border-blue-200 rounded-full px-4 h-9 flex items-center gap-2 text-xs font-medium"
                            >
                                <Eye className="w-4 h-4" />
                                צפייה
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                className="bg-white hover:bg-gray-50 text-[#1e3a8a] border-blue-200 rounded-full px-4 h-9 flex items-center gap-2 text-xs font-medium"
                            >
                                <Download className="w-4 h-4" />
                                הורדה
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                className="bg-white hover:bg-gray-50 text-[#1e3a8a] border-blue-200 rounded-full px-4 h-9 flex items-center gap-2 text-xs font-medium"
                            >
                                <LogOut className="w-4 h-4 rotate-90" /> {/* Rotating to look like export */}
                                ייצא
                            </Button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
