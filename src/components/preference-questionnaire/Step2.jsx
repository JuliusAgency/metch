import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight, Loader2 } from 'lucide-react';

const TRAITS = [
    "התמדה",
    "ראש גדול/יוזמה אישית",
    "אחריות אישית",
    "סדר וארגון",
    "אדיבות ושירותיות",
    "דייקנות והקפדה",
    "יכולת למידה מהירה",
    "תקשורת בינאישית מעולה",
    "גמישות" // Assuming this is the 9th
];

const PillButton = ({ label, isSelected, onClick, disabled, className }) => (
    <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        className={`
      px-6 py-3 rounded-full border transition-all duration-200 text-sm font-medium w-full md:w-auto
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
        <div className="flex flex-col items-center text-center space-y-10 w-full animate-in fade-in slide-in-from-bottom-4 duration-500">

            <div className="space-y-2">
                <h2 className="text-3xl font-bold text-gray-900">בחר את 3 התכונות שהכי מאפיינות אותך</h2>
                <p className="text-gray-500 text-sm">מידע זה פנימי על מנת שנמצא את המאץ' המושלם בלי לרמות</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-y-6 gap-x-4 w-fit mx-auto px-4 md:px-0">
                {TRAITS.map((trait, index) => {
                    const isSelected = selectedTraits.includes(trait);
                    const isMaxSelected = selectedTraits.length >= 3;

                    return (
                        <PillButton
                            key={trait}
                            label={trait}
                            isSelected={isSelected}
                            onClick={() => handleTraitToggle(trait)}
                            disabled={!isSelected && isMaxSelected} // Disable if not selected and max reached
                            className="w-full md:w-auto min-w-[140px]"
                        />
                    );
                })}
            </div>

            <div className="pt-8 flex flex-col md:flex-row gap-4 items-center">
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
                    {saving ? <Loader2 className="w-6 h-6 animate-spin" /> : (
                        <>
                            המשך
                            <ArrowLeft className="w-5 h-5" />
                        </>
                    )}
                </Button>
            </div>
        </div>
    );
}
