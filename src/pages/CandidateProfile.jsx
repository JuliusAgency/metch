import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { User } from "@/api/entities";
import { UserProfile } from "@/api/entities";
import { Conversation } from "@/api/entities";
import { Card, CardContent } from "@/components/ui/card";
import {
    User as UserIcon,
    Loader2
} from 'lucide-react';
import { motion } from "framer-motion";
import { createPageUrl } from "@/utils";
import { EmployerAnalytics } from "@/components/EmployerAnalytics";
import ProfileHeader from "@/components/candidate/ProfileHeader";
import ProfileBadges from "@/components/candidate/ProfileBadges";
import ProfileMatchScore from "@/components/candidate/ProfileMatchScore";
import ProfileInfo from "@/components/candidate/ProfileInfo";
import ProfileResume from "@/components/candidate/ProfileResume";
import ProfileSocials from "@/components/candidate/ProfileSocials";
import ProfileActions from "@/components/candidate/ProfileActions";
import { useRequireUserType } from "@/hooks/use-require-user-type";
import { useToast } from "@/components/ui/use-toast";
import { SendEmail } from "@/api/integrations";

const arrayBufferToBase64 = (buffer) => {
    let binary = "";
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
};

export default function CandidateProfile() {
    useRequireUserType(); // Ensure user has selected a user type
    const [candidate, setCandidate] = useState(null);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState(null);
    const [creatingConversation, setCreatingConversation] = useState(false);
    const [exportingResume, setExportingResume] = useState(false);
    const location = useLocation();
    const navigate = useNavigate();
    const { toast } = useToast();

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const id = params.get('id');
        if (id) {
            loadCandidate(id);
        } else {
            setLoading(false);
        }
        loadUser();
    }, [location.search]);

    const loadUser = async () => {
        try {
            const userData = await User.me();
            setUser(userData);
        } catch (error) {
            console.error("Error loading user:", error);
        }
    };

    const loadCandidate = async (id) => {
        setLoading(true);
        try {
            const results = await UserProfile.filter({ id });
            if (results.length > 0) {
                setCandidate(results[0]);
            } else {
                console.error(`Candidate with ID ${id} not found.`);
            }
        } catch (error) {
            console.error("Error fetching candidate data:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleStartConversation = async () => {
        if (!user || !candidate || creatingConversation) return;

        setCreatingConversation(true);
        try {
            const existingConversations = await Conversation.filter({
                employer_email: user.email,
                candidate_email: candidate.email
            });

            let conversation;
            if (existingConversations.length > 0) {
                conversation = existingConversations[0];
            } else {
                conversation = await Conversation.create({
                    employer_email: user.email,
                    candidate_email: candidate.email,
                    candidate_name: candidate.full_name,
                    job_title: "משרה כללית",
                    last_message: "",
                    last_message_time: new Date().toISOString(),
                    unread_count: 0
                });
            }

            await EmployerAnalytics.trackAction(user.email, "candidate_message_initiated", {
                candidate_email: candidate.email,
                candidate_name: candidate.full_name,
                conversation_id: conversation.id
            });

            toast({
                title: "פתחנו צ'אט עם המועמד",
                description: "מועברים להודעות עם המועמד שנבחר"
            });

            const params = new URLSearchParams({
                conversationId: conversation.id,
                candidateEmail: candidate.email
            });
            navigate(`${createPageUrl("Messages")}?${params.toString()}`);
        } catch (error) {
            console.error("Error creating conversation:", error);
            toast({
                title: "שגיאה בפתיחת שיחה",
                description: "לא הצלחנו לפתוח את הצ'אט עם המועמד. נסה שוב.",
                variant: "destructive"
            });
            await EmployerAnalytics.trackAction(user.email, "candidate_message_failed", {
                candidate_email: candidate?.email,
                candidate_name: candidate?.full_name,
                error: error?.message
            });
        } finally {
            setCreatingConversation(false);
        }
    };

    const handleExportToEmail = async () => {
        if (!user || !candidate || exportingResume) return;

        if (!candidate.resume_url) {
            toast({
                title: "לא נמצא קובץ קורות חיים",
                description: "אין קובץ מצורף למועמד זה.",
                variant: "destructive"
            });
            return;
        }

        setExportingResume(true);
        const recipient = user.cv_reception_email || user.email;
        const subject = `קורות חיים - ${candidate.full_name}`;

        try {
            await EmployerAnalytics.trackAction(user.email, "candidate_resume_export_started", {
                candidate_email: candidate.email,
                candidate_name: candidate.full_name
            });

            const response = await fetch(candidate.resume_url);
            if (!response.ok) {
                throw new Error("לא ניתן למשוך את קובץ הקורות חיים");
            }

            const arrayBuffer = await response.arrayBuffer();
            const resumeBase64 = arrayBufferToBase64(arrayBuffer);
            const guessedName = candidate.resume_url.split("/").pop() || `${candidate.full_name}-resume.pdf`;
            const filename = guessedName.toLowerCase().endsWith(".pdf") ? guessedName : `${guessedName}.pdf`;

            await SendEmail({
                to: recipient,
                from: user.email,
                subject,
                html: `
                    <p>שלום,</p>
                    <p>מצ"ב קורות החיים העדכניים של ${candidate.full_name}.</p>
                    <p>בברכה,<br/>צוות Metch</p>
                `,
                text: `מצורפים קורות החיים של ${candidate.full_name}.`,
                attachments: [
                    {
                        filename,
                        content: resumeBase64,
                        contentType: "application/pdf"
                    }
                ]
            });

            toast({
                title: "הקובץ בדרך אליך",
                description: `קורות החיים של ${candidate.full_name} נשלחו בהצלחה למייל.`,
            });

            await EmployerAnalytics.trackAction(user.email, "candidate_resume_export_success", {
                candidate_email: candidate.email,
                candidate_name: candidate.full_name
            });
        } catch (error) {
            console.error("Error exporting resume:", error);
            toast({
                title: "שגיאה בשליחת המייל",
                description: "לא הצלחנו לשלוח את קורות החיים. נסה שוב מאוחר יותר.",
                variant: "destructive"
            });
            await EmployerAnalytics.trackAction(user.email, "candidate_resume_export_failed", {
                candidate_email: candidate.email,
                candidate_name: candidate.full_name,
                error: error?.message
            });
        } finally {
            setExportingResume(false);
        }
    };

    const handleNavigateBack = () => {
        if (typeof window !== "undefined" && window.history.length > 1) {
            navigate(-1);
        } else {
            navigate(createPageUrl("JobApplications"));
        }
    };

    useEffect(() => {
        const trackCandidateView = async () => {
            if (candidate && user) {
                try {
                    await EmployerAnalytics.trackCandidateView(user.email, candidate);
                } catch (error) {
                    console.error("Error tracking candidate view:", error);
                }
            }
        };

        trackCandidateView();
    }, [candidate, user]);


    if (loading) {
        return <div className="flex justify-center items-center h-screen"><Loader2 className="w-12 h-12 animate-spin text-blue-600" /></div>;
    }

    if (!candidate) {
        return <div className="text-center py-12">Candidate not found.</div>;
    }

    const matchScore = 90;

    const availabilityText = {
        immediate: 'מיידי',
        two_weeks: 'תוך שבועיים',
        one_month: 'תוך חודש',
        negotiable: 'גמיש'
    };

    const jobTypeText = {
        full_time: 'משרה מלאה',
        part_time: 'משרה חלקית',
        contract: 'חוזה',
        freelance: 'פרילנס',
        internship: 'התמחות'
    };

    return (
        <div className="p-4 md:p-6" dir="rtl">
            <div className="max-w-4xl mx-auto">
                <Card className="bg-white rounded-2xl md:rounded-[2.5rem] shadow-xl border border-gray-100 overflow-hidden">
                    <ProfileHeader />
                    <CardContent className="p-4 sm:p-6 md:p-8 -mt-16 relative z-10">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.5 }}
                            className="flex flex-col items-center text-center space-y-4"
                        >
                            <div className="w-24 h-24 bg-blue-200 rounded-full flex items-center justify-center border-4 border-white shadow-lg">
                                <UserIcon className="w-12 h-12 text-blue-600" />
                            </div>
                            <h1 className="text-3xl md:text-4xl font-bold text-gray-900">{candidate.full_name}</h1>

                            <ProfileBadges
                                jobTypeText={jobTypeText}
                                preferred_job_types={candidate.preferred_job_types}
                                preferred_location={candidate.preferred_location}
                                availabilityText={availabilityText}
                                availability={candidate.availability}
                            />

                            <ProfileMatchScore matchScore={matchScore} />

                            <ProfileInfo
                                looking_for_summary={candidate.looking_for_summary}
                                bio={candidate.bio}
                            />

                            <ProfileResume
                                resume_url={candidate.resume_url}
                                full_name={candidate.full_name}
                            />

                            <ProfileSocials
                                facebook_url={candidate.facebook_url}
                                instagram_url={candidate.instagram_url}
                                linkedin_url={candidate.linkedin_url}
                                twitter_url={candidate.twitter_url}
                            />

                            <ProfileActions
                                handleStartConversation={handleStartConversation}
                                creatingConversation={creatingConversation}
                                handleExportToEmail={handleExportToEmail}
                                exportingResume={exportingResume}
                                handleBack={handleNavigateBack}
                            />
                        </motion.div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
