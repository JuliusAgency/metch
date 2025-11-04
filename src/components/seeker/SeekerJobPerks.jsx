import { Check } from "lucide-react";

const SeekerJobPerks = ({ perks }) => (
    <div className="flex justify-center gap-3 md:gap-6 flex-wrap">
        {Array.isArray(perks) && perks.map((perk, index) => (
            <div key={index} className="flex items-center gap-2 text-gray-600">
                <Check className="w-4 h-4 text-green-500"/>
                <span className="text-sm font-medium">{perk}</span>
            </div>
        ))}
    </div>
);

export default SeekerJobPerks;