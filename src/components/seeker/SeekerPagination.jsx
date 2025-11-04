import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

const SeekerPagination = ({ currentPage, totalPages, goToPage, pageNumbers }) => (
    <div className="flex justify-center items-center pt-4">
        <Button
            variant="ghost"
            size="icon"
            onClick={() => goToPage(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="rounded-full hover:bg-gray-100"
        >
            <ChevronRight className="w-5 h-5" />
        </Button>
        <div className="flex items-center gap-2 mx-4">
            {pageNumbers.map(number => (
                <Button
                    key={number}
                    variant="ghost"
                    onClick={() => goToPage(number)}
                    className={`rounded-full w-9 h-9 transition-colors ${
                        currentPage === number
                            ? 'bg-blue-600 text-white font-bold shadow-md'
                            : 'text-gray-600 hover:bg-gray-100'
                    }`}
                >
                    {number}
                </Button>
            ))}
        </div>
        <Button
            variant="ghost"
            size="icon"
            onClick={() => goToPage(currentPage - 1)}
            disabled={currentPage === 1}
            className="rounded-full hover:bg-gray-100"
        >
            <ChevronLeft className="w-5 h-5" />
        </Button>
    </div>
);

export default SeekerPagination;