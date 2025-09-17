
import { useState, useEffect } from "react";
import { User } from "@/api/entities";
import { QuestionnaireResponse } from "@/api/entities";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Loader2, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

// Default screening questions for job seekers
const DEFAULT_QUESTIONS = [
{ id: 1, text: "האם יש לך רישיון רכב?", type: "yes_no", answer: "" },
{ id: 2, text: "האם מיקום העבודה מתאים עבורך למשרה מלאה בחברה שלנו?", type: "text", answer: "" },
{ id: 3, text: "האם יש לך תואר ראשון בכלכלה?", type: "yes_no", answer: "" }];


export default function ScreeningQuestionnaire() {
  const [user, setUser] = useState(null);
  const [questions, setQuestions] = useState(DEFAULT_QUESTIONS);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const userData = await User.me();
      setUser(userData);
    } catch (error) {
      console.error("Error loading user:", error);
      // Mock user for demo
      setUser({ full_name: "דניאל כהן", email: "daniel@example.com" });
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerChange = (questionId, answer) => {
    setQuestions((prev) => prev.map((q) =>
    q.id === questionId ? { ...q, answer } : q
    ));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      // Format responses for saving
      const formattedResponses = questions.map((q) => ({
        question: q.text,
        answer: q.answer || (q.type === 'yes_no' ? 'לא' : 'לא נמסרה תשובה')
      }));

      // Save questionnaire responses
      await QuestionnaireResponse.create({
        job_id: "general_screening", // General screening questionnaire
        candidate_email: user.email,
        candidate_name: user.full_name,
        responses: formattedResponses
      });

      // Navigate back to profile or show success message
      navigate(createPageUrl("Profile"));

    } catch (error) {
      console.error("Error submitting questionnaire:", error);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen" dir="rtl">
                <Loader2 className="w-12 h-12 animate-spin text-blue-600" />
            </div>);

  }

  return (
    <div className="p-4 md:p-6" dir="rtl">
            <div className="w-[85vw] mx-auto">
                <Card className="bg-white rounded-2xl md:rounded-[2.5rem] shadow-xl border border-gray-100 overflow-hidden">
                    <div className="relative">
                        <div className="relative h-24 overflow-hidden -m-px">
                            <div
                className="absolute inset-0 w-full h-full [clip-path:ellipse(120%_100%_at_50%_100%)]"
                style={{
                  backgroundImage: 'url(https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/689c85a409a96fa6a10f1aca/d9fc7bd69_Rectangle6463.png)',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  backgroundRepeat: 'no-repeat'
                }} />

                            <Link to={createPageUrl("Profile")} className="absolute top-4 right-6 w-10 h-10 bg-white/30 rounded-full flex items-center justify-center backdrop-blur-sm hover:bg-white/50 transition-colors z-10">
                                <ChevronRight className="w-6 h-6 text-gray-800 rotate-180" />
                            </Link>
                        </div>

                        <CardContent className="p-4 sm:p-6 md:p-8 -mt-10 relative z-10">
                            <div className="text-center mb-10">
                                <h1 className="text-2xl md:text-3xl font-bold text-gray-900">שאלון סינון</h1>
                            </div>
                            
                            <form onSubmit={handleSubmit} className="max-w-2xl mx-auto">
                                <div className="bg-white rounded-2xl p-6 border border-gray-200 space-y-8 mb-8">
                                    {questions.map((question, index) =>
                  <motion.div
                    key={question.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="space-y-4">

                                            <div className="flex justify-end">
                                                <div className="bg-white border border-gray-300 rounded-full px-5 py-2 self-end text-gray-800">
                                                    {question.text}
                                                </div>
                                            </div>
                                            
                                            <div className="flex justify-start"> {/* Added for RTL alignment */}
                                                {question.type === 'text' ?
                      <Input
                        value={question.answer}
                        onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                        placeholder="תשובה"
                        className="h-12 rounded-full border-gray-300 text-right w-full max-w-sm"
                        dir="rtl" /> :


                      <div className="flex items-center gap-4">
                                                        <RadioGroup
                          value={question.answer || ''}
                          onValueChange={(value) => handleAnswerChange(question.id, value)}
                          className="flex gap-3">

                                                            <div className="flex items-center">
                                                                <RadioGroupItem value="כן" id={`q-${question.id}-yes`} className="sr-only" />
                                                                <Label
                              htmlFor={`q-${question.id}-yes`}
                              className={`cursor-pointer w-11 h-11 flex items-center justify-center rounded-full border text-sm transition-colors ${question.answer === 'כן' ? 'bg-blue-600 border-blue-600 text-white font-semibold' : 'bg-white border-gray-300 text-gray-700'}`}>
                                                                    כן
                                                                </Label>
                                                            </div>
                                                            <div className="flex items-center">
                                                                <RadioGroupItem value="לא" id={`q-${question.id}-no`} className="sr-only" />
                                                                <Label
                              htmlFor={`q-${question.id}-no`}
                              className={`cursor-pointer w-11 h-11 flex items-center justify-center rounded-full border text-sm transition-colors ${question.answer === 'לא' ? 'bg-blue-600 border-blue-600 text-white font-semibold' : 'bg-white border-gray-300 text-gray-700'}`}>
                                                                    לא
                                                                </Label>
                                                            </div>
                                                        </RadioGroup>
                                                    </div>
                      }
                                            </div>
                                        </motion.div>
                  )}
                                </div>
                                
                                <div className="flex justify-center">
                                    <Button
                    type="submit"
                    disabled={submitting}
                    size="lg"
                    className="px-12 h-14 rounded-full font-bold text-lg bg-blue-600 hover:bg-blue-700">

                                        {submitting ? <Loader2 className="w-6 h-6 animate-spin" /> : "שליחת קורות חיים"}
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </div>
                </Card>
            </div>
        </div>);

}