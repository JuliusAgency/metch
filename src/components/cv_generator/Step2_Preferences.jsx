import React from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Info } from 'lucide-react';
import StepIndicator from '@/components/ui/StepIndicator';
import { ArrowLeft } from 'lucide-react';

const CATEGORIES = ["מכירות", "שירות לקוחות", "תמיכה טכנית", "ניהול משרד"];
const JOB_TYPES = ["גמיש", "מלאה", "חלקית", "משמרות"];
const AVAILABILITIES = ["גמיש", "מיידי", "שבוע עד שבועיים", "חודש עד חודשיים"];

export default function Step2_Preferences({ data, setData, onNext, onBack }) {
    // Initialize with empty arrays/strings if undefined
    const formData = {
        categories: data?.categories || [],
        profession: data?.profession || '',
        area: data?.area || '',
        jobTypes: data?.jobTypes || [],
        availability: data?.availability || ''
    };

    const handleCategoryToggle = (cat) => {
        const newCats = formData.categories.includes(cat)
            ? formData.categories.filter(c => c !== cat)
            : [...formData.categories, cat];
        setData({ ...data, categories: newCats });
    };

    const handleJobTypeToggle = (type) => {
        const newTypes = formData.jobTypes.includes(type)
            ? formData.jobTypes.filter(t => t !== type)
            : [...formData.jobTypes, type];
        setData({ ...data, jobTypes: newTypes });
    };

    const handleAvailabilitySelect = (avail) => {
        setData({ ...data, availability: avail });
    };

    const handleChange = (key, value) => {
        setData({ ...data, [key]: value });
    };

    return (
        <div className="max-w-4xl mx-auto text-center" dir="rtl">
            {/* Mobile Header: Title + Progress Bar Outside Card */}
            <h2 className="text-3xl font-bold text-gray-900 mb-4 md:hidden">ההעדפות שלך</h2>

            <div className="md:hidden mb-8">
                <StepIndicator totalSteps={5} currentStep={2} />
            </div>

            {/* Card Wrapper */}
            <div className="bg-white rounded-3xl p-6 md:p-8 shadow-[0_2px_12px_rgba(0,0,0,0.1)] border border-gray-100 mx-3 md:mx-0">
                <h3 className="text-xl font-bold text-gray-800 mb-6 text-center">באיזה תחום?</h3>

                {/* Categories Grid */}
                <div className="grid grid-cols-4 gap-2 mb-6">
                    {CATEGORIES.map(cat => (
                        <button
                            key={cat}
                            onClick={() => handleCategoryToggle(cat)}
                            className={`py-2 px-1 rounded-full text-[11px] font-medium border transition-all truncate ${formData.categories.includes(cat)
                                    ? 'bg-blue-50 border-blue-500 text-blue-600'
                                    : 'bg-white border-blue-200 text-gray-600 hover:border-blue-400'
                                }`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>

                {/* Dropdowns */}
                <div className="space-y-4 mb-8">
                    <Input
                        placeholder="חפש מקצוע"
                        value={formData.profession}
                        onChange={(e) => handleChange('profession', e.target.value)}
                        className="w-full h-12 rounded-full text-right px-6 border-gray-200 bg-white"
                    />
                    <Input
                        placeholder="איזור או עיר"
                        value={formData.area}
                        onChange={(e) => handleChange('area', e.target.value)}
                        className="w-full h-12 rounded-full text-right px-6 border-gray-200 bg-white"
                    />
                </div>

                {/* Job Types */}
                <h4 className="text-lg font-bold text-gray-800 mb-4 text-center">סוג משרה</h4>
                <div className="grid grid-cols-4 gap-2 mb-8">
                    {JOB_TYPES.map(type => (
                        <button
                            key={type}
                            onClick={() => handleJobTypeToggle(type)}
                            className={`py-2 px-1 rounded-full text-xs font-medium border transition-all ${formData.jobTypes.includes(type)
                                    ? 'bg-blue-50 border-blue-500 text-blue-600'
                                    : 'bg-white border-blue-200 text-gray-600 hover:border-blue-400'
                                }`}
                        >
                            {type}
                        </button>
                    ))}
                </div>

                {/* Availability */}
                <h4 className="text-lg font-bold text-gray-800 mb-4 text-center">זמינות</h4>
                <div className="grid grid-cols-4 gap-2 mb-8">
                    {AVAILABILITIES.map(avail => (
                        <button
                            key={avail}
                            onClick={() => handleAvailabilitySelect(avail)}
                            className={`py-2 px-1 rounded-full text-[10px] font-medium border transition-all whitespace-normal h-10 flex items-center justify-center leading-tight ${formData.availability === avail
                                    ? 'bg-blue-50 border-blue-500 text-blue-600'
                                    : 'bg-white border-blue-200 text-gray-600 hover:border-blue-400'
                                }`}
                        >
                            {avail}
                        </button>
                    ))}
                </div>

                {/* Info Note */}
                <div className="flex items-start gap-2 text-gray-500 text-xs text-right bg-gray-50 p-3 rounded-lg mb-8">
                    <Info className="w-4 h-4 mt-0.5 shrink-0" />
                    <p>ההתאמה נעשית בהתבסס על קורות החיים, גם אם שאלון ההעדפה לא מדוייק</p>
                </div>
            </div>
        </div>
    );
}
