import React, { useState, useEffect } from "react";
import { useLocation, Link } from "react-router-dom";
import { User } from "@/api/entities";
import { UserProfile } from "@/api/entities";
import { Conversation } from "@/api/entities";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    User as UserIcon,
    Briefcase,
    MapPin,
    Clock,
    FileText,
    Facebook,
    Instagram,
    Linkedin,
    Twitter,
    ChevronRight,
    Loader2,
    Sparkles
} from 'lucide-react';
import { motion } from "framer-motion";
import { createPageUrl } from "@/utils";
import { EmployerAnalytics } from "@/components/EmployerAnalytics";

const MOCK_CANDIDATE = {
    id: 'mock_idan_cohen',
    full_name: "עידן כהן (דוגמה)",
    email: "idan.cohen@example.com",
    user_type: "job_seeker",
    bio: "אני מנהל מוצר עם ניסיון של 5 שנים בבניית מוצרים מאפס בחברות SaaS. מתמחה באסטרטגיית מוצר, ניהול מפת דרכים, ועבודה צמודה עם צוותי פיתוח ועיצוב. מחפש את האתגר הבא שלי בחברה בצמיחה.",
    looking_for_summary: "מחפש תפקיד ניהול מוצר בכיר בחברת סטארט-אפ מבטיחה, בה אוכל להוביל צוות, להשפיע על חזון המוצר ולבנות פתרונות שמשתמשים אוהבים. עדיפות לחברות בתחום ה-Fintech או AI.",
    skills: ["ניהול מוצר", "Agile", "JIRA", "Figma", "SQL", "MVP"],
    experience_level: "mid_level",
    availability: "immediate",
    preferred_location: "מרכז",
    resume_url: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
    linkedin_url: "https://linkedin.com",
    twitter_url: "https://twitter.com",
    instagram_url: "https://instagram.com",
    facebook_url: "https://facebook.com",
    preferred_job_types: ["full_time"]
};

const DEMO_CANDIDATES = {
    'demo-candidate-1': {
        ...MOCK_CANDIDATE,
        id: 'demo-candidate-1',
        full_name: "שרה לוי (דוגמה)",
        email: "sarah.levi@example.com",
        bio: "מפתחת Full Stack עם 3 שנים ניסיון בפיתוח יישומי web מורכבים. מתמחה ב-React, Node.js ו-MongoDB. אוהבת לעבוד בסביבה דינמית ולהתמודד עם אתגרים טכנולוגיים חדשים.",
        looking_for_summary: "מחפשת תפקיד פיתוח Full Stack בחברת טכנולוגיה מובילה, עם דגש על פרויקטים מאתגרים וצוות מקצועי. מעדיפה חברות בתחום ה-SaaS או E-commerce.",
        skills: ["React", "Node.js", "MongoDB", "TypeScript", "Docker"],
        experience_level: "mid_level"
    },
    'demo-candidate-2': {
        ...MOCK_CANDIDATE,
        id: 'demo-candidate-2', 
        full_name: "דניאל כהן (דוגמה)",
        email: "daniel.cohen@example.com",
        bio: "מעצב UX/UI עם 4 שנים ניסיון בעיצוב חוויות משתמש מרתקות ופונקציונליות. מתמחה בעיצוב מובייל, מערכות עיצוב ומחקר משתמשים.",
        looking_for_summary: "מחפש תפקיד עיצוב UX/UI בחברה חדשנית שמעוניינת להשקיע בחוויית משתמש מעולה. מעדיף חברות בתחום הפינטק או הבריאות הדיגיטליים.",
        skills: ["Figma", "Sketch", "User Research", "Prototyping", "Design Systems"],
        experience_level: "senior_level"
    }
};

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
            if (id === MOCK_CANDIDATE.id) {
                setCandidate(MOCK_CANDIDATE);
                return;
            }
            
            if (DEMO_CANDIDATES[id]) {
                setCandidate(DEMO_CANDIDATES[id]);
                return;
            }
            
            if (id && (id.startsWith('demo-') || id.startsWith('mock-'))) {
                setCandidate({
                    ...MOCK_CANDIDATE,
                    id: id,
                    full_name: "מועמד דוגמה",
                    email: `${id}@example.com`
                });
                return;
            }
            
            try {
                const results = await UserProfile.filter({ id });
                if (results.length > 0) {
                    setCandidate(results[0]);
                } else {
                    console.log(`Candidate with ID ${id} not found, using default mock data`);
                    setCandidate({
                        ...MOCK_CANDIDATE,
                        id: id,
                        full_name: "מועמד לא נמצא",
                        email: `${id}@example.com`,
                        bio: "פרופיל זה אינו זמין כרגע."
                    });
                }
            } catch (error) {
                console.log("Error fetching candidate data, using mock data:", error);
                setCandidate({
                    ...MOCK_CANDIDATE,
                    id: id,
                    full_name: "מועמד דוגמה",
                    email: `${id}@example.com`
                });
            }
        } catch (error) {
            console.error("Error in loadCandidate:", error);
            setCandidate({
                ...MOCK_CANDIDATE,
                id: id || 'unknown',
                full_name: "מועמד דוגמה",
                email: `${id || 'unknown'}@example.com`
            });
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
                    <div className="relative">
                        <div className="relative h-24 overflow-hidden -m-px">
                            <div
                                className="absolute inset-0 w-full h-full [clip-path:ellipse(120%_100%_at_50%_100%)]"
                                style={{
                                    backgroundImage: 'url(https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/ca93821b0_image.png)',
                                    backgroundSize: 'cover',
                                    backgroundPosition: 'center top',
                                    backgroundRepeat: 'no-repeat'
                                }}
                            ></div>
                            <Link to={createPageUrl("Dashboard")} className="absolute top-4 right-6 w-10 h-10 bg-white/30 rounded-full flex items-center justify-center backdrop-blur-sm hover:bg-white/50 transition-colors z-10">
                                <ChevronRight className="w-6 h-6 text-gray-800" />
                            </Link>
                        </div>

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

                                <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
                                    {candidate.preferred_job_types?.[0] && <Badge variant="outline" className="text-base border-gray-300"><Briefcase className="w-4 h-4 mr-2" />{jobTypeText[candidate.preferred_job_types[0]] || candidate.preferred_job_types[0]}</Badge>}
                                    {candidate.preferred_location && <Badge variant="outline" className="text-base border-gray-300"><MapPin className="w-4 h-4 mr-2" />{candidate.preferred_location}</Badge>}
                                    {candidate.availability && <Badge variant="outline" className="text-base border-gray-300"><Clock className="w-4 h-4 mr-2" />{availabilityText[candidate.availability] || candidate.availability}</Badge>}
                                </div>

                                <div className="w-full max-w-md pt-4">
                                    <div className="text-sm text-gray-600 mb-1.5 text-right">{matchScore}% התאמה</div>
                                    <div dir="ltr" className="w-full h-2.5 bg-gray-200 rounded-full overflow-hidden">
                                        <div className="h-full bg-green-400 transition-all duration-500" style={{ width: `${matchScore}%` }}></div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full text-right pt-6">
                                    <div className="bg-gray-50/80 p-6 rounded-xl border border-gray-200/80">
                                        <h3 className="font-bold text-lg mb-3 flex items-center"><Sparkles className="w-5 h-5 text-yellow-500 ml-2" />מה אני חושב</h3>
                                        <p className="text-gray-700">{candidate.looking_for_summary || 'אין מידע זמין.'}</p>
                                    </div>
                                    <div className="bg-gray-50/80 p-6 rounded-xl border border-gray-200/80">
                                        <h3 className="font-bold text-lg mb-3">תמצית מועמד</h3>
                                        <p className="text-gray-700">{candidate.bio || 'אין מידע זמין.'}</p>
                                    </div>
                                </div>

                                {candidate.resume_url && (
                                    <a
                                        href={candidate.resume_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="w-full"
                                    >
                                        <div className="mt-6 w-full flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow">
                                            <Button variant="outline">צפייה</Button>
                                            <div className="flex items-center gap-3">
                                                <p className="font-medium text-gray-800">{candidate.full_name}_resume.pdf</p>
                                                <FileText className="w-8 h-8 text-red-500" />
                                            </div>
                                        </div>
                                    </a>
                                )}

                                <div className="flex items-center gap-4 pt-6">
                                    {candidate.facebook_url && <a href={candidate.facebook_url} target="_blank" rel="noopener noreferrer" className="w-12 h-12 flex items-center justify-center bg-gray-100 rounded-full hover:bg-gray-200 transition-colors"><Facebook className="w-6 h-6 text-gray-600" /></a>}
                                    {candidate.instagram_url && <a href={candidate.instagram_url} target="_blank" rel="noopener noreferrer" className="w-12 h-12 flex items-center justify-center bg-gray-100 rounded-full hover:bg-gray-200 transition-colors"><Instagram className="w-6 h-6 text-gray-600" /></a>}
                                    {candidate.linkedin_url && <a href={candidate.linkedin_url} target="_blank" rel="noopener noreferrer" className="w-12 h-12 flex items-center justify-center bg-gray-100 rounded-full hover:bg-gray-200 transition-colors"><Linkedin className="w-6 h-6 text-gray-600" /></a>}
                                    {candidate.twitter_url && <a href={candidate.twitter_url} target="_blank" rel="noopener noreferrer" className="w-12 h-12 flex items-center justify-center bg-gray-100 rounded-full hover:bg-gray-200 transition-colors"><Twitter className="w-6 h-6 text-gray-600" /></a>}
                                </div>

                                <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4 pt-8 w-full sm:w-auto">
                                    <Button
                                        size="lg"
                                        className="w-full sm:w-auto px-6 sm:px-10 h-12 rounded-full bg-blue-600 hover:bg-blue-700 font-bold text-sm sm:text-base"
                                        onClick={handleStartConversation}
                                        disabled={creatingConversation}
                                    >
                                        {creatingConversation ? (
                                            <Loader2 className="w-4 h-4 animate-spin ml-2" />
                                        ) : null}
                                        שלח הודעה למועמד
                                    </Button>
                                    <a
                                        href={`mailto:${candidate.email}`}
                                        className="w-full sm:w-auto"
                                    >
                                        <Button size="lg" variant="outline" className="w-full px-6 sm:px-10 h-12 rounded-full border-gray-300 hover:bg-gray-100 font-bold text-sm sm:text-base">
                                            ייצוא למייל
                                        </Button>
                                    </a>
                                    <Link to={createPageUrl("ViewQuestionnaire?id=mock_response_1")} className="w-full sm:w-auto">
                                        <Button size="lg" variant="outline" className="w-full px-6 sm:px-10 h-12 rounded-full border-gray-300 hover:bg-gray-100 font-bold text-sm sm:text-base">
                                            צפה בשאלון סינון
                                        </Button>
                                    </Link>
                                </div>
                            </motion.div>
                        </CardContent>
                    </div>
                </Card>
            </div>
        </div>
    );
}