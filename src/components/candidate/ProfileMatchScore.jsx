const ProfileMatchScore = ({ matchScore }) => (
    <div className="w-full max-w-4xl pt-6">
        <div dir="ltr" className="relative w-full h-5 bg-gray-200 rounded-full overflow-hidden">
            <div
                className="absolute top-0 left-0 h-full bg-[#84CC9E] flex items-center justify-center transition-all duration-500"
                style={{ width: `${matchScore}%` }}
            >
            </div>
            {/* Text positioned absolutely to be centered relative to the whole bar or the filled part? Design shows it centered in the filled part usually, but if it's 90% it takes most of the space. Let's center it in the bar for readability or center in the filled section.
               Actually, in the provided image, the text "90% התאמה" is centered within the GREEN bar. */}
            <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-[#003566]">
                {matchScore}% התאמה
            </div>
        </div>
    </div>
);

export default ProfileMatchScore;