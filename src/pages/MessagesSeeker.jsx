import React, { useState, useEffect, useCallback } from "react";
import { supabase } from "@/api/supabaseClient";
import { User } from "@/api/entities";
import { Conversation } from "@/api/entities";
import { Message, Notification } from "@/api/entities";
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
import settingsMobileBg from "@/assets/settings_mobile_bg.jpg";
import { useUser } from "@/contexts/UserContext";

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
    const { refreshUnreadCount } = useUser();
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

            // Mark all unread messages as read when page is visited
            try {
                // Mark messages as read
                await supabase
                    .from('Message')
                    .update({ is_read: 'true' })
                    .eq('recipient_email', userData.email)
                    .eq('is_read', 'false');

                console.log('[MessagesSeeker] Marked messages as read for:', userData.email);

                // Force refresh badges
                refreshUnreadCount(userData.id, userData.email);
            } catch (error) {
                console.error('Error marking messages as read:', error);
            }



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
                        is_read: 'false'
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



            // Deduplicate and group conversations by employer email
            const groupedConversations = mappedConversations.reduce((acc, current) => {
                const email = current.employer_email;
                if (!acc[email]) {
                    acc[email] = { ...current, all_ids: [current.id] };
                } else {
                    // Grouping: Keep the most recent conversation as the primary but track all IDs
                    const currentLastTime = new Date(current.last_message_time || 0).getTime();
                    const existingLastTime = new Date(acc[email].last_message_time || 0).getTime();

                    acc[email].all_ids.push(current.id);

                    if (currentLastTime > existingLastTime) {
                        const allIds = acc[email].all_ids;
                        acc[email] = { ...current, all_ids: allIds };
                    }
                }
                return acc;
            }, {});

            setConversations(Object.values(groupedConversations).sort((a, b) =>
                new Date(b.last_message_time || 0).getTime() - new Date(a.last_message_time || 0).getTime()
            ));

        } catch (error) {
            console.error("Error loading data:", error);
        } finally {
            setLoading(false);
        }
    };

    const loadMessages = useCallback(async (conversationId, allIds = []) => {
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

            // Load messages from all conversation IDs in the group
            const idsToFetch = allIds.length > 0 ? allIds : [conversationId];
            const messagesResponses = await Promise.all(idsToFetch.map(id =>
                Message.filter(
                    { conversation_id: id },
                    "created_date",
                    100
                )
            ));

            const messagesData = messagesResponses.flat();

            // Client-side sort to ensure chronological order (Oldest -> Newest) across all IDs
            const sortedMessages = [...messagesData].sort((a, b) => {
                const tA = new Date(a.created_at || a.created_date || 0).getTime();
                const tB = new Date(b.created_at || b.created_date || 0).getTime();
                return tA - tB;
            });

            setMessages(sortedMessages);

            // Mark incoming messages as read in database for all IDs
            try {
                const unreadMessagesData = sortedMessages.filter(m => m.sender_email !== user?.email && !m.is_read);
                if (unreadMessagesData.length > 0) {
                    await Promise.all([
                        ...idsToFetch.map(id =>
                            supabase
                                .from('Message')
                                .update({ is_read: true })
                                .eq('conversation_id', id)
                                .eq('recipient_email', user?.email)
                        ),
                        supabase
                            .from('Notification')
                            .update({ is_read: 'true' })
                            .eq('email', user?.email)
                            .eq('type', 'new_message')
                    ]);
                }
            } catch (readErr) {
                console.error("Error marking messages/notifications as read:", readErr);
            }
        } catch (error) {
            console.error("Error loading messages:", error);
            setMessages([]);
        } finally {
            setLoadingMessages(false);
        }
    }, [user?.email, refreshUnreadCount]);

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
                is_read: 'false',
                created_date: currentDate
            });

            await Conversation.update(conversationId, {
                last_message: newMessage.trim(),
                last_message_time: currentDate // Use currentDate for consistency
            });

            // Create notification for recipient (Employer)
            try {
                const notificationData = {
                    type: 'new_message',
                    user_id: selectedConversation.employer_id || null,
                    email: recipientEmail,
                    created_by: user.id,
                    title: 'הודעה חדשה',
                    message: `הודעה חדשה מ-${user.full_name || 'מחפש עבודה'}`,
                    is_read: 'false',
                    created_date: currentDate
                };
                console.log('[MessagesSeeker] Creating notification:', notificationData);
                const createdNotif = await Notification.create(notificationData);
                console.log('[MessagesSeeker] Notification created successfully:', createdNotif);
            } catch (e) {
                console.error("Error creating notification for employer:", e);
            }

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

    const handleConversationSelect = useCallback((conversation) => {
        setSelectedConversation(conversation);
        loadMessages(conversation.id, conversation.all_ids || []);

        // Mark as read locally
        setConversations(prev => prev.map(c =>
            c.id === conversation.id
                ? { ...c, is_unread: false }
                : c
        ));
    }, [loadMessages]);

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
            // Important: Clear the state after handling it to prevent infinite loop
            const state = { ...location.state };
            delete state.supportChat;
            navigate(location.pathname, { replace: true, state });
        }
    }, [location.state?.supportChat, location.pathname, navigate, startSupportConversation]);

    if (selectedConversation) {
        return (
            <div className="h-[98vh] relative flex flex-col w-full mx-auto pt-[4px] pb-[26px]" dir="rtl">
                {/* Fixed Background for Mobile */}
                <div
                    className="md:hidden fixed top-0 left-0 right-0 z-0 pointer-events-none"
                    style={{
                        width: '100%',
                        height: '230px',
                        backgroundImage: `url(${settingsMobileBg})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        backgroundRepeat: 'no-repeat'
                    }}
                />

                {/* Background "Back Card" with Arch - Desktop Only */}
                <div className="hidden md:block absolute inset-0 bg-white/80 backdrop-blur-md rounded-[2.5rem] shadow-lg border border-white/50 -z-10 overflow-hidden">
                    <div
                        className="absolute top-[-12px] left-0 right-0 h-[112px]"
                        style={{
                            backgroundImage: `url(${settingsHeaderBg})`,
                            backgroundSize: '100% 100%',
                            backgroundPosition: 'center',
                            backgroundRepeat: 'no-repeat'
                        }}
                    />
                </div>

                {/* Back Button - Moved out of the background container to ensure it's clickable */}
                <button
                    onClick={() => setSelectedConversation(null)}
                    className="absolute top-6 right-8 w-9 h-9 bg-white/50 rounded-full flex items-center justify-center hover:bg-white/80 transition-all shadow-md z-30 border border-white/50 group"
                >
                    <ChevronRight className="w-5 h-5 text-[#348dcf] group-hover:scale-110 transition-transform" />
                </button>

                {/* Title Above Card - Brought closer to the card and lifted */}
                <div className="relative z-10 text-center mt-[60px] mb-0">
                    <h1 className="text-xl md:text-2xl font-bold text-[#001a6e] drop-shadow-sm">הודעות</h1>
                </div>

                {/* Chat Container - Now split for the "cut" effect */}
                <div className="relative h-[85vh] md:h-[65vh] flex flex-col w-full md:w-[63%] mx-auto mt-[15px] mb-4 z-20">
                    {/* Message List Area - Sharpened corners (3px) and no border */}
                    <div className="flex-1 overflow-hidden bg-white shadow-[0_4px_16px_rgba(0,0,0,0.12)] rounded-t-[3px] md:rounded-t-[3px] flex flex-col">
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
                    </div>

                    {/* Input Area - Separate card with 12px gap, sharpened corners, and subtle gray shadow */}
                    <div className="mt-3 bg-white shadow-[0_4px_16px_rgba(0,0,0,0.12)] rounded-b-[3px] overflow-hidden">
                        <SeekerMessageInput
                            newMessage={newMessage}
                            setNewMessage={setNewMessage}
                            sendMessage={sendMessage}
                            sendingMessage={sendingMessage}
                        />
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="h-full relative" dir="rtl">
            {/* MOBILE FIXED BACKGROUND */}
            <div
                className="md:hidden fixed top-0 left-0 right-0 z-0 pointer-events-none"
                style={{
                    width: '100%',
                    height: '230px',
                    backgroundImage: `url(${settingsMobileBg})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    backgroundRepeat: 'no-repeat'
                }}
            />

            <div className="relative">
                {/* Desktop Background Only */}
                <div className="hidden md:block relative h-[92px] overflow-hidden w-full">
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

                {/* Mobile Back Button */}
                <div className="md:hidden flex items-center justify-center pt-10 pb-4 relative z-10 w-full px-6">
                    <button
                        onClick={() => navigate(-1)}
                        className="absolute right-6 w-8 h-8 bg-white/50 rounded-full flex items-center justify-center shadow-sm backdrop-blur-sm"
                    >
                        <ChevronRight className="w-5 h-5 text-gray-800" />
                    </button>
                    <h1 className="text-[28px] font-bold text-gray-800">הודעות</h1>
                </div>

                <div className="p-0 md:p-6 -mt-6 md:-mt-[50px] relative z-10 max-w-7xl w-full md:w-[75%] mx-auto mb-8">
                    <div className="md:hidden h-4" /> {/* Spacer for Title on Mobile already handled by Header */}

                    <div className="bg-white [border-top-left-radius:50%_40px] [border-top-right-radius:50%_40px] md:bg-transparent md:rounded-0 min-h-screen md:min-h-0 pt-4 md:pt-0 px-4 md:px-0">
                        {/* Desktop only title */}
                        <div className="text-center pb-4 hidden md:block">
                            <h1 className="text-2xl md:text-3xl font-bold text-[#001a6e]">הודעות</h1>
                        </div>

                        {/* Mobile Shared Container: Search + Conversations */}
                        <div className="md:contents">
                            <div className="md:hidden bg-white border border-gray-100 rounded-[28px] shadow-[0_4px_20px_rgba(0,0,0,0.03)] overflow-hidden mx-4 mb-8">
                                {/* Small Search Field */}
                                <div className="p-4 border-b border-gray-100 flex items-center bg-[#f8f9fd] relative">
                                    <Input
                                        placeholder="חיפוש בהודעות"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="border-none bg-transparent focus:ring-0 h-8 pl-10 pr-4 text-sm text-right placeholder:text-gray-400 w-full"
                                        dir="rtl"
                                    />
                                    <Search className="text-blue-500 w-4 h-4 absolute left-7 top-1/2 transform -translate-y-1/2" />
                                </div>

                                {/* Conversations List inside the card on mobile */}
                                <div className="divide-y divide-gray-50 bg-[#f0f7fc]">
                                    {loading ? (
                                        <div className="flex justify-center items-center py-12">
                                            <div className="w-8 h-8 border-t-2 border-blue-600 rounded-full animate-spin"></div>
                                        </div>
                                    ) : (searchTerm ? filteredConversations : conversations).length === 0 ? (
                                        <div className="text-center py-12 text-gray-500 bg-white">
                                            <p className="text-sm">אין הודעות כרגע</p>
                                        </div>
                                    ) : (
                                        (searchTerm ? filteredConversations : conversations).map((conversation, index) => {
                                            const names = conversation.employer_name ? conversation.employer_name.split(' ') : [];
                                            const firstName = names[0] || "";

                                            return (
                                                <div
                                                    key={conversation.id}
                                                    className="flex items-center justify-between p-4 bg-[#f0f7fc] hover:bg-[#e1effa] cursor-pointer transition-colors h-[68px]"
                                                    onClick={() => handleConversationSelect(conversation)}
                                                >
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-10 h-10 rounded-full border border-blue-200 bg-white flex items-center justify-center flex-shrink-0 overflow-hidden">
                                                            {conversation.profileImage && conversation.profileImage !== "" ? (
                                                                <img
                                                                    src={conversation.profileImage}
                                                                    alt={conversation.employer_name}
                                                                    className="w-full h-full object-cover"
                                                                />
                                                            ) : (
                                                                <span className="text-xs font-bold text-gray-600">
                                                                    {conversation.employer_name.slice(0, 2)}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div className="text-right">
                                                            <span className="text-[15px] text-gray-900 font-bold block mb-0.5">
                                                                {conversation.employer_name}
                                                            </span>
                                                            <p className="text-[11px] text-gray-400 truncate max-w-[150px]">
                                                                {conversation.last_message || "אין הודעות"}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <span className="text-gray-400 text-[10px] whitespace-nowrap">
                                                        {safeFormatDate(conversation.last_message_time, "dd.MM.yy")}
                                                    </span>
                                                </div>
                                            );
                                        })
                                    )}
                                </div>
                            </div>

                            {/* Desktop/Legacy View (Hidden on mobile) */}
                            <div className="hidden md:block">
                                <div className="relative mb-4 w-full max-w-md mx-auto">
                                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-blue-500 w-5 h-5" />
                                    <Input
                                        placeholder="חיפוש בהודעות"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="pl-12 pr-4 py-3 bg-[#F9FAFB] border-none focus:ring-1 focus:ring-blue-200 rounded-lg h-12 text-right shadow-sm placeholder:text-gray-400"
                                        dir="rtl"
                                    />
                                </div>

                                <div className="w-full max-w-3xl mx-auto h-px bg-gray-200 mb-3" />

                                <div className="mb-6 w-full max-w-3xl mx-auto">
                                    <Button
                                        onClick={handleSupportContact}
                                        className="w-full bg-blue-50 hover:bg-blue-100 text-blue-600 border border-blue-200 rounded-xl h-[60px] flex items-center justify-between px-6"
                                        variant="outline"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
                                                <Headphones className="w-6 h-6 text-white" />
                                            </div>
                                            <div className="text-right">
                                                <p className="font-bold text-blue-800">יצירת קשר עם התמיכה</p>
                                                <p className="text-sm text-blue-600">יש לך שאלה? אנחנו כאן לעזור</p>
                                            </div>
                                        </div>
                                        <ChevronLeft className="w-5 h-5 text-blue-500" />
                                    </Button>
                                </div>
                            </div>
                        </div>

                        <div className="hidden md:block">
                            {loading ? (
                                <div className="flex justify-center items-center py-12">
                                    <div className="w-8 h-8 border-t-2 border-blue-600 rounded-full animate-spin"></div>
                                </div>
                            ) : paginatedConversations.length === 0 ? (
                                <div className="text-center py-12 text-gray-500">
                                    <p>אין הודעות כרגע</p>
                                </div>
                            ) : (
                                paginatedConversations.map((conversation, index) => {
                                    const names = conversation.employer_name ? conversation.employer_name.split(' ') : [];
                                    const firstName = names[0] || "";

                                    return (
                                        <div key={conversation.id} className="max-w-3xl mx-auto w-full">
                                            <div
                                                className="flex items-center justify-between p-3 bg-[#F4F9FF] hover:bg-[#EBF5FF] cursor-pointer transition-colors h-[60px] rounded-xl border border-blue-50 mb-1"
                                                onClick={() => handleConversationSelect(conversation)}
                                            >
                                                <div className="flex items-center gap-4">
                                                    <div className="w-9 h-9 rounded-full overflow-hidden">
                                                        {conversation.profileImage && conversation.profileImage !== "" ? (
                                                            <img
                                                                src={conversation.profileImage}
                                                                alt={conversation.employer_name}
                                                                className="w-full h-full object-cover"
                                                            />
                                                        ) : (
                                                            <div className="w-full h-full bg-gray-200 rounded-full flex items-center justify-center">
                                                                <span className="text-xs font-bold text-gray-600">
                                                                    {conversation.employer_name.slice(0, 2)}
                                                                </span>
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="text-right">
                                                        <span className="text-base text-gray-900 font-bold">
                                                            {conversation.employer_name}
                                                        </span>
                                                    </div>
                                                </div>
                                                <span className="text-gray-400 text-xs font-light whitespace-nowrap px-4">
                                                    {safeFormatDate(conversation.last_message_time, "dd.MM.yy")}
                                                </span>
                                            </div>
                                            {index < paginatedConversations.length - 1 && (
                                                <div className="h-[1px] bg-gray-300 w-[95%] mx-auto my-1" />
                                            )}
                                        </div>
                                    );
                                })
                            )}
                        </div>

                        <div className="hidden md:block">
                            <SeekerPagination
                                currentPage={currentPage}
                                totalPages={totalPages}
                                goToPage={goToPage}
                                pageNumbers={pageNumbers}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
