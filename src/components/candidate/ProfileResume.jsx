import { Button } from "@/components/ui/button";
import { FileText } from 'lucide-react';

const ProfileResume = ({ resume_url, full_name }) => (
    <>
        {resume_url && (
            <a
                href={resume_url}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full"
            >
                <div className="mt-6 w-full flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow">
                    <Button variant="outline">צפייה</Button>
                    <div className="flex items-center gap-3">
                        <p className="font-medium text-gray-800">{full_name}_resume.pdf</p>
                        <FileText className="w-8 h-8 text-red-500" />
                    </div>
                </div>
            </a>
        )}
    </>
);

export default ProfileResume;