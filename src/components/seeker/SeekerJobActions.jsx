import { Button } from "@/components/ui/button";

const SeekerJobActions = ({ handleApply, applying, isUnavailable, hasExistingApplication, handleReject, hasScreeningQuestions }) => {
    const getButtonText = () => {
        if (hasExistingApplication) return 'מועמדות הוגשה כבר';
        if (isUnavailable) return 'משרה לא זמינה';
        if (applying) return 'שולח...';
        if (hasScreeningQuestions) return 'המשך לשאלון סינון';
        return 'הגשת מועמדות';
    };

    const isDisabled = applying || isUnavailable || hasExistingApplication;

    return (
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {!isUnavailable && !hasExistingApplication && (
                <Button
                    onClick={handleReject}
                    variant="outline"
                    className="w-full sm:w-auto px-8 py-2 rounded-full border-gray-300 text-gray-700 font-medium text-base h-auto hover:bg-gray-50"
                >
                    לא מתאים לי
                </Button>
            )}

            <Button
                onClick={handleApply}
                disabled={isDisabled}
                className={`w-full sm:w-auto px-8 py-2 rounded-full font-medium text-base h-auto ${isDisabled
                    ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                    }`}
            >
                {getButtonText()}
            </Button>
        </div>
    );
};

export default SeekerJobActions;