import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CheckCheck } from "lucide-react";
import sendIcon from "../../assets/send-icon.png";

const INACTIVE_JOB_STATUSES = ['filled', 'filled_via_metch', 'closed'];

const MessageInput = ({ newMessage, setNewMessage, sendMessage, sendingMessage, selectedConversation }) => {
    const inputRef = useRef(null);
    const isConversationLocked = INACTIVE_JOB_STATUSES.includes(selectedConversation.job_status);

    useEffect(() => {
        if (!isConversationLocked && selectedConversation) {
            inputRef.current?.focus();
        }
    }, [selectedConversation?.id, isConversationLocked]);

    return (
        <div className="p-3">
            {isConversationLocked ? (
                <div className="text-center py-2">
                    <p className="text-gray-500 text-sm">לא ניתן לשלוח הודעות - המשרה לא פעילה</p>
                </div>
            ) : (
                <form onSubmit={sendMessage} className="flex flex-row-reverse gap-2 items-center">
                    <Button
                        type="submit"
                        disabled={!newMessage.trim() || sendingMessage}
                        className="bg-[#dbecf3] hover:bg-[#c6e1ed] rounded-xl w-[52px] h-[52px] flex-shrink-0 transition-all shadow-sm flex items-center justify-center"
                        size="icon"
                        aria-label="שלח הודעה"
                    >
                        <img src={sendIcon} alt="שלח" className="w-5 h-5 object-contain" />
                    </Button>
                    <Input
                        ref={inputRef}
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="הקלד כאן..."
                        className="flex-1 rounded-[3px] h-9 pr-4 pl-4 text-right border-0 focus:ring-1 focus:ring-blue-100 text-sm font-light shadow-none bg-white"
                        dir="rtl"
                        disabled={sendingMessage}
                        aria-label="תיבת כתיבת הודעה"
                    />
                </form>
            )}
        </div>
    );
};

export default MessageInput;
