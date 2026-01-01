
import { Dialog, DialogContent } from "@/components/ui/dialog";
import popupMatchFull from '@/assets/popup-match-full.png';
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

const ApplicationSuccessModal = ({ isOpen, onClose }) => {
    const navigate = useNavigate();

    const handleGoToHomepage = () => {
        onClose();
        navigate(createPageUrl("Dashboard"));
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="w-auto h-auto max-w-none p-0 bg-transparent border-none shadow-none overflow-visible flex items-center justify-center">
                <div className="relative inline-block">
                    <img
                        src={popupMatchFull}
                        alt="Application Submitted"
                        className="w-auto h-auto max-w-[500px] max-h-[650px] object-contain pointer-events-none"
                    />
                    <button
                        onClick={handleGoToHomepage}
                        className="absolute bottom-[10%] left-1/2 -translate-x-1/2 w-[80%] h-[12%] bg-transparent cursor-pointer outline-none mobile-tap-highlight-transparent z-50 rounded-full"
                        aria-label="לעמוד הראשי"
                    />
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default ApplicationSuccessModal;
