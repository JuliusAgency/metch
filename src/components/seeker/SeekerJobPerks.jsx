import { Check } from "lucide-react";

const SeekerJobPerks = ({ perks }) => (
    <div className="flex flex-wrap justify-center gap-4 mb-8 max-w-2xl mx-auto" dir="rtl">
        {Array.isArray(perks) && perks.map((perk, index) => (
            <div
                key={index}
                className="bg-white text-gray-800 px-4 py-2 rounded-full text-sm font-medium border border-gray-200 flex items-center gap-2"
            >
                <Check className="w-5 h-5 text-green-500 bg-green-100 rounded-full p-0.5" />
                {perk}
            </div>
        ))}
    </div>
);

export default SeekerJobPerks;