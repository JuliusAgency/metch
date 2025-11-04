import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
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

export default function CandidateProfile() {
    const [candidate, setCandidate] = useState(null);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState(null);
    const [creatingConversation, setCreatingConversation] = useState(false);
    const location = useLocation();

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
        if (!user || !candidate) return;

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

            window.location.href = createPageUrl("Messages");
        } catch (error) {
            console.error("Error creating conversation:", error);
        } finally {
            setCreatingConversation(false);
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
                                email={candidate.email}
                            />
                        </motion.div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
