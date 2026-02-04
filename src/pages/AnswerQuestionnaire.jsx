import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Job } from "@/api/entities";
import { User } from "@/api/entities";
import { JobApplication } from "@/api/entities";
import { QuestionnaireResponse } from "@/api/entities";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import QuestionnaireHeader from "@/components/questionnaire/QuestionnaireHeader";
import Question from "@/components/questionnaire/Question";
import { useRequireUserType } from "@/hooks/use-require-user-type";
import { createPageUrl } from "@/utils";
import ApplicationSuccessModal from "@/components/jobs/ApplicationSuccessModal";
import InfoPopup from "@/components/ui/info-popup";
import { useToast } from "@/components/ui/use-toast";

export default function AnswerQuestionnaire() {
    useRequireUserType(); // Ensure user has selected a user type
    const [job, setJob] = useState(null);
    const [answers, setAnswers] = useState({});
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [user, setUser] = useState(null);
    const [errors, setErrors] = useState({});
    const { toast } = useToast();
    const location = useLocation();
    const navigate = useNavigate();

    const isFormComplete = job?.screening_questions?.every((q, index) =>
        answers[index] && (typeof answers[index] === 'string' ? answers[index].trim() !== '' : true)
    );

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
        // Clear error when user starts typing/answering
        if (errors[index]) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[index];
                return newErrors;
            });
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!job || !user) return;

        // Validation: Check if all questions are answered
        const newErrors = {};
        job.screening_questions.forEach((q, index) => {
            if (!answers[index] || (typeof answers[index] === 'string' && answers[index].trim() === '')) {
                newErrors[index] = true;
            }
        });

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            toast({
                title: "שאלון לא הושלם",
                description: "יש לענות על כל השאלות לפני שליחת המועמדות.",
                variant: "destructive",
            });
            return;
        }

        setSubmitting(true);

        try {
            const formattedResponses = (job.screening_questions || []).map((q, index) => ({
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
                applicant_id: user.id,
                status: 'pending',
                created_date: new Date().toISOString()
            });

            // Track application in analytics
            try {
                const { UserAnalytics } = await import("@/components/UserAnalytics");
                await UserAnalytics.trackJobApplication(user, job);
            } catch (error) {
                console.warn("Analytics error", error);
            }

            // Create notification for employer
            try {
                const { Notification } = await import("@/api/entities");
                await Notification.create({
                    type: 'application_submitted',
                    user_id: job.created_by_id || job.employer_id || null, // Ensure UUID or null
                    email: job.created_by,
                    title: 'הוגשה מועמדות חדשה (שאלון)',
                    message: `מועמד חדש הוסיף שאלון למשרת ${job.title}`,
                    is_read: false,
                    created_date: new Date().toISOString()
                });
            } catch (e) {
                console.error("Error creating notification for employer:", e);
            }

            setShowSuccessModal(true);

        } catch (error) {
            console.error("Error submitting application:", error);
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

    if (!job || !job.screening_questions || job.screening_questions.length === 0) {
        return <div className="text-center py-12">לא נמצאו שאלות לשאלון זה.</div>;
    }

    return (
        <div className="fixed inset-0 bg-white z-[50] flex flex-col overflow-hidden" dir="rtl">
            <div className="flex-1 flex flex-col h-full overflow-hidden">
                <QuestionnaireHeader jobId={job.id} />
                <div className="flex-1 overflow-y-auto px-4 sm:px-6 md:px-8 -mt-6 relative z-10 pb-10">
                    <div className="max-w-4xl mx-auto w-full">
                        <div className="text-center mb-6">
                            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 leading-tight">שאלון סינון</h1>
                            <p className="text-gray-600 mt-0.5 text-sm md:text-base opacity-80 mb-2">עבור המשרה: {job.title}</p>
                            <InfoPopup
                                triggerText="מה זה?"
                                title="מה זה?"
                                content={
                                    <>
                                        <p className="mb-2">השאלון יכול לעזור למעסיק לקבל פרטים אודותיך שלא כתובים בקורות החיים.</p>
                                        <p>יש לזכור, השאלון אינו מבחן אלא רק כלי עזר לקבלת מידע.</p>
                                    </>
                                }
                            />
                        </div>

                        <form onSubmit={handleSubmit} className="w-full">
                            <div className="bg-white rounded-2xl p-4 md:p-6 border border-gray-200 shadow-sm space-y-4 md:space-y-6 mb-6">
                                {(job.screening_questions || []).map((question, index) => (
                                    <Question
                                        key={index}
                                        index={index}
                                        text={question.text}
                                        type={question.type}
                                        value={answers[index]}
                                        onAnswer={(val) => handleAnswerChange(index, val)}
                                        error={errors[index]}
                                    />
                                ))}
                            </div>

                            <div className="flex justify-center">
                                <Button
                                    type="submit"
                                    disabled={submitting}
                                    size="lg"
                                    className={`px-12 h-14 rounded-full font-bold text-lg shadow-xl transition-all active:scale-95 ${isFormComplete
                                        ? 'bg-blue-600 hover:bg-blue-700 text-white'
                                        : 'bg-gray-200 text-gray-400 cursor-not-allowed border-gray-100'
                                        }`}
                                >
                                    {submitting ? (
                                        <div className="w-5 h-5 border-t-2 border-current rounded-full animate-spin"></div>
                                    ) : (
                                        isFormComplete ? "שלח תשובות והגש מועמדות" : "יש לענות על כל השאלות"
                                    )}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>

            <ApplicationSuccessModal
                isOpen={showSuccessModal}
                onClose={() => setShowSuccessModal(false)}
            />
        </div>
    );
}
