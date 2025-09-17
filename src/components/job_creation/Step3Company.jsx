import { Button } from "@/components/ui/button";

const perks = ["משרד מפנק", "רכב חברה", "איזון בית-עבודה", "אופציות", "תנאים טובים", "עבודה היברידית", "עבודה מהבית", "שכר גבוה", "בונוסים", "תקציב התפתחות"];
const successFactors = ["אחריות אישית", "ראש גדול", "תקשורת בין-אישית מעולה", "עבודת צוות", "יכולת למידה עצמית", "גמישות", "יצירתיות", "חשיבה ביקורתית", "ניהול זמן", "מוטיבציה"];

const ChipSelector = ({ title, options, selected, onToggle }) => (
  <div className="space-y-4">
    <h2 className="text-lg font-semibold text-gray-800 text-center">{title}</h2>
    <div className="flex flex-wrap justify-center gap-3">
      {options.map(option => {
        const isSelected = selected.includes(option);
        return (
          <Button
            key={option}
            type="button"
            variant={isSelected ? 'default' : 'outline'}
            onClick={() => onToggle(option)}
            className={`rounded-full px-5 py-2 h-auto transition-all duration-200 ${
              isSelected ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-300'
            }`}
          >
            {option}
          </Button>
        );
      })}
    </div>
  </div>
);

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
      const newFactors = factors.includes(factor) ? factors.filter(f => f !== factor) : [...factors, factor];
      return { ...prev, success_factors: newFactors };
    });
  };

  return (
    <div className="max-w-4xl mx-auto" dir="rtl">
      <div className="text-center mb-10">
        <h1 className="text-2xl font-bold text-gray-900">חברה מפנקת? חשוב שידעו!</h1>
        <p className="text-gray-600 mt-2">כמה פרטים על החברה - מבטיחים שזה ישתלם</p>
      </div>

      <div className="space-y-12">
        <ChipSelector 
          title="בחרו הטבות רלוונטיות"
          options={perks}
          selected={jobData.company_perks || []}
          onToggle={togglePerk}
        />
        <ChipSelector 
          title="מה צריך בשביל להצליח במשרה?"
          options={successFactors}
          selected={jobData.success_factors || []}
          onToggle={toggleSuccessFactor}
        />
      </div>
    </div>
  );
}