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
        <div className="flex flex-col sm:flex-row gap-4 md:gap-6 justify-center mt-6 md:mt-10 mb-8">
            {!isUnavailable && !hasExistingApplication && (
                <Button
                    onClick={handleReject}
                    variant="outline"
                    className="w-full sm:w-auto px-12 py-3 rounded-full border-gray-300 bg-white text-gray-700 font-medium text-lg h-auto hover:bg-gray-50"
                >
                    לא מעוניין
                </Button>
            )}

            <Button
                onClick={handleApply}
                disabled={isDisabled}
                className={`w-full sm:w-auto px-12 py-3 rounded-full font-bold text-lg h-auto ${isDisabled
                    ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl transition-all'
                    }`}
            >
                {getButtonText()}
            </Button>
        </div>
    );
};

export default SeekerJobActions;