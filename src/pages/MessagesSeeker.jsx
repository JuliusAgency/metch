import React, { useState, useEffect, useCallback } from "react";
import { User } from "@/api/entities";
import { Conversation } from "@/api/entities";
import { Message } from "@/api/entities";
import { Job } from "@/api/entities";
import { JobApplication } from "@/api/entities";
import { UserProfile } from "@/api/entities";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Headphones, ChevronLeft, ChevronRight } from "lucide-react";
import { AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import SeekerChatHeader from "@/components/seeker/SeekerChatHeader";
import SeekerMessageItem from "@/components/seeker/SeekerMessageItem";
import SeekerMessageInput from "@/components/seeker/SeekerMessageInput";
import SeekerConversationList from "@/components/seeker/SeekerConversationList";
import SeekerPagination from "@/components/seeker/SeekerPagination";
import { useRequireUserType } from "@/hooks/use-require-user-type";
import { useLocation, useNavigate } from "react-router-dom";
import settingsHeaderBg from "@/assets/settings_header_bg.png";

const ITEMS_PER_PAGE = 5;
const SUPPORT_EMAIL = "support@metch.co.il";

// Helper function to safely format dates
const safeFormatDate = (dateValue, formatString, fallback = "") => {
    if (!dateValue) return fallback;
    try {
        const date = new Date(dateValue);
        if (isNaN(date.getTime())) return fallback;
        return format(date, formatString);
    } catch {
        return fallback;
    }
};

export default function MessagesSeeker() {
    useRequireUserType(); // Ensure user has selected a user type
    const [user, setUser] = useState(null);
    const [conversations, setConversations] = useState([]);
    const [selectedConversation, setSelectedConversation] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState("");
    const [sendingMessage, setSendingMessage] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [loadingMessages, setLoadingMessages] = useState(false);
    const location = useLocation();
    const navigate = useNavigate();

    const totalPages = Math.ceil(conversations.length / ITEMS_PER_PAGE);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const userData = await User.me();
            setUser(userData);



            let mappedConversations = [];
            let myApplications = [];

            try {
                // Pre-fetch applications for fallback title lookup
                try {
                    myApplications = await JobApplication.filter({ applicant_email: userData.email });
                } catch (e) {
                    console.error("Error fetching applications:", e);
                }

                // Load conversations for candidate - Try ID first, fallback to email
                let conversationsData = await Conversation.filter(
                    { candidate_id: userData.id },
                    "-last_message_time",
                    100
                );


                // Fetch unread messages for the current user
                let unreadConversationIds = new Set();
                try {
                    const unreadMessages = await Message.filter({
                        recipient_id: userData.id,
                        is_read: false
                    });

                    unreadMessages.forEach(msg => {
                        unreadConversationIds.add(msg.conversation_id);
                    });
                } catch (error) {
                    console.error("Error fetching unread messages:", error);
                }

                mappedConversations = await Promise.all(conversationsData.map(async (conv) => {
                    let employerName = "מעסיק לא ידוע";
                    let profileImage = "";

                    try {
                        const employerResults = await UserProfile.filter({ email: conv.employer_email });
                        if (employerResults.length > 0) {
                            employerName = employerResults[0].full_name || employerResults[0].company_name || "מעסיק לא ידוע";
                            profileImage = employerResults[0].profile_picture || "";
                        }
                    } catch (error) {
                        console.error("Error fetching employer info:", error);
                    }

                    let jobStatus = "unknown";
                    let jobTitle = conv.job_title || "";
                    let jobLocation = "";

                    try {
                        if (conv.job_id) {
                            const jobResults = await Job.filter({ id: conv.job_id });
                            if (jobResults.length > 0) {
                                jobStatus = jobResults[0].status;
                                jobTitle = jobResults[0].title || jobTitle;
                                jobLocation = jobResults[0].location || "";
                            }
                        }
                    } catch (error) {
                        console.error("Error fetching job info:", error);
                    }

                    const isSupport = conv.employer_email === SUPPORT_EMAIL;

                    // Fallback: If title missing/generic, find from applications
                    if ((!jobTitle || jobTitle === "משרה כללית") && !isSupport) {
                        try {
                            // Fetch jobs posted by this employer
                            const employerJobs = await Job.filter({ created_by: conv.employer_email });

                            // Find if I applied to any of them
                            const matchedJob = employerJobs.find(job =>
                                myApplications.some(app => String(app.job_id) === String(job.id))
                            );

                            if (matchedJob) {
                                jobTitle = matchedJob.title;
                                jobStatus = matchedJob.status || jobStatus;
                                jobLocation = matchedJob.location || jobLocation;
                            }
                        } catch (e) {
                            console.error("Fallback job lookup failed", e);
                        }
                    }

                    return {
                        id: conv.id,
                        employer_id: conv.employer_id,
                        employer_name: isSupport ? "צוות התמיכה" : employerName,
                        employer_email: conv.employer_email,
                        last_message_time: conv.last_message_time,
                        last_message: conv.last_message || "",
                        profileImage: profileImage,
                        job_title: isSupport ? "תמיכה טכנית" : (jobTitle || "משרה כללית"),
                        job_status: jobStatus,
                        job_location: jobLocation,
                        is_unread: unreadConversationIds.has(conv.id),
                        is_support: isSupport
                    };
                }));
            } catch (error) {
                console.error("Error loading conversations or no connection:", error);
                // Fallback or just empty
            }



            setConversations(mappedConversations);

        } catch (error) {
            console.error("Error loading data:", error);
        } finally {
            setLoading(false);
        }
    };

    const loadMessages = async (conversationId) => {
        setLoadingMessages(true);
        try {
            if (conversationId === "support") {
                setMessages([
                    {
                        id: "support_1",
                        content: "שלום! איך אנחנו יכולים לעזור לך היום?",
                        sender_email: SUPPORT_EMAIL,
                        created_date: new Date().toISOString(),
                        is_read: true
                    }
                ]);
                setLoadingMessages(false);
                return;
            }

            const messagesData = await Message.filter(
                { conversation_id: conversationId },
                "created_date",
                100
            );

            // Client-side sort to ensure chronological order (Oldest -> Newest)
            const sortedMessages = [...messagesData].sort((a, b) => {
                const tA = new Date(a.created_at || a.created_date || 0).getTime();
                const tB = new Date(b.created_at || b.created_date || 0).getTime();
                return tA - tB;
            });

            setMessages(sortedMessages);
        } catch (error) {
            console.error("Error loading messages:", error);
            setMessages([]);
        } finally {
            setLoadingMessages(false);
        }
    };

    const filteredConversations = conversations.filter(conv =>
        conv.employer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        conv.job_title.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const paginatedConversations = filteredConversations.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE
    );

    const goToPage = (pageNumber) => {
        if (pageNumber >= 1 && pageNumber <= totalPages) {
            setCurrentPage(pageNumber);
        }
    };

    const pageNumbers = Array.from({ length: totalPages }, (_, i) => i + 1);

    const sendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim()) return;

        setSendingMessage(true);
        try {
            let conversationId = selectedConversation.id;
            let recipientEmail = selectedConversation.employer_email;

            // Handle first support message - create conversation if it doesn't exist
            if (selectedConversation.id === "support") {
                const existingSupport = conversations.find(c =>
                    (c.employer_id === "support_team_id" || c.employer_email === SUPPORT_EMAIL)
                );
                if (existingSupport) {
                    conversationId = existingSupport.id;
                } else {
                    const newConv = await Conversation.create({
                        candidate_email: user.email,
                        candidate_id: user.id,
                        employer_email: SUPPORT_EMAIL,
                        job_title: "תמיכה טכנית",
                        last_message: newMessage.trim(),
                        last_message_time: new Date().toISOString()
                    });
                    conversationId = newConv.id;
                    // Refresh conversations list to include the new support chat
                    loadData();
                }
            }

            const currentDate = new Date().toISOString(); // Define currentDate here

            const createdMessage = await Message.create({
                conversation_id: conversationId,
                sender_email: user?.email,
                sender_id: user?.id,
                recipient_email: recipientEmail,
                recipient_id: selectedConversation.employer_id || null,
                content: newMessage.trim(),
                is_read: false,
                created_date: currentDate
            });

            await Conversation.update(conversationId, {
                last_message: newMessage.trim(),
                last_message_time: currentDate // Use currentDate for consistency
            });

            if (selectedConversation.id === "support") {
                // If we were in temporary support mode, switch to the real conversation
                const updatedConv = {
                    ...selectedConversation,
                    id: conversationId,
                    is_support: true
                };
                setSelectedConversation(updatedConv);
            }

            setMessages(prev => [...prev, createdMessage]);
            setNewMessage("");
        } catch (error) {
            console.error("Error sending message:", error);
        } finally {
            setSendingMessage(false);
        }
    };

    const handleConversationSelect = (conversation) => {
        setSelectedConversation(conversation);
        loadMessages(conversation.id);

        // Mark as read locally
        setConversations(prev => prev.map(c =>
            c.id === conversation.id
                ? { ...c, is_unread: false }
                : c
        ));
    };

    const startSupportConversation = useCallback(() => {
        // Check if we already have a support conversation
        const existingSupport = conversations.find(c => c.is_support || c.employer_email === SUPPORT_EMAIL);

        if (existingSupport) {
            handleConversationSelect(existingSupport);
        } else {
            const supportConversation = {
                id: "support",
                employer_name: "צוות התמיכה",
                employer_email: SUPPORT_EMAIL,
                last_message_time: new Date().toISOString(),
                last_message: "איך אנחנו יכולים לעזור?",
                profileImage: "",
                job_title: "תמיכה טכנית",
                is_support: true
            };

            setSelectedConversation(supportConversation);
            setMessages([
                {
                    id: "support_1",
                    content: "שלום! איך אנחנו יכולים לעזור לך היום?",
                    sender_email: SUPPORT_EMAIL,
                    created_date: new Date().toISOString(),
                    is_read: true
                }
            ]);
        }
    }, [conversations, handleConversationSelect]);

    const handleSupportContact = () => {
        startSupportConversation();
    };

    useEffect(() => {
        if (location.state?.supportChat) {
            startSupportConversation();
            navigate(location.pathname, { replace: true, state: null });
        }
    }, [location.state, location.pathname, navigate, startSupportConversation]);

    if (selectedConversation) {
        return (
            <div className="h-full relative flex flex-col max-w-7xl w-[75%] mx-auto" dir="rtl">
                <div className="relative h-[calc(98vh-100px)] flex flex-col w-full bg-white shadow-xl rounded-2xl overflow-hidden mt-0">
                    <SeekerChatHeader
                        setSelectedConversation={setSelectedConversation}
                        selectedConversation={selectedConversation}
                    />
                    <div className="flex-1 p-8 overflow-y-auto space-y-6 bg-gray-50/30">
                        {loadingMessages && (
                            <div className="flex justify-center items-center py-8">
                                <div className="w-8 h-8 border-t-2 border-blue-600 rounded-full animate-spin"></div>
                            </div>
                        )}
                        <AnimatePresence>
                            {!loadingMessages && messages.map((message, index) => {
                                const messageDate = new Date(message.created_date || message.created_at);
                                const previousMessage = messages[index - 1];
                                const previousDate = previousMessage ? new Date(previousMessage.created_date || previousMessage.created_at) : null;

                                const showDateSeparator = !previousDate ||
                                    messageDate.toDateString() !== previousDate.toDateString();

                                let dateSeparatorText = "";
                                if (showDateSeparator) {
                                    const today = new Date();
                                    const yesterday = new Date();
                                    yesterday.setDate(today.getDate() - 1);

                                    if (messageDate.toDateString() === today.toDateString()) {
                                        dateSeparatorText = "היום";
                                    } else if (messageDate.toDateString() === yesterday.toDateString()) {
                                        dateSeparatorText = "אתמול";
                                    } else {
                                        dateSeparatorText = safeFormatDate(messageDate, "dd.MM.yy");
                                    }
                                }

                                return (
                                    <div key={message.id}>
                                        {showDateSeparator && dateSeparatorText && (
                                            <div className="flex items-center justify-center my-6 relative">
                                                <div className="absolute inset-0 flex items-center" aria-hidden="true">
                                                    <div className="w-full border-t border-gray-200"></div>
                                                </div>
                                                <div className="relative bg-white px-4 text-xs text-gray-500 font-medium border border-gray-200 rounded-full py-1 shadow-sm">
                                                    {dateSeparatorText}
                                                </div>
                                            </div>
                                        )}
                                        <SeekerMessageItem
                                            message={message}
                                            index={index}
                                            user={user}
                                        />
                                    </div>
                                );
                            })}
                        </AnimatePresence>

                        {selectedConversation.is_support && (
                            <div className="flex justify-start">
                                <div className="bg-gray-100 px-4 py-3 rounded-2xl">
                                    <div className="flex gap-1">
                                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                                    </div>
                                    <div className="text-xs text-gray-500 mt-1 text-right">הקלד/ת...</div>
                                </div>
                            </div>
                        )}
                    </div>
                    <SeekerMessageInput
                        newMessage={newMessage}
                        setNewMessage={setNewMessage}
                        sendMessage={sendMessage}
                        sendingMessage={sendingMessage}
                    />
                </div>
            </div>
        );
    }

    return (
        <div className="h-full relative" dir="rtl">
            <div className="relative">
                <div className="relative h-24 overflow-hidden w-full">
                    <div
                        className="absolute inset-0 w-full h-full"
                        style={{
                            backgroundImage: `url(${settingsHeaderBg})`,
                            backgroundSize: '100% 100%',
                            backgroundPosition: 'center',
                            backgroundRepeat: 'no-repeat'
                        }}
                    />
                    <button
                        onClick={() => navigate(-1)}
                        className="absolute top-4 right-6 w-10 h-10 bg-white/30 rounded-full flex items-center justify-center backdrop-blur-sm hover:bg-white/50 transition-colors z-20"
                    >
                        <ChevronRight className="w-6 h-6 text-gray-800" />
                    </button>
                </div>
                <div className="p-2 sm:p-4 md:p-6 -mt-12 relative z-10 max-w-7xl w-[75%] mx-auto bg-white/80 backdrop-blur-md rounded-[2.5rem] shadow-lg border border-white/50 mb-8 mt-[-3rem]">
                    <div className="text-center pb-4">
                        <h1 className="text-2xl md:text-3xl font-bold text-[#001a6e]">הודעות</h1>
                    </div>
                    <div className="relative mb-8 w-full max-w-md mx-auto">
                        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-blue-500 w-5 h-5" />
                        <Input
                            placeholder="חיפוש בהודעות"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-12 pr-4 py-3 bg-[#F9FAFB] border-none focus:ring-1 focus:ring-blue-200 rounded-lg h-12 text-right shadow-sm placeholder:text-gray-400"
                            dir="rtl"
                        />
                    </div>

                    <div className="mb-6 w-full max-w-4xl mx-auto">
                        <Button
                            onClick={handleSupportContact}
                            className="w-full bg-blue-50 hover:bg-blue-100 text-blue-600 border border-blue-200 rounded-xl h-16 flex items-center justify-between px-6"
                            variant="outline"
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
                                    <Headphones className="w-6 h-6 text-white" />
                                </div>
                                <div className="text-right">
                                    <p className="font-bold text-blue-800">צור קשר עם התמיכה</p>
                                    <p className="text-sm text-blue-600">יש לך שאלה? אנחנו כאן לעזור</p>
                                </div>
                            </div>
                            <ChevronLeft className="w-5 h-5 text-blue-500" />
                        </Button>
                    </div>

                    {loading ? (
                        <div className="flex justify-center items-center py-12">
                            <div className="w-8 h-8 border-t-2 border-blue-600 rounded-full animate-spin"></div>
                        </div>
                    ) : paginatedConversations.length === 0 ? (
                        <div className="text-center py-12 text-gray-500">
                            <p>אין הודעות כרגע</p>
                        </div>
                    ) : (
                        <SeekerConversationList
                            conversations={paginatedConversations}
                            handleConversationSelect={handleConversationSelect}
                        />
                    )}

                    <SeekerPagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        goToPage={goToPage}
                        pageNumbers={pageNumbers}
                    />
                </div>
            </div>
        </div>
    );
}
