import { Card } from "@/components/ui/card";

const InsightsContent = ({
  totalApplications = 0,
  conversionRate = 0,
  profileViews = 0,
  aiRecommendations = null
}) => {
  return (
    <div className="space-y-8">
      {/* Performance Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6 bg-white border border-gray-100 shadow-sm rounded-2xl text-center hover:shadow-md transition-shadow">
          <h3 className="text-gray-500 font-medium text-lg mb-1">סה״כ מועמדויות</h3>
          <p className="text-4xl font-bold text-blue-600">{totalApplications}</p>
        </Card>
        <Card className="p-6 bg-white border border-gray-100 shadow-sm rounded-2xl text-center hover:shadow-md transition-shadow">
          <h3 className="text-gray-500 font-medium text-lg mb-1">יחס המרה</h3>
          <p className="text-4xl font-bold text-[#84CC9E]">{conversionRate}%</p>
        </Card>
        <Card className="p-6 bg-white border border-gray-100 shadow-sm rounded-2xl text-center hover:shadow-md transition-shadow">
          <h3 className="text-gray-500 font-medium text-lg mb-1">צפיות בפרופיל</h3>
          <p className="text-4xl font-bold text-gray-800">{profileViews}</p>
        </Card>
      </div>

      {/* AI Recommendations */}
      {aiRecommendations ? (
        <div className="space-y-6">

          {/* CV Improvements */}
          {aiRecommendations.cv_improvements?.length > 0 && (
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-lg">
              <h2 className="font-bold text-gray-900 text-xl mb-4 flex items-center gap-2">
                <span className="text-2xl p-2 bg-blue-50 rounded-full">📝</span> שיפור קורות החיים
              </h2>
              <ul className="space-y-3">
                {aiRecommendations.cv_improvements.map((item, i) => (
                  <li key={i} className="flex items-start gap-3 bg-blue-50/50 p-3 rounded-xl text-gray-700">
                    <span className="text-blue-600 font-bold mt-0.5">•</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Missing Skills */}
          {aiRecommendations.missing_skills?.length > 0 && (
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-lg">
              <h2 className="font-bold text-gray-900 text-xl mb-4 flex items-center gap-2">
                <span className="text-2xl p-2 bg-orange-50 rounded-full">⚡</span> מיומנויות שכדאי להבליט
              </h2>
              <div className="flex flex-wrap gap-2">
                {aiRecommendations.missing_skills.map((item, i) => (
                  <span key={i} className="px-4 py-2 bg-orange-50 text-orange-700 border border-orange-100 rounded-full font-medium text-sm">
                    {item}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* LinkedIn Optimization */}
            {aiRecommendations.linkedin_optimization?.length > 0 && (
              <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-lg">
                <h2 className="font-bold text-gray-900 text-xl mb-4 flex items-center gap-2">
                  <span className="text-2xl p-2 bg-sky-50 rounded-full">🔗</span> אופטימיזציה ללינקדאין
                </h2>
                <ul className="space-y-3">
                  {aiRecommendations.linkedin_optimization.map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-gray-700">
                      <span className="text-sky-600 mt-1">✔</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Interview Tips */}
            {aiRecommendations.interview_tips?.length > 0 && (
              <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-lg">
                <h2 className="font-bold text-gray-900 text-xl mb-4 flex items-center gap-2">
                  <span className="text-2xl p-2 bg-green-50 rounded-full">🎤</span> טיפים לראיון
                </h2>
                <ul className="space-y-3">
                  {aiRecommendations.interview_tips.map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-gray-700">
                      <span className="text-[#84CC9E] mt-1">💡</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

        </div>
      ) : (
        <div className="text-center py-12 bg-gray-50 rounded-2xl border border-dashed border-gray-300">
          <p className="text-gray-500">לא הצלחנו לייצר המלצות כרגע. נסה שוב מאוחר יותר.</p>
        </div>
      )}
    </div>
  );
};

export default InsightsContent;