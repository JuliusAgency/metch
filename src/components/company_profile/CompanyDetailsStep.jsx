import React, { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";
import { WhatsAppVerificationDialog } from "@/components/dialogs/WhatsAppVerificationDialog";

const InfoInput = ({ placeholder, value, name, onChange, disabled, ...props }) => (
    <Input
        placeholder={placeholder}
        value={value}
        name={name}
        onChange={onChange}
        disabled={disabled}
        className="h-9 !text-[0.775rem] md:!text-[0.775rem] bg-white border-gray-300 rounded-full text-right pr-4 focus:border-blue-500 focus:ring-blue-500 transition-all placeholder:text-gray-400 disabled:bg-gray-50 disabled:text-gray-500 w-full"
        dir="rtl"
        {...props}
    />
);

const companyTypes = [
    { id: 'business', label: 'עסקית' },
    { id: 'placement', label: 'השמה' },
    { id: 'non_profit', label: 'עמותה' },
    { id: 'hr', label: 'כח אדם' },
];

const ChipButton = ({ label, isSelected, onClick }) => (
    <Button
        type="button"
        variant={isSelected ? 'default' : 'outline'}
        onClick={onClick}
        className={`rounded-full px-6 py-2 h-auto text-sm transition-all duration-200 ${isSelected ? 'bg-blue-600 text-white border-blue-600 shadow-md' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
            }`}
    >
        {label}
    </Button>
);

export default function CompanyDetailsStep({ companyData, setCompanyData }) {
    const [isVerificationOpen, setIsVerificationOpen] = useState(false);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setCompanyData(prev => ({ ...prev, [name]: value }));
    };

    const handleSendCode = () => {
        setIsVerificationOpen(true);
    };

    const handleVerified = (verifiedPhone) => {
        // Persist verification status
        setCompanyData(prev => ({
            ...prev,
            company_phone: verifiedPhone,
            is_phone_verified: true
        }));
        toast.success("הטלפון אומת בהצלחה");
    };

    const handleCompanyTypeSelect = (typeId) => {
        setCompanyData(prev => ({ ...prev, company_type: typeId }));
    };

    return (
        <div className="max-w-3xl mx-auto text-center" dir="rtl">
            <WhatsAppVerificationDialog
                isOpen={isVerificationOpen}
                onClose={() => setIsVerificationOpen(false)}
                onVerified={handleVerified}
                initialPhone={companyData.company_phone}
            />

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="space-y-10"
            >
                {/* Header */}
                <div className="space-y-2">
                    <h1 className="text-3xl font-bold text-[#001a6f]">מתחילים</h1>
                    <p className="text-gray-600 text-sm">כמה פרטים עליכם ועל החברה - מבטיחים שזה לא יהיה מתיש</p>
                    <h2 className="text-xl font-bold text-black pt-4">פרטי איש גיוס</h2>
                </div>

                {/* Recruiter Details - 3 Columns Layout */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-[110rem] mx-auto px-4">
                    <InfoInput
                        placeholder="שם מלא"
                        name="full_name"
                        value={companyData.full_name || ""}
                        onChange={handleInputChange}
                    />
                    <InfoInput
                        placeholder="מייל לקבלת קו״ח"
                        name="cv_reception_email"
                        value={companyData.cv_reception_email || ""}
                        onChange={handleInputChange}
                    />
                    <div className="relative w-full">
                        <InfoInput
                            placeholder="טלפון איש גיוס"
                            name="company_phone"
                            value={companyData.company_phone || ""}
                            onChange={handleInputChange}
                            disabled={companyData.is_phone_verified}
                        />
                        <Button
                            type="button"
                            onClick={() => setIsVerificationOpen(true)}
                            className={`absolute left-1.5 top-1/2 -translate-y-1/2 h-6 px-3 text-[10px] font-medium rounded-full transition-all ${companyData.is_phone_verified
                                ? 'bg-green-500 hover:bg-green-600 text-white'
                                : 'bg-[#1e88e5] text-white hover:bg-[#1565c0]'
                                }`}
                        >
                            {companyData.is_phone_verified ? 'אומת ✓' : 'שלח קוד'}
                        </Button>
                        {!companyData.is_phone_verified && (
                            <p
                                onClick={() => setIsVerificationOpen(true)}
                                className="text-xs text-[#1e88e5] font-medium cursor-pointer mt-1 text-right w-full hover:underline absolute top-full right-0"
                            >
                                לא קיבלתי שלח שוב
                            </p>
                        )}
                    </div>
                </div>

                {/* Company Details Section */}
                <div className="space-y-6 pt-8 border-t border-gray-100">
                    <h2 className="text-lg font-bold text-black">פרטי חברה</h2>

                    <div className="space-y-8">
                        {/* Company Type Selection (Moved Top, No Label) */}
                        <div className="flex flex-wrap justify-center gap-3">
                            {companyTypes.map(type => (
                                <ChipButton
                                    key={type.id}
                                    label={type.label}
                                    isSelected={companyData.company_type === type.id}
                                    onClick={() => handleCompanyTypeSelect(type.id)}
                                />
                            ))}
                        </div>

                        {/* Company Fields (Name, Field, Address - Grouped 3 Cols) */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-2 w-full max-w-[110rem] mx-auto px-4">
                            <InfoInput
                                placeholder="שם חברה"
                                name="company_name"
                                value={companyData.company_name || ""}
                                onChange={handleInputChange}
                            />
                            <InfoInput
                                placeholder="תחום פעילות"
                                name="field_of_activity"
                                value={companyData.field_of_activity || ""}
                                onChange={handleInputChange}
                            />
                            <div>
                                <InfoInput
                                    placeholder="כתובת ראשית"
                                    name="main_address"
                                    value={companyData.main_address || ""}
                                    onChange={handleInputChange}
                                />
                                <p className="text-[10px] text-gray-500 text-right mt-1 w-full mr-1">* מיקום החברה יכול להיות שונה ממיקום המשרה</p>
                            </div>
                            <InfoInput
                                placeholder="טלפון"
                                name="office_phone"
                                value={companyData.office_phone || ""}
                                onChange={handleInputChange}
                            />
                        </div>
                    </div>
                </div>
            </motion.div>

            <WhatsAppVerificationDialog
                isOpen={isVerificationOpen}
                onClose={() => setIsVerificationOpen(false)}
                initialPhone={companyData.company_phone}
                onVerified={(phone) => {
                    setCompanyData(prev => ({
                        ...prev,
                        company_phone: phone,
                        is_phone_verified: true
                    }));
                    setIsVerificationOpen(false);
                }}
            />
        </div >
    );
}
