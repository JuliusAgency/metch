import { Check } from "lucide-react";

const SeekerJobPerks = ({ perks }) => (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-2 px-2 max-w-lg mx-auto mb-4" dir="rtl">
        {Array.isArray(perks) && perks.map((perk, index) => {
            // Cyclical colors: green, blue, purple
            const colors = [
                { bg: '#dbfce7', text: '#166534' }, // Green
                { bg: '#dbe9fe', text: '#1e40af' }, // Blue
                { bg: '#f3e8ff', text: '#6b21a8' }  // Purple
            ];
            const color = colors[index % colors.length];

            return (
                <div
                    key={index}
                    className="flex items-center justify-center px-2 py-1.5 rounded-lg shadow-sm border border-transparent font-bold text-sm w-full truncate"
                    style={{ backgroundColor: color.bg, color: color.text }}
                >
                    {perk}
                </div>
            );
        })}
    </div>
);

export default SeekerJobPerks;