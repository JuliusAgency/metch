import React, { useState, useEffect } from "react";
import { User } from "@/api/entities";
import { QuestionnaireResponse } from "@/api/entities";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import ScreeningHeader from "@/components/screening/ScreeningHeader";
import ScreeningQuestion from "@/components/screening/ScreeningQuestion";
import { useRequireUserType } from "@/hooks/use-require-user-type";

export default function ScreeningQuestionnaire() {
  useRequireUserType(); // Ensure user has selected a user type
  const [user, setUser] = useState(null);
  const [questions, setQuestions] = useState([]);
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
      const formattedResponses = questions.map((q) => ({
        question: q.text,
        answer: q.answer || (q.type === 'yes_no' ? 'לא' : 'לא נמסרה תשובה')
      }));

      await QuestionnaireResponse.create({
        job_id: "general_screening",
        candidate_email: user.email,
        candidate_name: user.full_name,
        responses: formattedResponses
      });

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
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6" dir="rtl">
      <div className="w-[85vw] mx-auto">
        <Card className="bg-white rounded-2xl md:rounded-[2.5rem] shadow-xl border border-gray-100 overflow-hidden">
          <ScreeningHeader />
          <CardContent className="p-4 sm:p-6 md:p-8 -mt-10 relative z-10">
            <form onSubmit={handleSubmit} className="max-w-2xl mx-auto">
              <div className="bg-white rounded-2xl p-6 border border-gray-200 space-y-8 mb-8">
                {questions.map((question, index) => (
                  <ScreeningQuestion
                    key={question.id}
                    question={question}
                    index={index}
                    handleAnswerChange={handleAnswerChange}
                  />
                ))}
              </div>
              <div className="flex justify-center">
                <Button
                  type="submit"
                  disabled={submitting}
                  size="lg"
                  className="px-12 h-14 rounded-full font-bold text-lg bg-blue-600 hover:bg-blue-700"
                >
                  {submitting ? <Loader2 className="w-6 h-6 animate-spin" /> : "שליחת קורות חיים"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
