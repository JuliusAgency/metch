import { Check } from "lucide-react";

const SeekerJobPerks = ({ perks, compact = false }) => (
    <div className={`flex flex-wrap justify-center mx-auto ${compact ? 'gap-x-3 gap-y-1.5 mb-2 max-w-full' : 'gap-x-6 gap-y-3 mb-8 max-w-2xl'}`} dir="rtl">
        {Array.isArray(perks) && perks.map((perk, index) => (
            <div
                key={index}
                className={`flex items-center text-gray-500 font-medium ${compact ? 'gap-1.5 text-sm' : 'gap-2 text-sm'}`}
            >
                <div className={`bg-[#4ade80] rounded-full ${compact ? 'p-0.5' : 'p-0.5'}`}>
                    <Check className="w-3.5 h-3.5 text-white stroke-[3px]" />
                </div>
                <span>{perk}</span>
            </div>
        ))}
    </div>
);

export default SeekerJobPerks;