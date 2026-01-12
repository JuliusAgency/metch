import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import sendIcon from "../../assets/send-icon.png";

const SeekerMessageInput = ({ newMessage, setNewMessage, sendMessage, sendingMessage }) => (
    <div className="p-3">
        <form onSubmit={sendMessage} className="flex flex-row-reverse gap-2 items-center">
            <Button
                type="submit"
                disabled={!newMessage.trim() || sendingMessage}
                className="bg-[#dbecf3] hover:bg-[#c6e1ed] rounded-xl w-[52px] h-[52px] flex-shrink-0 transition-all shadow-sm flex items-center justify-center"
                size="icon"
            >
                <img src={sendIcon} alt="שלח" className="w-5 h-5 object-contain" />
            </Button>
            <Input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="הקלד כאן..."
                className="flex-1 rounded-[3px] h-9 pr-4 pl-4 text-right border-0 focus:ring-1 focus:ring-blue-100 text-sm font-light shadow-none bg-white"
                dir="rtl"
                disabled={sendingMessage}
            />
        </form>
    </div>
);

export default SeekerMessageInput;