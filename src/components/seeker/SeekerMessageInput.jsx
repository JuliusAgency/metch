import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send } from "lucide-react";

const SeekerMessageInput = ({ newMessage, setNewMessage, sendMessage, sendingMessage }) => (
    <div className="border-t border-gray-200 p-6">
        <form onSubmit={sendMessage} className="flex gap-3 items-center">
            <Button
                type="submit"
                disabled={!newMessage.trim() || sendingMessage}
                className="bg-blue-100 hover:bg-blue-200 rounded-lg w-12 h-12 flex-shrink-0"
                size="icon"
            >
                <Send className="w-4 h-4 text-blue-600" />
            </Button>
            <Input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="הקלד כאן..."
                className="flex-1 rounded-lg h-12 pr-6 pl-6 text-right border-gray-200 focus:border-blue-400"
                dir="rtl"
                disabled={sendingMessage}
            />
        </form>
    </div>
);

export default SeekerMessageInput;