import React from 'react';
import { Button } from "@/components/ui/button";
import { Check } from 'lucide-react';

const perks = ["משרד מפנק", "רכב חברה", "איזון בית-עבודה", "אופציות", "תנאים טובים", "עבודה היברידית", "עבודה מהבית", "שכר גבוה", "בונוסים", "תקציב התפתחות", "דלקן"];
const successFactors = ["אחריות אישית", "ראש גדול", "תקשורת בין-אישית מעולה", "עבודת צוות", "יכולת למידה עצמית", "גמישות", "יצירתיות", "חשיבה ביקורתית", "ניהול זמן", "מוטיבציה", "אדיבות ושירותיות", "סדר ואירגון"];

const ChipSelector = ({ title, subtitle, options, selected, onToggle, limitReached = false, showCheckmark = true }) => {
  // Split options into rows of 4
  const rows = [];
  for (let i = 0; i < options.length; i += 4) {
    rows.push(options.slice(i, i + 4));
  }

  return (
    <div className="space-y-3">
      <div className="text-center space-y-1">
        <h2 className="text-lg font-bold text-[#001a6e]">{title}</h2>
        {subtitle && <p className="text-gray-500 text-[10px] sm:text-xs">{subtitle}</p>}
      </div>
      <div className="space-y-3 max-w-4xl mx-auto px-4 dir-rtl">
        {rows.map((row, rowIndex) => (
          <div key={rowIndex} className="flex flex-wrap justify-center gap-3">
            {row.map(option => {
              const isSelected = selected.includes(option);
              return (
                <Button
                  key={option}
                  type="button"
                  variant="outline"
                  onClick={() => onToggle(option)}
                  disabled={limitReached && !isSelected}
                  className={`rounded-full py-2.5 px-3 h-auto transition-all duration-200 border text-sm font-medium relative group hover:bg-blue-50 flex items-center justify-center ${isSelected
                    ? 'border-blue-500 text-blue-600 bg-blue-50'
                    : `border-gray-200 text-gray-500 bg-white hover:border-blue-300 ${limitReached ? 'opacity-50 cursor-not-allowed' : ''}`
                    }`}
                >
                  {showCheckmark && (
                    <div className={`absolute right-1 w-4 h-4 rounded-full flex items-center justify-center transition-colors ${isSelected ? 'bg-blue-200' : 'bg-gray-100 group-hover:bg-gray-200'
                      }`}>
                      {isSelected && <Check className="w-3 h-3 text-blue-700" strokeWidth={3} />}
                    </div>
                  )}
                  <span className={showCheckmark ? "pr-5" : ""}>{option}</span>
                </Button>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
};

export default function Step3Company({ jobData, setJobData }) {
  const togglePerk = (perk) => {
    setJobData(prev => {
      const perks = prev.company_perks || [];
      const newPerks = perks.includes(perk) ? perks.filter(p => p !== perk) : [...perks, perk];
      return { ...prev, company_perks: newPerks };
    });
  };

  const toggleSuccessFactor = (factor) => {
    setJobData(prev => {
      const factors = prev.success_factors || [];
      if (factors.includes(factor)) {
        return { ...prev, success_factors: factors.filter(f => f !== factor) };
      }
      if (factors.length >= 3) {
        return prev; // limit reached, no change
      }
      const newFactors = [...factors, factor];
      return { ...prev, success_factors: newFactors };
    });
  };

  const successFactorsSelected = jobData.success_factors || [];
  const successFactorsLimitReached = successFactorsSelected.length >= 3;

  return (
    <div className="max-w-5xl mx-auto py-0" dir="rtl">
      <div className="text-center mb-4">
        <h1 className="text-2xl font-bold text-[#001a6e]">חברה מפנקת? חשוב שידעו!</h1>
        <p className="text-gray-500 mt-1 text-sm">זה הזמןן לבחור את היתרונות של המשרה שלכם</p>
      </div>

      <div className="space-y-6">
        <ChipSelector
          title="בחרו הטבות רלוונטיות"
          options={perks}
          selected={jobData.company_perks || []}
          onToggle={togglePerk}
          showCheckmark={true}
        />
        <ChipSelector
          title="מה צריך בשביל להצליח במשרה?"
          subtitle="*בחרו שלושה מאפיינים. מידע זה פנימי על מנת שנמצא את המאצ' המושלם בלי לרמות"
          options={successFactors}
          selected={successFactorsSelected}
          onToggle={toggleSuccessFactor}
          limitReached={successFactorsLimitReached}
          showCheckmark={false}
        />
      </div>
    </div>
  );
}
