import { Button } from "@/components/ui/button";
import { Loader2 } from 'lucide-react';
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

const ProfileActions = ({
    handleStartConversation,
    creatingConversation,
    handleExportToEmail,
    exportingResume,
    questionnaireResponse
}) => (
    <div className="flex flex-col-reverse sm:flex-row items-center justify-center gap-6 w-full pt-2 pb-2">
        {/* Actions in RTL: First child is Right, Last child is Left */}

        {/* Right Button: Questionnaire (if exists) or Export (if Questionnaire doesn't exist) */}
        {questionnaireResponse && (
            <Link to={createPageUrl(`ViewQuestionnaire?id=${questionnaireResponse.id}`)} className="w-auto">
                <Button
                    size="lg"
                    variant="outline"
                    className="w-auto px-8 h-12 rounded-full border-gray-300 text-gray-700 hover:bg-gray-50 font-medium"
                >
                    צפה בשאלון סינון
                </Button>
            </Link>
        )}

        {/* Right/Center Button: Export */}
        <Button
            size="lg"
            variant="outline"
            className="w-auto px-10 h-12 rounded-full border-gray-300 text-gray-700 hover:bg-gray-50 font-medium"
            onClick={handleExportToEmail}
            disabled={exportingResume}
        >
            {exportingResume && <div className="w-4 h-4 border-t-2 border-current rounded-full animate-spin ml-2"></div>}
            ייצוא למייל
        </Button>

        {/* Left Button: Send Message */}
        <Button
            size="lg"
            className="w-auto px-10 h-12 rounded-full bg-[#2987cd] hover:bg-[#1f6ba8] text-white font-bold shadow-md shadow-blue-200"
            onClick={handleStartConversation}
            disabled={creatingConversation}
        >
            {creatingConversation && <div className="w-4 h-4 border-t-2 border-current rounded-full animate-spin ml-2"></div>}
            שלח הודעה למועמד
        </Button>
    </div>
);

export default ProfileActions;
