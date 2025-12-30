import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Job } from "@/api/entities";
import { User } from "@/api/entities";
import { JobApplication } from "@/api/entities";
import { QuestionnaireResponse } from "@/api/entities";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import QuestionnaireHeader from "@/components/questionnaire/QuestionnaireHeader";
import Question from "@/components/questionnaire/Question";
import { useRequireUserType } from "@/hooks/use-require-user-type";

export default function AnswerQuestionnaire() {
    useRequireUserType(); // Ensure user has selected a user type
    const [job, setJob] = useState(null);
    const [answers, setAnswers] = useState({});
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [user, setUser] = useState(null);
    const location = useLocation();
    const navigate = useNavigate();

    const loadData = React.useCallback(async () => {
        try {
            const userData = await User.me();
            setUser(userData);

            const params = new URLSearchParams(location.search);
            const jobId = params.get('job_id');

            if (jobId) {
                const jobResults = await Job.filter({ id: jobId });
                if (jobResults.length > 0) {
                    if (jobResults[0].screening_questions && typeof jobResults[0].screening_questions === 'string') {
                        try {
                            let jsonStr = jobResults[0].screening_questions;
                            if (jsonStr.startsWith('\\x')) {
                                const hex = jsonStr.slice(2);
                                let str = '';
                                for (let i = 0; i < hex.length; i += 2) {
                                    str += String.fromCharCode(parseInt(hex.substr(i, 2), 16));
                                }
                                jsonStr = str;
                            }
                            jobResults[0].screening_questions = JSON.parse(jsonStr);
                        } catch (e) {
                            console.warn("Failed to parse screening_questions", e);
                            jobResults[0].screening_questions = [];
                        }
                    }
                    setJob(jobResults[0]);
                }
            }
        } catch (error) {
            console.error("Error loading data:", error);
        } finally {
            setLoading(false);
        }
    }, [location.search]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const handleAnswerChange = (index, answer) => {
        setAnswers(prev => ({ ...prev, [index]: answer }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);

        try {
            const formattedResponses = job.screening_questions.map((q, index) => ({
                question: q.text,
                answer: answers[index] || 'לא נמסרה תשובה'
            }));

            await QuestionnaireResponse.create({
                job_id: job.id,
                candidate_email: user.email,
                candidate_name: user.full_name,
                responses: formattedResponses
            });

            await JobApplication.create({
                job_id: job.id,
                applicant_email: user.email,
                status: 'pending'
            });

            navigate(createPageUrl("Dashboard"));

        } catch (error) {
            console.error("Error submitting application:", error);
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

    if (!job || !job.screening_questions || job.screening_questions.length === 0) {
        return <div className="text-center py-12">לא נמצאו שאלות לשאלון זה.</div>;
    }

    return (
        <div className="p-4 md:p-6" dir="rtl">
            <div className="w-[85vw] mx-auto">
                <Card className="bg-white rounded-2xl md:rounded-[2.5rem] shadow-xl border border-gray-100 overflow-hidden">
                    <QuestionnaireHeader jobId={job.id} />
                    <CardContent className="p-4 sm:p-6 md:p-8 -mt-10 relative z-10">
                        <div className="text-center mb-10">
                            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">שאלון סינון</h1>
                            <p className="text-gray-600 mt-2">עבור המשרה: {job.title}</p>
                        </div>

                        <form onSubmit={handleSubmit} className="max-w-2xl mx-auto">
                            <div className="space-y-6 mb-8">
                                {job.screening_questions.map((question, index) => (
                                    <Question
                                        key={index}
                                        index={index}
                                        text={question.text}
                                        type={question.type}
                                        value={answers[index]}
                                        onAnswer={(val) => handleAnswerChange(index, val)}
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
                                    {submitting ? <Loader2 className="w-6 h-6 animate-spin" /> : "שלחו קורות חיים"}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    );

}
