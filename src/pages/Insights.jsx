
import { useState, useEffect, useCallback } from "react";
import { User } from "@/api/entities";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { InvokeLLM } from "@/api/integrations";
import {
  TrendingUp,
  Star,
  AlertCircle,
  CheckCircle,
  Target,
  Lightbulb,
  Users,
  BarChart3,
  ChevronLeft,
  Loader2,
  RefreshCw
} from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function Insights() {
  const [user, setUser] = useState(null);
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  const getMockInsights = useCallback(() => ({
    profile_strengths: [
      "ניסיון מגוון בתחום הטכנולוגיה",
      "כישורי ניהול וליטוף צוות מוכחים",
      "עדכני עם הטכנולוgiות החדשות"
    ],
    improvement_areas: [
      {
        area: "כישורי תקשורת",
        suggestion: "השתתפות בקורסי הצגה ותקשורת ציבורית"
      },
      {
        area: "הסמכות מקצועיות",
        suggestion: "השגת הסמכות רלוונטיות בתחום הענן והמיקרוסרביסים"
      }
    ],
    market_insights: {
      demand: "ביקוש גבוה",
      trends: ["בינה מלאכותית", "אבטחת מידע", "פיתוח ענן"],
      salary_range: "15,000-25,000 ₪"
    },
    career_opportunities: [
      "מנהל פיתוח בחברות סטארט-אפ",
      "ארכיטקט תוכנה בחברות טכנולוגיה",
      "מומחה בינה מלאכותית"
    ],
    profile_score: 78,
    next_steps: [
      "עדכון הפרופיל בלינקדאין",
      "השתתפות באירועי רשת מקצועיים",
      "פיתוח פרויקטים אישיים להדגמת כישורים"
    ]
  }), []); // getMockInsights depends on no external scope variables that change

  const generateInsights = useCallback(async (userData) => {
    setGenerating(true);
    try {
      const prompt = `
        אנא נתח את הפרופיל המקצועי הבא וספק תובנות מעמיקות:

        פרטי המועמד:
        - שם: ${userData.full_name || 'לא צוין'}
        - תחום: ${userData.experience_level || 'לא צוין'}
        - כישורים: ${userData.skills ? userData.skills.join(', ') : 'לא צויינו'}
        - ביוגרפיה: ${userData.bio || 'לא צויין'}
        - מחפש: ${userData.looking_for_summary || 'לא צוין'}
        - מיקום מועדף: ${userData.preferred_location || 'לא צוין'}

        אנא ספק תשובה מקיפה הכוללת:
        1. ניתוח חוזקות בפרופיל
        2. תחומי שיפור ספציפיים
        3. המלצות לשיפור הפרופיל
        4. תובנות על השוק בתחום שלו
        5. הזדמנויות קריירה מתאימות
        
        התשובה צריכה להיות מעשית, מעודדת ומקצועית בעברית.
      `;

      const result = await InvokeLLM({
        prompt: prompt,
        response_json_schema: {
          type: "object",
          properties: {
            profile_strengths: {
              type: "array",
              items: { type: "string" }
            },
            improvement_areas: {
              type: "array", 
              items: {
                type: "object",
                properties: {
                  area: { type: "string" },
                  suggestion: { type: "string" }
                }
              }
            },
            market_insights: {
              type: "object",
              properties: {
                demand: { type: "string" },
                trends: { type: "array", items: { type: "string" } },
                salary_range: { type: "string" }
              }
            },
            career_opportunities: {
              type: "array",
              items: { type: "string" }
            },
            profile_score: { type: "number" },
            next_steps: {
              type: "array",
              items: { type: "string" }
            }
          }
        }
      });

      setInsights(result);
    } catch (error) {
      console.error("Error generating insights:", error);
      // Fallback to mock data if API fails
      setInsights(getMockInsights());
    } finally {
      setGenerating(false);
    }
  }, [getMockInsights]); // generateInsights depends on getMockInsights

  const loadUserAndInsights = useCallback(async () => {
    setLoading(true);
    try {
      const userData = await User.me();
      setUser(userData);
      
      if (userData) {
        await generateInsights(userData);
      }
    } catch (error) {
      console.error("Error loading user data:", error);
    } finally {
      setLoading(false);
    }
  }, [generateInsights]); // loadUserAndInsights depends on generateInsights

  useEffect(() => {
    loadUserAndInsights();
  }, [loadUserAndInsights]); // useEffect depends on loadUserAndInsights

  const handleRefresh = () => {
    if (user) {
      generateInsights(user);
    }
  };

  if (loading) {
    return (
      <div className="p-4 md:p-6 flex justify-center items-center h-[50vh]" dir="rtl">
        <Loader2 className="w-12 h-12 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6" dir="rtl">
      <div className="w-[85vw] mx-auto">
        <Card className="bg-white rounded-2xl md:rounded-[2.5rem] shadow-xl border border-gray-100 overflow-hidden">
          <div className="relative">
            {/* Header */}
            <div className="relative h-24 overflow-hidden -m-px">
              <div 
                className="absolute inset-0 w-full h-full [clip-path:ellipse(120%_100%_at_50%_100%)]"
                style={{
                  backgroundImage: 'url(https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/ca93821b0_image.png)',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center top',
                  backgroundRepeat: 'no-repeat'
                }}
              />
              <Link 
                to={createPageUrl("Dashboard")} 
                className="absolute top-4 right-6 w-10 h-10 bg-white/30 rounded-full flex items-center justify-center backdrop-blur-sm hover:bg-white/50 transition-colors z-10"
              >
                <ChevronLeft className="w-6 h-6 text-gray-800 rotate-180" />
              </Link>
            </div>

            <CardContent className="p-4 sm:p-6 md:p-8 -mt-6 relative z-10">
              {/* Title and Refresh */}
              <div className="flex justify-between items-center mb-8">
                <Button 
                  onClick={handleRefresh}
                  disabled={generating}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <RefreshCw className={`w-4 h-4 ${generating ? 'animate-spin' : ''}`} />
                  עדכן תובנות
                </Button>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900">התובנות שלי</h1>
              </div>

              {generating && (
                <div className="text-center py-8">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
                  <p className="text-gray-600">מייצר תובנות מותאמות אישית...</p>
                </div>
              )}

              {insights && !generating && (
                <div className="space-y-6">
                  {/* Profile Score */}
                  <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="text-right">
                          <div className="text-3xl font-bold text-blue-600 mb-2">{insights.profile_score}/100</div>
                          <p className="text-gray-700">ציון הפרופיל שלך</p>
                          <div className="w-48 h-2 bg-gray-200 rounded-full mt-3" dir="ltr">
                            <motion.div 
                              className="h-full bg-blue-600 rounded-full"
                              initial={{ width: 0 }}
                              animate={{ width: `${insights.profile_score}%` }}
                              transition={{ duration: 1, delay: 0.5 }}
                            />
                          </div>
                        </div>
                        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                          <BarChart3 className="w-8 h-8 text-blue-600" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Strengths */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-right">
                        <Star className="w-5 h-5 text-yellow-500" />
                        החוזקות שלך
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {insights.profile_strengths.map((strength, index) => (
                          <motion.div 
                            key={index}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="flex items-center gap-3 text-right"
                          >
                            <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                            <p className="text-gray-700">{strength}</p>
                          </motion.div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Improvement Areas */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-right">
                        <Target className="w-5 h-5 text-orange-500" />
                        תחומי שיפור
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {insights.improvement_areas.map((item, index) => (
                          <motion.div 
                            key={index}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="bg-orange-50 p-4 rounded-lg border border-orange-200"
                          >
                            <h4 className="font-semibold text-orange-800 mb-2 text-right">{item.area}</h4>
                            <p className="text-orange-700 text-right">{item.suggestion}</p>
                          </motion.div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Market Insights */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-right">
                        <TrendingUp className="w-5 h-5 text-purple-500" />
                        תובנות שוק
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="text-center p-4 bg-purple-50 rounded-lg">
                          <h4 className="font-semibold text-purple-800 mb-2">ביקוש בשוק</h4>
                          <Badge className="bg-purple-100 text-purple-800">{insights.market_insights.demand}</Badge>
                        </div>
                        <div className="text-center p-4 bg-green-50 rounded-lg">
                          <h4 className="font-semibold text-green-800 mb-2">טווח שכר</h4>
                          <p className="text-green-700 font-bold">{insights.market_insights.salary_range}</p>
                        </div>
                        <div className="text-center p-4 bg-blue-50 rounded-lg">
                          <h4 className="font-semibold text-blue-800 mb-2">טרנדים חמים</h4>
                          <div className="space-y-1">
                            {insights.market_insights.trends.slice(0, 2).map((trend, index) => (
                              <Badge key={index} variant="outline" className="text-xs">{trend}</Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Career Opportunities */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-right">
                        <Lightbulb className="w-5 h-5 text-yellow-500" />
                        הזדמנויות קריירה
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {insights.career_opportunities.map((opportunity, index) => (
                          <motion.div 
                            key={index}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: index * 0.1 }}
                            className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
                          >
                            <div className="flex items-center gap-3">
                              <Users className="w-5 h-5 text-blue-500" />
                              <p className="text-gray-700 text-right">{opportunity}</p>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Next Steps */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-right">
                        <AlertCircle className="w-5 h-5 text-red-500" />
                        הצעדים הבאים
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {insights.next_steps.map((step, index) => (
                          <motion.div 
                            key={index}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
                          >
                            <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                              {index + 1}
                            </div>
                            <p className="text-gray-700 text-right flex-1">{step}</p>
                          </motion.div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Call to Action */}
                  <div className="text-center pt-6">
                    <Link to={createPageUrl("Profile")}>
                      <Button className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-full font-bold text-lg">
                        עדכן את הפרופיל שלך
                      </Button>
                    </Link>
                  </div>
                </div>
              )}
            </CardContent>
          </div>
        </Card>
      </div>
    </div>
  );
}
