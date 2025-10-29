import { Button } from "@/components/ui/button";

const SeekerJobActions = ({ handleApply, applying, isUnavailable, handleReject }) => (
    <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Button
            onClick={handleApply}
            disabled={applying || isUnavailable}
            className={`w-full sm:w-auto px-12 py-3 rounded-full font-bold text-lg h-auto ${
                isUnavailable
                    ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
        >
            {isUnavailable ? 'משרה לא זמינה' : applying ? 'שולח...' : 'הגשת מועמדות'}
        </Button>

        {!isUnavailable && (
            <Button
                onClick={handleReject}
                variant="outline"
                className="w-full sm:w-auto px-12 py-3 rounded-full border-gray-300 text-gray-700 font-bold text-lg h-auto hover:bg-gray-50"
            >
                לא מעוניין
            </Button>
        )}
    </div>
);

export default SeekerJobActions;