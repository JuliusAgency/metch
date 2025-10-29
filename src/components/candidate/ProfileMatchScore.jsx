const ProfileMatchScore = ({ matchScore }) => (
    <div className="w-full max-w-md pt-4">
        <div className="text-sm text-gray-600 mb-1.5 text-right">{matchScore}% התאמה</div>
        <div dir="ltr" className="w-full h-2.5 bg-gray-200 rounded-full overflow-hidden">
            <div className="h-full bg-green-400 transition-all duration-500" style={{ width: `${matchScore}%` }}></div>
        </div>
    </div>
);

export default ProfileMatchScore;