import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";

const companyTypes = [
    { id: 'business', label: 'עסקית' },
    { id: 'placement', label: 'השמה' },
    { id: 'non_profit', label: 'עמותה' },
    { id: 'hr', label: 'כח אדם' },
];

const InfoInput = ({ placeholder, value, name, onChange }) => (
    <Input
        placeholder={placeholder}
        value={value}
        name={name}
        onChange={onChange}
        className="h-12 bg-white border-gray-300 rounded-full text-center focus:border-blue-500 focus:ring-blue-500 transition-all"
        dir="rtl"
    />
);

const ChipButton = ({ label, isSelected, onClick }) => (
    <Button
        type="button"
        variant={isSelected ? 'default' : 'outline'}
        onClick={onClick}
        className={`rounded-full px-8 py-3 h-auto transition-all duration-200 ${
            isSelected ? 'bg-blue-600 text-white border-blue-600 shadow-md' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
        }`}
    >
        {label}
    </Button>
);

export default function CompanyDetailsStep({ formData, setFormData }) {
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleCompanyTypeSelect = (typeId) => {
        setFormData(prev => ({ ...prev, company_type: typeId }));
    };

    return (
        <div className="max-w-4xl mx-auto text-center" dir="rtl">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="space-y-12"
            >
                {/* Header */}
                <div className="space-y-3">
                    <h1 className="text-3xl font-bold text-gray-900">בואו נתחיל</h1>
                    <p className="text-gray-600">כמה פרטים עליכם ועל החברה - מבטיחים שזה לא יהיה מתיש</p>
                </div>

                {/* Info Inputs */}
                <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <InfoInput placeholder="שם מלא - איש גיוס" name="full_name" value={formData.full_name || ""} onChange={handleInputChange} />
                        <InfoInput placeholder="שם חברה" name="company_name" value={formData.company_name || ""} onChange={handleInputChange} />
                        <InfoInput placeholder="מספר טלפון - איש גיוס" name="phone" value={formData.phone || ""} onChange={handleInputChange} />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto">
                        <InfoInput placeholder="מייל לקבלת קו״ח" name="cv_reception_email" value={formData.cv_reception_email || ""} onChange={handleInputChange} />
                        <div className="relative">
                            <InfoInput placeholder="מספר טלפון" name="company_phone" value={formData.company_phone || ""} onChange={handleInputChange} />
                            <Button type="button" className="absolute left-2 top-1/2 -translate-y-1/2 h-9 px-4 rounded-full bg-blue-100 text-blue-600 hover:bg-blue-200">
                                שלח קוד
                            </Button>
                        </div>
                    </div>
                     <p className="text-xs text-gray-500 hover:text-blue-600 cursor-pointer">לא קיבלת? שלח שוב</p>
                </div>

                {/* Company Type Selection */}
                <div className="space-y-6">
                    <h2 className="text-xl font-bold text-gray-900">סוג חברה</h2>
                    <div className="flex flex-wrap justify-center gap-4">
                        {companyTypes.map(type => (
                            <ChipButton
                                key={type.id}
                                label={type.label}
                                isSelected={formData.company_type === type.id}
                                onClick={() => handleCompanyTypeSelect(type.id)}
                            />
                        ))}
                    </div>
                </div>

                {/* Placeholder Chips */}
                <div className="space-y-4">
                     <div className="flex flex-wrap justify-center gap-4">
                        <ChipButton label="כתובת ראשית" isSelected={false} onClick={() => {}} />
                        <ChipButton label="תחום פעילות" isSelected={false} onClick={() => {}} />
                     </div>
                     <p className="text-xs text-gray-500">* מיקום החברה יכול להיות שונה ממיקום המשרה</p>
                </div>
            </motion.div>
        </div>
    );
}