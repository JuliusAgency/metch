
import { useState, useEffect, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Job } from "@/api/entities";
import { User } from "@/api/entities";
import { JobApplication } from "@/api/entities";
import { QuestionnaireResponse } from "@/api/entities";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function AnswerQuestionnaire() {
    const [job, setJob] = useState(null);
    const [answers, setAnswers] = useState({});
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [user, setUser] = useState(null);
    const location = useLocation();
    const navigate = useNavigate();

    const loadData = useCallback(async () => {
        try {
            const userData = await User.me();
            setUser(userData);

            const params = new URLSearchParams(location.search);
            const jobId = params.get('job_id');
            
            if (jobId) {
                const jobResults = await Job.filter({ id: jobId });
                if (jobResults.length > 0) {
                    setJob(jobResults[0]);
                } else {
                    // Mock job for development
                    setJob({
                        id: jobId,
                        title: "מנהלת קשרי לקוחות",
                        company: "Google",
                        screening_questions: [
                            { text: "מה הניסיון שלך בשירות לקוחות?", type: "text" },
                            { text: "איך אתה מתמודד עם לקוחות קשים?", type: "text" }
                        ]
                    });
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

    const handleAnswerChange = (question, answer) => {
        setAnswers(prev => ({ ...prev, [question]: answer }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        
        try {
            // Save questionnaire responses
            const formattedResponses = job.screening_questions.map(q => ({
                question: q.text,
                answer: answers[q.text] || 'לא נמסרה תשובה'
            }));

            await QuestionnaireResponse.create({
                job_id: job.id,
                candidate_email: user.email,
                candidate_name: user.full_name,
                responses: formattedResponses
            });

            // Create job application
            await JobApplication.create({
                job_id: job.id,
                applicant_email: user.email,
                status: 'pending'
            });

            // Navigate to success or dashboard
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
                    <div className="relative">
                        <div className="relative h-24 overflow-hidden -m-px">
                            <div 
                                className="absolute inset-0 w-full h-full [clip-path:ellipse(120%_100%_at_50%_100%)]"
                                style={{
                                  backgroundImage: 'url(https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/689c85a409a96fa6a10f1aca/d9fc7bd69_Rectangle6463.png)',
                                  backgroundSize: 'cover',
                                  backgroundPosition: 'center',
                                  backgroundRepeat: 'no-repeat'
                                }}
                            />
                            <Link to={createPageUrl(`JobDetailsSeeker?id=${job.id}`)} className="absolute top-4 right-6 w-10 h-10 bg-white/30 rounded-full flex items-center justify-center backdrop-blur-sm hover:bg-white/50 transition-colors z-10">
                                <ChevronRight className="w-6 h-6 text-gray-800 rotate-180" />
                            </Link>
                        </div>

                        <CardContent className="p-4 sm:p-6 md:p-8 -mt-10 relative z-10">
                            <div className="text-center mb-10">
                                <h1 className="text-2xl md:text-3xl font-bold text-gray-900">שאלון סינון</h1>
                                <p className="text-gray-600 mt-2">עבור המשרה: {job.title}</p>
                            </div>
                            
                            <form onSubmit={handleSubmit} className="max-w-2xl mx-auto">
                                <div className="space-y-6 mb-8">
                                    {job.screening_questions.map((question, index) => (
                                        <motion.div 
                                            key={index}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: index * 0.1 }}
                                            className="bg-white rounded-xl p-6 border border-gray-200"
                                        >
                                            <label className="block text-right font-semibold text-gray-900 mb-4">
                                                {question.text}
                                            </label>
                                            <Textarea
                                                value={answers[question.text] || ''}
                                                onChange={(e) => handleAnswerChange(question.text, e.target.value)}
                                                placeholder="הקלד את תשובתך כאן..."
                                                className="w-full min-h-[120px] border-gray-300 rounded-xl text-right resize-none"
                                                dir="rtl"
                                            />
                                        </motion.div>
                                    ))}
                                </div>
                                
                                <div className="flex justify-center">
                                    <Button 
                                        type="submit" 
                                        disabled={submitting}
                                        size="lg"
                                        className="px-12 h-14 rounded-full font-bold text-lg bg-blue-600 hover:bg-blue-700"
                                    >
                                        {submitting ? <Loader2 className="w-6 h-6 animate-spin" /> : "הגש מועמדות"}
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </div>
                </Card>
            </div>
        </div>
    );
}
