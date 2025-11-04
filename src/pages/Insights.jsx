import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import InsightsHeader from "@/components/insights/InsightsHeader";
import InsightsContent from "@/components/insights/InsightsContent";
import InsightChart from "@/components/insights/InsightChart";
import { JobApplication } from "@/api/entities";
import { useUser } from "@/contexts/UserContext";

export default function Insights() {
  const { user } = useUser();
  const [chartData1, setChartData1] = useState([]);
  const [chartData2, setChartData2] = useState([]);
  const [chartData3, setChartData3] = useState([]);
  const [insightsData, setInsightsData] = useState({
    totalApplications: 0,
    responses: 0,
    conversionRate: 0,
    avgCvOpeningTime: null,
    insights: []
  });
  const [loading, setLoading] = useState(true);

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
        
        // Fetch all applications for the current user
        const allApplications = await JobApplication.filter(
          { applicant_email: user.email },
          "-created_date",
          1000
        );

        // Calculate metrics
        const totalApplications = allApplications.length;
        const responses = allApplications.filter(
          app => app.status && app.status !== 'pending'
        ).length;
        const conversionRate = totalApplications > 0 
          ? Math.round((responses / totalApplications) * 100) 
          : 0;

        // Calculate average CV opening time (days between application and first response)
        const applicationsWithResponses = allApplications.filter(
          app => app.status && app.status !== 'pending' && app.created_date
        );
        
        let avgCvOpeningTime = null;
        if (applicationsWithResponses.length > 0) {
          // For now, we'll use a simplified calculation
          // In a real scenario, you'd track when the CV was first opened
          const totalDays = applicationsWithResponses.reduce((sum, app) => {
            const appDate = new Date(app.created_date);
            const responseDate = app.updated_at ? new Date(app.updated_at) : new Date();
            const daysDiff = Math.max(0, Math.floor((responseDate - appDate) / (1000 * 60 * 60 * 24)));
            return sum + daysDiff;
          }, 0);
          avgCvOpeningTime = (totalDays / applicationsWithResponses.length).toFixed(1);
        }

        // Generate insights
        const insights = [];
        
        // Match score insights
        const applicationsWithScores = allApplications.filter(app => app.match_score);
        if (applicationsWithScores.length > 0) {
          const avgMatchScore = applicationsWithScores.reduce((sum, app) => sum + (app.match_score || 0), 0) / applicationsWithScores.length;
          if (avgMatchScore < 70) {
            insights.push("במשרות שדורשות יכולת מכירה, ההישגים שלך פחות ממוקדים. כדאי להוסיף תוצאות מדידות (לדוגמה: \"העליתי מכירות ב-15% תוך 3 חודשים\").");
          }
        }

        // CV opening time insight
        if (avgCvOpeningTime) {
          insights.push(`קובץ קורות החיים שלך נפתח בממוצע תוך ${avgCvOpeningTime} ימים.`);
        }

        // Conversion rate insight
        if (conversionRate < 20) {
          insights.push("יחס ההמרה שלך נמוך מהממוצע. נסה להתאים את קורות החיים לכל משרה ספציפית.");
        } else if (conversionRate >= 25) {
          insights.push("זהו יחס טוב מהממוצע, שמעיד שהקורות חיים שלך מצליחים לבלוט – אבל יש עוד מקום לשיפור.");
        }

        setInsightsData({
          totalApplications,
          responses,
          conversionRate,
          avgCvOpeningTime,
          insights
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
  }, [user]);

  // Calculate percentages for charts
  // Chart 1: Show average applications per day over last 7 days
  const chart1Percentage = chartData1.length > 0
    ? Math.round(chartData1.reduce((sum, d) => sum + (d.uv || 0), 0) / chartData1.length)
    : 0;
  
  // Chart 2: Show total responses over last 7 days
  const chart2Percentage = chartData2.reduce((sum, d) => sum + (d.uv || 0), 0);
  
  // Chart 3: Show average match score over last 7 days
  const chart3Percentage = chartData3.length > 0 && chartData3.some(d => d.uv > 0)
    ? Math.round(chartData3.filter(d => d.uv > 0).reduce((sum, d) => sum + (d.uv || 0), 0) / chartData3.filter(d => d.uv > 0).length)
    : 0;

  return (
    <div className="p-4 md:p-6" dir="rtl">
      <div className="w-[85vw] mx-auto">
        <Card className="bg-white rounded-2xl md:rounded-[2.5rem] shadow-xl border border-gray-100 overflow-hidden">
          <div className="relative">
            <InsightsHeader />
            <CardContent className="p-4 sm:p-6 md:p-8 -mt-6 relative z-10">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="space-y-8"
              >
                <div className="text-center flex items-center justify-center gap-2">
                  <Sparkles className="w-6 h-6 text-yellow-500" />
                  <h1 className="text-2xl md:text-3xl font-bold text-gray-900">התובנות שלי</h1>
                  <Sparkles className="w-6 h-6 text-yellow-500" />
                </div>
                {loading ? (
                  <div className="text-center py-8">
                    <p className="text-gray-600">טוען נתונים...</p>
                  </div>
                ) : (
                  <>
                    <InsightsContent 
                      totalApplications={insightsData.totalApplications}
                      responses={insightsData.responses}
                      conversionRate={insightsData.conversionRate}
                      avgCvOpeningTime={insightsData.avgCvOpeningTime}
                      insights={insightsData.insights}
                    />
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <InsightChart 
                        data={chartData1} 
                        percentage={chart1Percentage}
                      />
                      <InsightChart 
                        data={chartData2} 
                        percentage={chart2Percentage}
                      />
                      <InsightChart 
                        data={chartData3} 
                        percentage={chart3Percentage}
                      />
                    </div>
                  </>
                )}
              </motion.div>
            </CardContent>
          </div>
        </Card>
      </div>
    </div>
  );
}
