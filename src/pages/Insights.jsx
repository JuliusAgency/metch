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

  const generateAIInsights = async (stats, userProfile, cvText, cvDataRaw) => {
    // Check cache first
    const cacheKey = `metch_insights_v2_${userProfile?.id}`;
    const cachedData = localStorage.getItem(cacheKey);
    if (cachedData) {
      try {
        const parsedCache = JSON.parse(cachedData);
        // Optional: Expiry check (e.g., 7 days)
        // For now, valid implies "exists" to solve "re-fetching every time"
        console.log("Using cached insights");
        return parsedCache;
      } catch (e) {
        localStorage.removeItem(cacheKey);
      }
    }

    setAnalyzing(true);
    try {
      // Calculate derived data
      const age = userProfile?.birth_date
        ? Math.floor((new Date() - new Date(userProfile.birth_date)) / 31557600000)
        : "N/A";

      const specialization = userProfile?.specialization || "Not specified";
      const preferences = {
        locations: userProfile?.preferred_locations || [],
        availability: userProfile?.availability || [],
        job_types: userProfile?.job_types || [],
        flexibility: userProfile?.is_flexible || false
      };

      const prompt = `
      Analyze the following job seeker profile and data to provide a comprehensive career insight report.
      
      User Profile:
      - Age: ${age}
      - Specialization: ${specialization}
      - Preferences: ${JSON.stringify(preferences)}
      
      CV Content & Experience:
      "${cvText ? cvText.substring(0, 4000).replace(/"/g, "'") : 'No CV content available'}"
      
      Match History Stats:
      - Total Applications: ${stats.totalApplications}
      - Responses: ${stats.responses}
      - Profile Views: ${stats.profileViews}
      
      Act as an expert career coach. Analyze the profile deeply.
      Return a STRICT VALID JSON object in Hebrew with the following keys:
      {
        "general_summary": "Paragraph summarizing the candidate's profile, tone: professional & empowering.",
        "key_strengths": ["Strength 1 (bullet)", "Strength 2 (bullet)", "Strength 3 (bullet)"],
        "interview_strength": "A specific strength to highlight in interviews.",
        "improvements": ["Point for improvement 1", "Point for improvement 2 (e.g. detailed projects, skills)"],
        "practical_recommendation": "One actionable recommendation.",
        "resume_tips": ["Tip 1 for CV", "Tip 2 for CV"],
        "career_path_status": "A concluding encouraging sentence about their process state (e.g., 'You are on the right path...')."
      }
      
      Guidelines:
      - general_summary: ~2 sentences. Professional.
      - key_strengths: 3 bullets. Focus on concrete skills/traits.
      - interview_strength: 1 sentence explaining what to sell in interviews.
      - improvements: 2-3 bullets. Constructive.
      - practical_recommendation: 1 sentence.
      - resume_tips: 1-2 bullets.
      - career_path_status: 1 inspiring sentence.
      
      Do not format as markdown. Do not include newlines in strings. Return ONLY the JSON.
      `;

      // Use the Assistant API with the provided ID
      // If VITE_MY_INSIGHTS_EMPLOYEE_KEY is meant for this page, use it. Otherwise, use a general assistant or create one. 
      // Assuming VITE_MY_INSIGHTS_EMPLOYEE_KEY is correct for "My Insights".
      const INSIGHTS_ASSISTANT_ID = import.meta.env.VITE_MY_INSIGHTS_EMPLOYEE_KEY;

      if (!INSIGHTS_ASSISTANT_ID) {
        console.warn("VITE_MY_INSIGHTS_EMPLOYEE_KEY is missing from env");
        return null;
      }

      const response = await Core.InvokeAssistant({
        prompt,
        assistantId: INSIGHTS_ASSISTANT_ID
      });

      console.log("AI Response (Assistant):", response);

      let parsed = null;
      try {
        let cleanContent = response.content.replace(/```json/g, '').replace(/```/g, '').trim();
        const jsonMatch = cleanContent.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          cleanContent = jsonMatch[0];
        }
        parsed = JSON.parse(cleanContent);

        // Cache the result
        if (parsed && userProfile?.id) {
          localStorage.setItem(cacheKey, JSON.stringify(parsed));
        }

      } catch (e) {
        console.error("Failed to parse AI response", e);
      }

      return parsed;

    } catch (error) {
      console.error("Error generating AI insights:", error);
      return null;
    } finally {
      setAnalyzing(false);
    }
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
            // Build text from structured fields
            const parts = [];
            if (cvDataRaw.summary) parts.push(`Summary: ${cvDataRaw.summary}`);

            if (cvDataRaw.work_experience && Array.isArray(cvDataRaw.work_experience)) {
              parts.push("Work Experience:");
              cvDataRaw.work_experience.forEach(exp => {
                parts.push(`- ${exp.title} at ${exp.company} (${exp.start_date} - ${exp.is_current ? 'Present' : exp.end_date}): ${exp.description || ''}`);
              });
            }

            if (cvDataRaw.education && Array.isArray(cvDataRaw.education)) {
              parts.push("Education:");
              cvDataRaw.education.forEach(edu => {
                parts.push(`- ${edu.degree} in ${edu.field_of_study} at ${edu.institution}`);
              });
            }

            if (cvDataRaw.skills && Array.isArray(cvDataRaw.skills)) {
              parts.push(`Skills: ${cvDataRaw.skills.join(', ')}`);
            }

            cvText = parts.join("\n\n");
          }
        }

        console.log("Constructed CV Text for AI:", cvText.length > 0 ? "Yes (" + cvText.length + " chars)" : "No");

        const aiRecommendations = await generateAIInsights(statsForAI, profile, cvText, cvDataRaw);

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
            <div className="text-center flex items-center justify-center gap-3">
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">התובנות שלי</h1>
              <img src={logo} alt="Metch" className="w-6 h-6 mb-1" />
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
