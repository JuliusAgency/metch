import { Check } from "lucide-react";

const SeekerJobPerks = ({ perks }) => (
    <div className="flex justify-center gap-2 md:gap-3 flex-wrap mb-4 px-2">
        {Array.isArray(perks) && perks.map((perk, index) => (
            <div
                key={index}
                className="flex items-center gap-2 bg-white border border-gray-100/80 rounded-full px-4 py-1.5 shadow-sm hover:shadow-md transition-shadow"
            >
                <span className="text-xs sm:text-sm font-medium text-gray-700">{perk}</span>
                <div className="bg-[#81d899] rounded-full p-0.5 flex items-center justify-center">
                    <Check className="w-3 h-3 text-white" strokeWidth={4} />
                </div>
            </div>
        ))}
    </div>
);

export default SeekerJobPerks;