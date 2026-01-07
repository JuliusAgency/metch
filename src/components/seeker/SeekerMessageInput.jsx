import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send } from "lucide-react";

const SeekerMessageInput = ({ newMessage, setNewMessage, sendMessage, sendingMessage }) => (
    <div className="border-t border-gray-200 p-6">
        <form onSubmit={sendMessage} className="flex flex-row-reverse gap-2 items-center">
            <Button
                type="submit"
                disabled={!newMessage.trim() || sendingMessage}
                className="bg-[#E6F4FF] hover:bg-blue-100 rounded-full w-10 h-10 flex-shrink-0 transition-colors"
                size="icon"
            >
                <Send className="w-4 h-4 text-blue-600" />
            </Button>
            <Input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="הקלד כאן..."
                className="flex-1 rounded-full h-10 pr-4 pl-4 text-right border-gray-200 focus:border-blue-400 text-sm font-light shadow-sm"
                dir="rtl"
                disabled={sendingMessage}
            />
        </form>
    </div>
);

export default SeekerMessageInput;