import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send } from "lucide-react";

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
        <div className="border-t border-gray-200 p-6">
            {isConversationLocked ? (
                <div className="text-center py-4">
                    <p className="text-gray-500">לא ניתן לשלוח הודעות - המשרה לא פעילה</p>
                </div>
            ) : (
                <form onSubmit={sendMessage} className="flex flex-row-reverse gap-2 items-center">
                    <Button
                        type="submit"
                        disabled={!newMessage.trim() || sendingMessage}
                        className="bg-[#E6F4FF] hover:bg-blue-100 rounded-full w-10 h-10 flex-shrink-0 transition-colors"
                        size="icon"
                        aria-label="שלח הודעה"
                    >
                        <Send className="w-4 h-4 text-blue-600" />
                    </Button>
                    <Input
                        ref={inputRef}
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="הקלד כאן..."
                        className="flex-1 rounded-full h-10 pr-4 pl-4 text-right border-gray-200 focus:border-blue-400 text-sm font-light shadow-sm"
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
