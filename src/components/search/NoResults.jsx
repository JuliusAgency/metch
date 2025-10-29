import { Button } from "@/components/ui/button";

const NoResults = ({ searchTerm, setSearchTerm }) => (
    <>
        {searchTerm && (
            <div className="text-center py-12">
                <p className="text-gray-600 text-lg">לא נמצאו משרות התואמות לחיפוש "{searchTerm}"</p>
                <Button
                    onClick={() => setSearchTerm("")}
                    className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-full"
                >
                    נקה חיפוש
                </Button>
            </div>
        )}
    </>
);

export default NoResults;