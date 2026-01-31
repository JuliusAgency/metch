import React from 'react';
import { Button } from "@/components/ui/button";

const CHARACTERISTICS = [
  'אחריות אישית', 'ראש גדול/יוזמה אישית', 'התמדה',
  'סדר וארגון', 'אדיבות ושירותיות', 'דייקנות והקפדה',
  'יכולת למידה מהירה', 'תקשורת בינאישית מעולה', 'גמישות'];


const CharacteristicButton = ({ characteristic, onClick, isSelected }) =>
  <Button
    variant="outline"
    onClick={() => onClick(characteristic)}
    className={`h-auto py-2 px-4 md:py-3 md:px-6 rounded-full text-sm md:text-base transition-all duration-200 
            ${isSelected ?
        'bg-blue-600 text-white border-blue-600 shadow-md hover:bg-blue-700' :
        'bg-white text-gray-700 border-gray-300 hover:border-blue-400 hover:text-blue-600'}`

    }>

    {characteristic}
  </Button>;


export default function Step5_Skills({ data, setData }) {

  const handleSelect = (characteristic) => {
    const isSelected = data.includes(characteristic);
    if (isSelected) {
      setData(data.filter((c) => c !== characteristic));
    } else if (data.length < 3) {
      setData([...data, characteristic]);
    }
  };

  return (
    <div className="max-w-3xl mx-auto text-center" dir="rtl">
      <h2 className="text-3xl font-bold text-gray-900 mb-3">כישורים ומיומנויות</h2>
      <p className="text-gray-600 mb-10">בחלק הזה תציגו את הכישורים והמיומנויות הרלוונטיים והבולטים ביותר שלכם.</p>

      <div className="bg-white/40 backdrop-blur-sm rounded-3xl p-6 md:p-8 shadow-[0_2px_12px_rgba(0,0,0,0.08)] mx-3 md:mx-0 space-y-6">
        <div>
          <h3 className="text-base md:text-lg font-bold text-gray-900">אז מה מאפיין אתכם? <span className="text-blue-600">בחרו 3 תכונות</span></h3>
          <p className="text-xs md:text-sm text-gray-500 mt-1 mb-6">*חלק זה לא יופיע בקורות החיים אלא יעזור לנו בהתאמת המשרות הרלוונטיות.</p>

          <div className="flex flex-wrap justify-center gap-2 md:gap-3">
            {CHARACTERISTICS.map((char) =>
              <CharacteristicButton
                key={char}
                characteristic={char}
                onClick={handleSelect}
                isSelected={data.includes(char)} />
            )}
          </div>
        </div>
      </div>
    </div>);

}