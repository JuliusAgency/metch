
import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, ArrowLeft } from "lucide-react";
import PackageSelectionStep from "@/components/company_profile/PackageSelectionStep";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function Packages() {
    const navigate = useNavigate();
    const [packageData, setPackageData] = useState({
        type: 'per_job',
        quantity: 1,
        price: 600
    });

    const handleContinue = () => {
        // In a real app, this would go to a checkout page or process payment
        // For now, we'll navigate back to Payments with a success indicator or similar
        navigate(createPageUrl("Payments"));
    };

    return (
        <div className="p-4 md:p-6" dir="rtl">
            <div className="w-[85vw] mx-auto">
                <Card className="bg-white rounded-2xl md:rounded-[2.5rem] shadow-xl border border-gray-100 overflow-hidden p-8">
                    <div className="max-w-4xl mx-auto">
                        <div className="my-10 min-h-[300px]">
                            <PackageSelectionStep packageData={packageData} setPackageData={setPackageData} onBack={() => navigate(-1)} />
                        </div>

                        <div className="flex justify-between items-center mt-12">
                            <Button
                                variant="outline"
                                className="px-6 py-3 rounded-full font-bold text-lg"
                                onClick={() => navigate(-1)}
                            >
                                חזור
                                <ArrowRight className="w-5 h-5 mr-2" />
                            </Button>
                            {packageData.quantity < 10 && (
                                <Button
                                    className="bg-blue-600 hover:bg-blue-700 text-white rounded-full font-bold shadow-lg px-12 py-3 text-lg"
                                    onClick={handleContinue}
                                >
                                    המשך לתשלום
                                    <ArrowLeft className="w-5 h-5 ml-2" />
                                </Button>
                            )}
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    );
}
