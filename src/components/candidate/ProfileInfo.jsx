import { Sparkles } from 'lucide-react';

const ProfileInfo = ({ looking_for_summary, bio }) => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl text-right pt-6">
        <div className="bg-white p-6 rounded-2xl shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07)] border border-gray-100 flex flex-col items-start h-full">
            <h3 className="font-bold text-lg text-[#003566] mb-4 flex items-center gap-2">
                מה מאצ' חושב
                <Sparkles className="w-4 h-4 text-blue-500" />
            </h3>
            <div className="text-gray-600 text-sm leading-relaxed whitespace-pre-line">
                {looking_for_summary ? (
                    <ul className="list-disc list-inside space-y-2 marker:text-blue-500">
                        {/* Assuming looking_for_summary is a string, we might want to split it if it's not HTML. 
                           If it acts as a summary bullet list, treat it as such. 
                           For now, simple rendering. */}
                        {looking_for_summary.split('\n').map((line, i) => line.trim() && <li key={i}>{line}</li>)}
                    </ul>
                ) : 'אין מידע זמין.'}
            </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07)] border border-gray-100 flex flex-col items-start h-full">
            <h3 className="font-bold text-lg text-[#003566] mb-4">תמצית מועמד</h3>
            <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-line">
                {bio || 'אין מידע זמין.'}
            </p>
        </div>
    </div>
);

export default ProfileInfo;