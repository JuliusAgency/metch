import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight, Loader2 } from 'lucide-react';

const TRAITS = [
    "התמדה",
    "ראש גדול/יוזמה אישית",
    "אחריות אישית",
    "דייקנות והקפדה",
    "אדיבות ושירותיות",
    "סדר וארגון",
    "גמישות",
    "תקשורת בינאישית מעולה",
    "יכולת למידה מהירה"
];

const PillButton = ({ label, isSelected, onClick, disabled, className }) => (
    <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        className={`
      px-2 py-2 md:px-6 md:py-3 rounded-full border transition-all duration-200 text-[10px] md:text-sm font-medium w-auto whitespace-nowrap
      ${isSelected
                ? 'bg-blue-50 border-blue-500 text-blue-600 shadow-sm'
                : 'bg-white border-blue-200 text-gray-600 hover:border-blue-400 hover:bg-blue-50/50'
            }
      ${disabled && !isSelected ? 'opacity-50 cursor-not-allowed hover:bg-white hover:border-blue-200' : ''}
      ${className}
    `}
    >
        {label}
    </button>
);

export default function Step2({ preferences, setPreferences, onSave, onBack, saving }) {
    const selectedTraits = preferences.traits || [];

    const handleTraitToggle = (trait) => {
        if (selectedTraits.includes(trait)) {
            setPreferences(prev => ({
                ...prev,
                traits: prev.traits.filter(t => t !== trait)
            }));
        } else {
            if (selectedTraits.length < 3) {
                setPreferences(prev => ({
                    ...prev,
                    traits: [...(prev.traits || []), trait]
                }));
            }
        }
    };

    return (
        <div className="flex flex-col items-center text-center space-y-4 md:space-y-10 md:pt-16 w-full animate-in fade-in slide-in-from-bottom-4 duration-500">

            <div className="space-y-2 px-2">
                <h2 className="text-xl md:text-3xl font-bold text-gray-900 whitespace-nowrap">3 התכונות שהכי מאפיינות אותך</h2>
                <p className="text-gray-500 text-[10px] md:text-sm whitespace-nowrap">מידע זה פנימי על מנת שנמצא את המאץ' המושלם בלי לרמות</p>
            </div>

            <div className="flex flex-wrap justify-center gap-2 md:gap-x-4 md:gap-y-6 w-full max-w-2xl mx-auto px-1 md:px-4">
                {[...TRAITS, ...TRAITS].map((trait, index) => {
                    const isDuplicate = index >= TRAITS.length;
                    // Use a unique value for state to ensure independent selection
                    const uniqueValue = isDuplicate ? `${trait} #2` : trait;

                    const isSelected = selectedTraits.includes(uniqueValue);
                    const isMaxSelected = selectedTraits.length >= 3;
                    const uniqueKey = `${trait}-${index}`;

                    return (
                        <PillButton
                            key={uniqueKey}
                            label={trait} // Display the original name
                            isSelected={isSelected}
                            onClick={() => handleTraitToggle(uniqueValue)}
                            disabled={!isSelected && isMaxSelected} // Disable if not selected and max reached
                            className={`h-auto ${isDuplicate ? 'md:hidden' : ''}`}
                        />
                    );
                })}
            </div>

            <div className="pt-8 hidden md:flex flex-col md:flex-row gap-4 items-center">
                <Button
                    variant="outline"
                    onClick={onBack}
                    className="rounded-full px-12 py-6 text-lg font-bold flex items-center gap-2 border-gray-200 text-gray-500 hover:bg-gray-50"
                >
                    <ArrowRight className="w-5 h-5" />
                    חזור
                </Button>

                <Button
                    onClick={onSave}
                    disabled={saving || selectedTraits.length !== 3} // Enforce exactly 3? User said "Choose the 3 traits". Usually means exactly 3.
                    className="bg-[#2987cd] hover:bg-[#1f6ba8] text-white rounded-full px-12 py-6 text-lg font-bold flex items-center gap-2 shadow-lg shadow-blue-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {saving ? <div className="w-5 h-5 border-t-2 border-current rounded-full animate-spin"></div> : (
                        <>
                            הבא
                            <ArrowLeft className="w-5 h-5" />
                        </>
                    )}
                </Button>
            </div>
        </div>
    );
}
