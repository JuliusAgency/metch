import { Button } from "@/components/ui/button";
import { Loader2 } from 'lucide-react';
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

const ProfileActions = ({ handleStartConversation, creatingConversation, email }) => (
    <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4 pt-8 w-full sm:w-auto">
        <Button
            size="lg"
            className="w-full sm:w-auto px-6 sm:px-10 h-12 rounded-full bg-blue-600 hover:bg-blue-700 font-bold text-sm sm:text-base"
            onClick={handleStartConversation}
            disabled={creatingConversation}
        >
            {creatingConversation ? (
                <Loader2 className="w-4 h-4 animate-spin ml-2" />
            ) : null}
            שלח הודעה למועמד
        </Button>
        <a
            href={`mailto:${email}`}
            className="w-full sm:w-auto"
        >
            <Button size="lg" variant="outline" className="w-full px-6 sm:px-10 h-12 rounded-full border-gray-300 hover:bg-gray-100 font-bold text-sm sm:text-base">
                ייצוא למייל
            </Button>
        </a>
        <Link to={createPageUrl("ViewQuestionnaire?id=mock_response_1")} className="w-full sm:w-auto">
            <Button size="lg" variant="outline" className="w-full px-6 sm:px-10 h-12 rounded-full border-gray-300 hover:bg-gray-100 font-bold text-sm sm:text-base">
                צפה בשאלון סינון
            </Button>
        </Link>
    </div>
);

export default ProfileActions;