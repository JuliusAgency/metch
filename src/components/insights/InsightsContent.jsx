import { Card } from "@/components/ui/card";

const InsightsContent = ({
  aiRecommendations = null
}) => {
  if (!aiRecommendations) {
    return (
      <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-gray-300 shadow-sm">
        <p className="text-gray-500">טוען תובנות אישיות...</p>
      </div>
    );
  }

  // Helper to render content
  const renderSection = (title, content, isList = false) => {
    if (!content || (Array.isArray(content) && content.length === 0)) return null;

    return (
      <div className="mb-6 last:mb-0">
        <h3 className="font-bold text-gray-900 text-lg mb-2">{title}</h3>
        {isList && Array.isArray(content) ? (
          <ul className="space-y-1.5 list-disc list-inside text-gray-700 leading-relaxed text-sm md:text-base">
            {content.map((item, idx) => (
              <li key={idx} className="marker:text-gray-400">
                <span className="text-gray-700">{item}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-700 leading-relaxed text-sm md:text-base">
            {content}
          </p>
        )}
      </div>
    );
  };

  return (
    <Card className="bg-white border-0 shadow-lg rounded-3xl overflow-hidden relative">
      {/* Blue top border/decoration similar to image if needed, or just clean white */}
      <div className="p-8 md:p-10 text-right" dir="rtl">

        {renderSection("תמצית כללית", aiRecommendations.general_summary)}

        {renderSection("חוזקות מרכזיות", aiRecommendations.key_strengths, true)}

        {renderSection("נקודת חוזקה לראיון", aiRecommendations.interview_strength)}

        {renderSection("נקודות לשיפור", aiRecommendations.improvements, true)}

        {renderSection("המלצה פרקטית", aiRecommendations.practical_recommendation)}

        {renderSection("קורות חיים", aiRecommendations.resume_tips, true)}

        {/* Career Path Status - Bold Bottom Sentence */}
        {aiRecommendations.career_path_status && (
          <div className="mt-8 pt-6 border-t border-gray-100">
            <p className="text-gray-900 font-bold text-center text-lg md:text-xl">
              {aiRecommendations.career_path_status}
            </p>
          </div>
        )}
      </div>
    </Card>
  );
};

export default InsightsContent;