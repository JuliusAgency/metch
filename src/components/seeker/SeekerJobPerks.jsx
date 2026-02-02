import { Check } from "lucide-react";

const SeekerJobPerks = ({ perks }) => (
    <div className="flex flex-wrap justify-center gap-x-6 gap-y-3 mb-8 max-w-2xl mx-auto" dir="rtl">
        {Array.isArray(perks) && perks.map((perk, index) => (
            <div
                key={index}
                className="flex items-center gap-2 text-gray-500 text-sm font-medium"
            >
                <div className="bg-[#4ade80] rounded-full p-0.5">
                    <Check className="w-3.5 h-3.5 text-white stroke-[3px]" />
                </div>
                <span>{perk}</span>
            </div>
        ))}
    </div>
);

export default SeekerJobPerks;