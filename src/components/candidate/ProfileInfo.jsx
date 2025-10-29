import { Sparkles } from 'lucide-react';

const ProfileInfo = ({ looking_for_summary, bio }) => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full text-right pt-6">
        <div className="bg-gray-50/80 p-6 rounded-xl border border-gray-200/80">
            <h3 className="font-bold text-lg mb-3 flex items-center"><Sparkles className="w-5 h-5 text-yellow-500 ml-2" />מה אני חושב</h3>
            <p className="text-gray-700">{looking_for_summary || 'אין מידע זמין.'}</p>
        </div>
        <div className="bg-gray-50/80 p-6 rounded-xl border border-gray-200/80">
            <h3 className="font-bold text-lg mb-3">תמצית מועמד</h3>
            <p className="text-gray-700">{bio || 'אין מידע זמין.'}</p>
        </div>
    </div>
);

export default ProfileInfo;