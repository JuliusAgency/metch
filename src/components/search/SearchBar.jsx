import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

const SearchBar = ({ searchTerm, setSearchTerm, handleSearch }) => (
    <div className="text-center mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">חיפוש משרות</h1>

        <form onSubmit={handleSearch} className="relative max-w-2xl mx-auto">
            <Search className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
                placeholder="חפש משרות, חברות או מקצועות..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pr-12 pl-4 py-3 border-gray-300 focus:border-blue-400 rounded-full h-12 text-right text-lg"
                dir="rtl"
            />
        </form>
    </div>
);

export default SearchBar;