import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send } from "lucide-react";

const MessageInput = ({ newMessage, setNewMessage, sendMessage, sendingMessage, selectedConversation }) => (
    <div className="border-t border-gray-200 p-6">
        {['filled', 'filled_via_metch', 'closed'].includes(selectedConversation.job_status) ? (
            <div className="text-center py-4">
                <p className="text-gray-500">לא ניתן לשלוח הודעות - המשרה לא פעילה</p>
            </div>
        ) : (
            <form onSubmit={sendMessage} className="flex flex-row-reverse gap-3 items-center">
                <Button
                    type="submit"
                    disabled={!newMessage.trim() || sendingMessage}
                    className="bg-blue-100 hover:bg-blue-200 rounded-full w-12 h-12 flex-shrink-0"
                    size="icon"
                >
                    <Send className="w-4 h-4 text-blue-600" />
                </Button>
                <Input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="הקלד כאן..."
                    className="flex-1 rounded-full h-12 pr-6 pl-6 text-right border-gray-200 focus:border-blue-400"
                    dir="rtl"
                    disabled={sendingMessage}
                />
            </form>
        )}
    </div>
);

export default MessageInput;