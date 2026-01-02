import React, { useState, useEffect } from "react";
import { User } from "@/api/entities";
import { Job } from "@/api/entities";
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
  const [job, setJob] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const loadData = async () => {
      try {
        const [userData] = await Promise.all([
          User.me().catch(e => console.error("Error loading user:", e)),
        ]);

        setUser(userData);

        const params = new URLSearchParams(location.search);
        const jobId = params.get('id');

        if (jobId) {
          const jobResults = await Job.filter({ id: jobId });
          if (jobResults.length > 0) {
            const foundJob = jobResults[0];
            setJob(foundJob);

            // Safely parse screening_questions
            let questionsData = foundJob.screening_questions;

            if (typeof questionsData === 'string') {
              try {
                // Handle Postgres Hex format if needed
                if (questionsData.startsWith('\\x')) {
                  const hex = questionsData.slice(2);
                  let str = '';
                  for (let i = 0; i < hex.length; i += 2) {
                    str += String.fromCharCode(parseInt(hex.substr(i, 2), 16));
                  }
                  questionsData = str;
                }
                questionsData = JSON.parse(questionsData);
              } catch (e) {
                console.warn("Failed to parse screening_questions", e);
                questionsData = [];
              }
            }

            // Initialize questions from the job's screening_questions
            if (Array.isArray(questionsData)) {
              const initializedQuestions = questionsData.map((q, index) => ({
                ...q,
                id: q.id || `q-${index}-${Date.now()}`, // Ensure ID exists
                answer: q.type === 'yes_no' ? '' : '' // Default answers
              }));
              setQuestions(initializedQuestions);
            }
          }
        }
      } catch (error) {
        console.error("Error loading data:", error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const handleAnswerChange = (questionId, answer) => {
    setQuestions((prev) => prev.map((q) =>
      q.id === questionId ? { ...q, answer } : q
    ));
  };

  const isOwner = user && job && (user.id === job.created_by_id || user.email === job.created_by);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isOwner) return;

    setSubmitting(true);

    try {
      const formattedResponses = questions.map((q) => ({
        question: q.text,
        type: q.type,
        answer: q.answer
      }));

      await QuestionnaireResponse.create({
        job_id: job.id, // Use actual job ID
        candidate_email: user?.email || 'anonymous',
        candidate_name: user?.full_name || 'Anonymous',
        responses: formattedResponses,
        submitted_at: new Date().toISOString()
      });

      // Navigate back to job details or success page
      // For now, let's go back to the job details page
      navigate(createPageUrl(`JobDetails?id=${job.id}`));

    } catch (error) {
      console.error("Error submitting questionnaire:", error);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen" dir="rtl">
        <div className="w-12 h-12 border-t-2 border-blue-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6" dir="rtl">
      <div className="w-[85vw] mx-auto">
        <Card className="bg-white rounded-2xl md:rounded-[2.5rem] shadow-xl border border-gray-100 overflow-hidden">
          <ScreeningHeader backUrl={job ? createPageUrl(`JobDetails?id=${job.id}`) : null} />
          <CardContent className="p-4 sm:p-6 md:p-8 -mt-10 relative z-10">
            {isOwner && (
              <div className="bg-blue-50 border border-blue-200 text-blue-800 px-4 py-3 rounded-xl mb-6 text-center max-w-2xl mx-auto">
                <p className="font-semibold">מצב תצוגה מקדימה</p>
                <p className="text-sm opacity-80">חלק זה מוצג כפי שיראה למועמדים (ללא אפשרות שליחה)</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="max-w-2xl mx-auto">
              <div className="bg-white rounded-2xl p-6 border border-gray-200 space-y-8 mb-8">
                {questions.map((question, index) => (
                  <ScreeningQuestion
                    key={question.id}
                    question={question}
                    index={index}
                    handleAnswerChange={handleAnswerChange}
                    disabled={isOwner}
                  />
                ))}
              </div>

              {!isOwner && (
                <div className="flex justify-center">
                  <Button
                    type="submit"
                    disabled={submitting}
                    size="lg"
                    className="px-12 h-14 rounded-full font-bold text-lg bg-blue-600 hover:bg-blue-700"
                  >
                    {submitting ? <div className="w-5 h-5 border-t-2 border-current rounded-full animate-spin"></div> : "שליחת קורות חיים"}
                  </Button>
                </div>
              )}
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
