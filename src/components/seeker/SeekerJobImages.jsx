import { Eye, Play, ClipboardList, FileText, X } from 'lucide-react';
import { Dialog, DialogContent, DialogTrigger, DialogClose } from "@/components/ui/dialog";

const SeekerJobImages = ({ images: rawAttachments }) => {
    let attachments = rawAttachments;

    // Handle Postgres Bytea Hex format (starts with \x)
    if (typeof attachments === 'string' && attachments.startsWith('\\x')) {
        try {
            const hex = attachments.slice(2);
            let str = '';
            for (let i = 0; i < hex.length; i += 2) {
                str += String.fromCharCode(parseInt(hex.substr(i, 2), 16));
            }
            attachments = str;
        } catch (e) {
            console.warn("Failed to decode hex attachment string", e);
        }
    }

    // Safely parse if it's a string
    if (typeof attachments === 'string') {
        try {
            attachments = JSON.parse(attachments);
        } catch (e) {
            // Try double parse or fail safely
            try {
                const cleaned = JSON.parse(JSON.stringify(attachments));
                attachments = JSON.parse(cleaned);
            } catch (e2) {
                attachments = [];
            }
        }
    }

    if (!Array.isArray(attachments) || attachments.length === 0) return null;

    return (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10 mt-8">
            {attachments.map((file, index) => {
                if (!file) return null;

                const fileUrl = file.url || file;
                const finalUrl = (typeof fileUrl === 'string') ? fileUrl : '';
                const fileType = file.type || 'image/png';

                const isImage = fileType.startsWith("image/") || finalUrl.match(/\.(jpeg|jpg|gif|png|webp)$/i) != null || !fileType;

                if (isImage) {
                    return (
                        <Dialog key={index}>
                            <DialogTrigger asChild>
                                <div className="relative group aspect-video rounded-xl overflow-hidden shadow-sm border border-gray-100 bg-white cursor-pointer">
                                    <img
                                        src={finalUrl}
                                        alt={`Attachment ${index + 1}`}
                                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                                    />
                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                                        <Eye className="text-white opacity-0 group-hover:opacity-100 transition-opacity w-8 h-8 drop-shadow-md" />
                                    </div>
                                </div>
                            </DialogTrigger>
                            <DialogContent
                                hideCloseButton
                                className="max-w-[90vw] max-h-[95vh] p-0 bg-transparent border-0 shadow-none flex flex-col items-center justify-center outline-none"
                            >
                                <div className="w-full flex justify-end mb-2 px-2">
                                    <DialogClose className="p-2 bg-white hover:bg-gray-100 rounded-full text-gray-800 shadow-lg transition-all outline-none focus:ring-0 ring-offset-0">
                                        <X className="w-5 h-5" />
                                        <span className="sr-only">Close</span>
                                    </DialogClose>
                                </div>
                                <img
                                    src={finalUrl}
                                    alt={`Full size attachment ${index + 1}`}
                                    className="w-auto h-auto max-w-full max-h-[80vh] object-contain rounded-lg shadow-2xl"
                                />
                            </DialogContent>
                        </Dialog>
                    );
                }

                // Fallback for non-images
                return (
                    <a
                        key={index}
                        href={finalUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="flex flex-col items-center justify-center aspect-video bg-white border border-gray-200 rounded-xl hover:border-blue-400 hover:shadow-sm transition-all p-4 text-center group"
                    >
                        <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mb-2 group-hover:bg-blue-100 transition-colors">
                            {fileType.includes('pdf') ? <ClipboardList className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
                        </div>
                        <span className="text-xs font-medium text-gray-600 truncate w-full px-2">
                            {file.name || "מסמך מצורף"}
                        </span>
                    </a>
                );
            })}
        </div>
    );
};

export default SeekerJobImages;