import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import InsightsHeader from "@/components/insights/InsightsHeader";
import InsightsContent from "@/components/insights/InsightsContent";
import InsightChart from "@/components/insights/InsightChart";
import { JobApplication, CandidateView, CV } from "@/api/entities";
import { Core } from "@/api/integrations";
import { useUser } from "@/contexts/UserContext";
import { useRequireUserType } from "@/hooks/use-require-user-type";
import logo from "@/assets/Vector.svg";
import InfoPopup from "@/components/ui/info-popup";
import { generateAIInsights } from "@/services/insightsService";

export default function Insights() {
  useRequireUserType(); // Ensure user has selected a user type
  const { user, profile } = useUser();
  const [chartData1, setChartData1] = useState([]);
  const [chartData2, setChartData2] = useState([]);
  const [chartData3, setChartData3] = useState([]);
  const [insightsData, setInsightsData] = useState({
    totalApplications: 0,
    responses: 0,
    conversionRate: 0,
    avgCvOpeningTime: null,
    profileViews: 0,
    insights: [],
    aiRecommendations: null
  });
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);

  // Generate time series data for the last 7 days
  const generateTimeSeriesData = (applications, fieldFn) => {
    const days = 7;
    const today = new Date();
    const data = [];

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];

      const dayApplications = applications.filter(app => {
        if (!app.created_date) return false;
        const appDate = new Date(app.created_date).toISOString().split('T')[0];
        return appDate === dateStr;
      });

      const value = fieldFn(dayApplications);
      data.push({
        name: date.toLocaleDateString('he-IL', { day: 'numeric', month: 'short' }),
        uv: value
      });
    }

    return data;
  };



  useEffect(() => {
    const loadInsightsData = async () => {
      if (!user?.email) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        // Fetch inputs independently to prevent one failure from breaking everything
        const [allApplications, candidateViews, cvData] = await Promise.all([

          JobApplication.filter({ applicant_email: user.email }, "-created_date", 1000)
            .catch(e => { console.error("Apps fetch error", e); return []; }),

          CandidateView.filter({ candidate_name: profile?.full_name || user?.user_metadata?.full_name })
            .catch(e => { console.error("Views fetch error", e); return []; }),

          CV.filter({ user_email: user.email }, "-created_date", 1)
            .catch(e => { console.error("CV fetch error", e); return []; })
        ]);

        // Calculate metrics
        const totalApplications = allApplications.length;
        const responses = allApplications.filter(
          app => app.status && app.status !== 'pending'
        ).length;
        const conversionRate = totalApplications > 0
          ? Math.round((responses / totalApplications) * 100)
          : 0;

        const profileViews = candidateViews ? candidateViews.length : 0;

        // Calculate average CV opening time (days between application and first response)
        const applicationsWithResponses = allApplications.filter(
          app => app.status && app.status !== 'pending' && app.created_date
        );

        let avgCvOpeningTime = null;
        if (applicationsWithResponses.length > 0) {
          const totalDays = applicationsWithResponses.reduce((sum, app) => {
            const appDate = new Date(app.created_date);
            const responseDate = app.updated_at ? new Date(app.updated_at) : new Date();
            const daysDiff = Math.max(0, Math.floor((responseDate - appDate) / (1000 * 60 * 60 * 24)));
            return sum + daysDiff;
          }, 0);
          avgCvOpeningTime = (totalDays / applicationsWithResponses.length).toFixed(1);
        }

        // Basic Logic-based insights (kept for backward compatibility or simple status)
        const insights = [];
        const applicationsWithScores = allApplications.filter(app => app.match_score);
        if (applicationsWithScores.length > 0) {
          const avgMatchScore = applicationsWithScores.reduce((sum, app) => sum + (app.match_score || 0), 0) / applicationsWithScores.length;
          if (avgMatchScore < 70) {
            insights.push("במשרות שדורשות יכולת מכירה, ההישגים שלך פחות ממוקדים. כדאי להוסיף תוצאות מדידות.");
          }
        }
        if (profileViews > 0) insights.push(`צפו בפרופיל שלך ${profileViews} מעסיקים.`);

        const statsForAI = {
          totalApplications,
          responses,
          conversionRate,
          profileViews
        };

        // Construct CV Text from all possible fields
        let cvText = "";
        let cvDataRaw = null;
        if (cvData && cvData.length > 0) {
          cvDataRaw = cvData[0];
          // Try parsed content first (from upload), then detailed fields (from builder)
          if (cvDataRaw.parsed_content) {
            cvText = cvDataRaw.parsed_content;
          } else {
            // Helper to parse JSON fields safely
            const safeJsonParse = (value) => {
              if (!value) return [];
              if (Array.isArray(value)) return value;
              if (typeof value === 'string') {
                try {
                  const parsed = JSON.parse(value);
                  return Array.isArray(parsed) ? parsed : [];
                } catch (e) {
                  return [];
                }
              }
              return [];
            };

            // Build text from structured fields
            const parts = [];
            if (cvDataRaw.summary) parts.push(`Summary: ${cvDataRaw.summary}`);

            const workExp = safeJsonParse(cvDataRaw.work_experience);
            if (workExp.length > 0) {
              parts.push("Work Experience:");
              workExp.forEach(exp => {
                parts.push(`- ${exp.title} at ${exp.company} (${exp.start_date} - ${exp.is_current ? 'Present' : exp.end_date}): ${exp.description || ''}`);
              });
            }

            const education = safeJsonParse(cvDataRaw.education);
            if (education.length > 0) {
              parts.push("Education:");
              education.forEach(edu => {
                parts.push(`- ${edu.degree} in ${edu.field_of_study} at ${edu.institution}`);
              });
            }

            const skills = safeJsonParse(cvDataRaw.skills);
            if (skills.length > 0) {
              parts.push(`Skills: ${skills.join(', ')}`);
            }

            cvText = parts.join("\n\n");
          }
        }

        console.log("Constructed CV Text for AI:", cvText.length > 0 ? "Yes (" + cvText.length + " chars)" : "No");

        setAnalyzing(true);
        const aiRecommendations = await generateAIInsights(statsForAI, profile, cvText, cvDataRaw);
        setAnalyzing(false);

        setInsightsData({
          totalApplications,
          responses,
          conversionRate,
          avgCvOpeningTime,
          profileViews,
          insights,
          aiRecommendations
        });

        // Generate chart data
        // Chart 1: Applications over time
        const chart1Data = generateTimeSeriesData(allApplications, (apps) => apps.length);
        setChartData1(chart1Data);

        // Chart 2: Responses over time
        const chart2Data = generateTimeSeriesData(
          allApplications,
          (apps) => apps.filter(app => app.status && app.status !== 'pending').length
        );
        setChartData2(chart2Data);

        // Chart 3: Match scores over time
        const chart3Data = generateTimeSeriesData(
          allApplications.filter(app => app.match_score),
          (apps) => {
            if (apps.length === 0) return 0;
            const avg = apps.reduce((sum, app) => sum + (app.match_score || 0), 0) / apps.length;
            return Math.round(avg);
          }
        );
        setChartData3(chart3Data);

      } catch (error) {
        console.error("Error loading insights data:", error);
      } finally {
        setLoading(false);
      }
    };

    loadInsightsData();
  }, [user, profile]);

  // Calculate percentages for charts
  const chart1Percentage = chartData1.length > 0
    ? Math.round(chartData1.reduce((sum, d) => sum + (d.uv || 0), 0) / chartData1.length)
    : 0;

  const chart2Percentage = chartData2.reduce((sum, d) => sum + (d.uv || 0), 0);

  const chart3Percentage = chartData3.length > 0 && chartData3.some(d => d.uv > 0)
    ? Math.round(chartData3.filter(d => d.uv > 0).reduce((sum, d) => sum + (d.uv || 0), 0) / chartData3.filter(d => d.uv > 0).length)
    : 0;

  return (
    <div className="h-full relative" dir="rtl">
      <div className="relative">
        <InsightsHeader />
        <div className="p-4 sm:p-6 md:p-8 -mt-6 relative z-10 w-full max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="space-y-8"
          >
            <div className="text-center flex flex-col items-center justify-center gap-2">
              <div className="flex items-center gap-3">
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900">התובנות שלי</h1>
                <img src={logo} alt="Metch" className="w-6 h-6 mb-1" />
              </div>
              <InfoPopup
                triggerText="מה זה?"
                title="מה זה?"
                content={
                  <>
                    <p className="mb-2">בעמוד זה ריכזנו תובנות שהבינה המלאכותית של מאצ׳ הוציאה במיוחד עבורך על בסיס הקו׳׳ח שלך והמענה על שאלון העדפה.</p>
                    <p>ניתחנו את הניסיון שצברת, הכיוון שבחרת והיכולות שלך – ותרגמנו את זה לתובנות ברורות ושימושיות: מה החוזקות שלך, מה כדאי להדגיש בראיון עבודה, ואיך אפשר לחדד את קורות החיים או לעשות צעד נכון קדימה בקריירה.</p>
                  </>
                }
              />
            </div>
            {loading ? (
              <div className="text-center py-8">
                <p className="text-gray-600">טוען נתונים ומנתח המלצות...</p>
              </div>
            ) : (
              <>
                <InsightsContent
                  totalApplications={insightsData.totalApplications}
                  responses={insightsData.responses}
                  conversionRate={insightsData.conversionRate}
                  avgCvOpeningTime={insightsData.avgCvOpeningTime}
                  profileViews={insightsData.profileViews}
                  insights={insightsData.insights}
                  aiRecommendations={insightsData.aiRecommendations}
                />
              </>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
