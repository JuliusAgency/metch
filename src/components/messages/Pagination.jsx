import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

const Pagination = ({ currentPage, totalPages, goToPage, pageNumbers }) => (
    <div className="flex justify-center items-center pt-4">
        <div className="flex items-center justify-between bg-[#F7FBFF] border border-[#E1F3FF] rounded-full px-2 py-1 shadow-sm min-w-[120px]">
            <button
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage === 1}
                className={`p-1.5 transition-colors ${currentPage === 1 ? 'text-[#D1D5DB]' : 'text-[#3182CE] hover:text-[#2B6CB0]'
                    }`}
            >
                <ChevronRight className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-1 mx-2">
                {pageNumbers.map(number => (
                    <button
                        key={number}
                        onClick={() => goToPage(number)}
                        className={`flex items-center justify-center w-7 h-7 rounded-full transition-all duration-200 text-sm ${currentPage === number
                            ? 'bg-[#3182CE] text-white font-medium shadow-md'
                            : 'text-[#718096] hover:bg-[#EDF2F7] hover:text-[#4A5568]'
                            }`}
                    >
                        {number}
                    </button>
                ))}
            </div>

            <button
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage === totalPages}
                className={`p-1.5 transition-colors ${currentPage === totalPages ? 'text-[#D1D5DB]' : 'text-[#3182CE] hover:text-[#2B6CB0]'
                    }`}
            >
                <ChevronLeft className="w-4 h-4" />
            </button>
        </div>
    </div>
);

export default Pagination;