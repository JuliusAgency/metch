import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { QuestionnaireResponse } from "@/api/entities";
import { User } from "@/api/entities";
import { Conversation } from "@/api/entities";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { createPageUrl } from "@/utils";
import ResponseField from "@/components/questionnaire/ResponseField";
import { useRequireUserType } from "@/hooks/use-require-user-type";

export default function ViewQuestionnaire() {
    useRequireUserType(); // Ensure user has selected a user type
    const [response, setResponse] = useState(null);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState(null);
    const [actionInProgress, setActionInProgress] = useState(false);
    const location = useLocation();
    const navigate = useNavigate();

    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            try {
                const currentUser = await User.me();
                setUser(currentUser);

                const params = new URLSearchParams(location.search);
                const responseId = params.get('id');

                if (responseId) {
                    const results = await QuestionnaireResponse.filter({ id: responseId });
                    if (results.length > 0) {
                        setResponse(results[0]);
                    } else {
                        console.error("Response not found");
                    }
                }
            } catch (error) {
                console.error("Error loading data:", error);
            } finally {
                setLoading(false);
            }
        };
        
        loadData();
    }, [location.search]);

    const handleStartConversation = async () => {
        if (!user || !response) return;
        setActionInProgress(true);
        try {
            const existing = await Conversation.filter({ employer_email: user.email, candidate_email: response.candidate_email });
            if (existing.length === 0) {
                await Conversation.create({
                    employer_email: user.email,
                    candidate_email: response.candidate_email,
                    candidate_name: response.candidate_name,
                    last_message: "התחלתי שיחה חדשה.",
                    last_message_time: new Date().toISOString()
                });
            }
            navigate(createPageUrl('Messages'));
        } catch (error) {
            console.error("Error starting conversation:", error);
        } finally {
            setActionInProgress(false);
        }
    };

    if (loading) {
        return <div className="flex justify-center items-center h-screen"><Loader2 className="w-12 h-12 animate-spin text-blue-600" /></div>;
    }

    if (!response) {
        return <div className="text-center py-12">לא נמצאו תשובות לשאלון.</div>;
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
                                  backgroundPosition: 'center'
                                }}
                            />
                        </div>

                        <CardContent className="p-4 sm:p-6 md:p-8 -mt-10 relative z-10">
                            <div className="text-center mb-10">
                                <h1 className="text-2xl md:text-3xl font-bold text-gray-900">שאלון סינון</h1>
                            </div>

                            <motion.div 
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="max-w-3xl mx-auto p-8 space-y-6 bg-gray-50/70 border border-gray-200/90 rounded-2xl"
                            >
                                {response.responses.map((item, index) => (
                                    <motion.div 
                                        key={index}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.1 }}
                                        className="space-y-3"
                                    >
                                        <ResponseField label="שאלה" value={item.question} />
                                        <ResponseField label="תשובה" value={item.answer} />
                                    </motion.div>
                                ))}
                            </motion.div>

                            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-10">
                                <Button
                                    size="lg"
                                    className="w-full sm:w-auto px-10 h-12 rounded-full bg-blue-600 hover:bg-blue-700 font-bold"
                                    onClick={handleStartConversation}
                                    disabled={actionInProgress}
                                >
                                    {actionInProgress ? <Loader2 className="w-5 h-5 animate-spin" /> : "שלח הודעה למועמד"}
                                </Button>
                                <Button
                                    size="lg"
                                    variant="outline"
                                    className="w-full sm:w-auto px-10 h-12 rounded-full border-gray-300 hover:bg-gray-100 font-bold"
                                    onClick={() => navigate(-1)}
                                    disabled={actionInProgress}
                                >
                                    חזרה
                                </Button>
                            </div>
                        </CardContent>
                    </div>
                </Card>
            </div>
        </div>
    );
}
