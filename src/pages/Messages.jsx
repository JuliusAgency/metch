import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/api/supabaseClient";
import { User } from "@/api/entities";
import { Conversation } from "@/api/entities";
import { Message, Notification } from "@/api/entities";
import { UserProfile } from "@/api/entities";
import { Job } from "@/api/entities";
import { JobApplication } from "@/api/entities";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
    Send,
    ChevronLeft,
    ChevronRight,
    CheckCheck,
    Search
} from "lucide-react";
import { SendEmail } from "@/api/integrations";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import ConversationStatusIndicator from "@/components/conversations/ConversationStatusIndicator";
import ChatHeader from "@/components/messages/ChatHeader";
import MessageItem from "@/components/messages/MessageItem";
import MessageInput from "@/components/messages/MessageInput";
import ConversationList from "@/components/messages/ConversationList";
import Pagination from "@/components/messages/Pagination";
import { useRequireUserType } from "@/hooks/use-require-user-type";
import { useLocation, useNavigate } from "react-router-dom";
import settingsHeaderBg from "@/assets/settings_header_bg.png";
import settingsMobileBg from "@/assets/settings_mobile_bg.jpg";
import { useUser } from "@/contexts/UserContext";

const ITEMS_PER_PAGE = 5;
const SUPPORT_EMAIL = "business@metch.co.il";

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

export default function Messages() {
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
    const [pendingConversationParams, setPendingConversationParams] = useState(null);
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

                console.log('[Messages] Marked messages as read for:', userData.email);

                // Force refresh badges
                refreshUnreadCount(userData.id, userData.email);
            } catch (error) {
                console.error('Error marking messages as read:', error);
            }

            // Load conversations for employer from database
            let conversationsData = [];
            const myJobs = await Job.filter({ created_by: userData.email });
            const myJobIds = myJobs.map(j => String(j.id));

            try {
                // Load conversations for employer - Try ID first, fallback to email
                conversationsData = await Conversation.filter(
                    { employer_id: userData.id },
                    "-last_message_time",
                    100
                );


                // Fetch candidate information and job status for each conversation
                const mappedConversations = await Promise.all(conversationsData.map(async (conv) => {
                    let candidateName = conv.candidate_name || "מועמד לא ידוע";
                    let profileImage = "";
                    let jobStatus = "active";
                    let jobLocation = "";
                    let jobTitle = conv.job_title || "";

                    // Try to fetch candidate info from UserProfile
                    try {
                        const candidateResults = await UserProfile.filter({ email: conv.candidate_email });
                        if (candidateResults.length > 0) {
                            candidateName = candidateResults[0].full_name || conv.candidate_name || "מועמד לא ידוע";
                            profileImage = candidateResults[0].profile_picture || "";
                        }
                    } catch (error) {
                        console.error("Error fetching candidate info:", error);
                    }

                    // Try to fetch job status if job_id exists
                    if (conv.job_id) {
                        try {
                            const jobResults = await Job.filter({ id: conv.job_id });
                            if (jobResults.length > 0) {
                                jobStatus = jobResults[0].status || "active";
                                jobLocation = jobResults[0].location || "";
                                jobTitle = jobResults[0].title || jobTitle;
                            }
                        } catch (error) {
                            console.error("Error fetching job status:", error);
                        }
                    }

                    const isSupport = conv.candidate_email === SUPPORT_EMAIL;

                    // Fallback: If job title is missing/generic, try to find from Applications
                    if ((!jobTitle || jobTitle === "משרה כללית") && !isSupport) {
                        try {
                            const apps = await JobApplication.filter({ applicant_email: conv.candidate_email });
                            const relevantApp = apps.find(app => myJobIds.includes(String(app.job_id)));

                            if (relevantApp) {
                                const job = myJobs.find(j => String(j.id) === String(relevantApp.job_id));
                                if (job) {
                                    jobTitle = job.title;
                                    jobLocation = job.location || jobLocation;
                                    jobStatus = job.status || jobStatus;
                                }
                            }
                        } catch (e) {
                            console.error("Fallback job lookup failed:", e);
                        }
                    }

                    return {
                        id: conv.id,
                        candidate_id: conv.candidate_id,
                        candidate_name: isSupport ? "צוות התמיכה" : candidateName,
                        candidate_email: conv.candidate_email,
                        last_message_time: conv.last_message_time,
                        last_message: conv.last_message || "",
                        profileImage: profileImage,
                        job_title: isSupport ? "תמיכה עסקית" : (jobTitle || "משרה כללית"),
                        job_status: jobStatus,
                        job_location: jobLocation,
                        job_id: conv.job_id,
                        is_support: isSupport
                    };
                }));
                // Deduplicate and group conversations by candidate email
                const groupedConversations = mappedConversations.reduce((acc, current) => {
                    const email = current.candidate_email;
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
                console.error("Error loading conversations:", error);
            }
        } catch (error) {
            console.error("Error loading data:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const conversationId = params.get("conversationId");
        const candidateEmail = params.get("candidateEmail");
        if (conversationId || candidateEmail) {
            setPendingConversationParams({ conversationId, candidateEmail });
        }
    }, [location.search]);

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

            // Ensure created_date is set for all messages
            const mappedMessages = sortedMessages.map(msg => ({
                ...msg,
                created_date: msg.created_date || msg.created_at || null
            }));

            setMessages(mappedMessages);

            // Mark incoming messages as read in database for all IDs
            try {
                const unreadMessagesData = mappedMessages.filter(m => m.sender_email !== user?.email && !m.is_read);
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
    }, [user?.email]);

    const handleConversationSelect = useCallback((conversation) => {
        setSelectedConversation(conversation);
        loadMessages(conversation.id, conversation.all_ids || []);
    }, [loadMessages]);

    const startSupportConversation = useCallback(() => {
        // Check if we already have a support conversation
        const existingSupport = conversations.find(c => c.is_support || c.candidate_email === SUPPORT_EMAIL);

        if (existingSupport) {
            handleConversationSelect(existingSupport);
        } else {
            const supportConversation = {
                id: "support",
                candidate_name: "צוות התמיכה",
                candidate_email: SUPPORT_EMAIL,
                last_message_time: new Date().toISOString(),
                last_message: "איך אנחנו יכולים לעזור?",
                profileImage: "",
                job_title: "תמיכה עסקית",
                job_status: "active",
                job_id: null,
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
            setLoadingMessages(false);
        }
    }, [conversations, handleConversationSelect]);

    useEffect(() => {
        if (location.state?.supportChat) {
            startSupportConversation();
            navigate(location.pathname, { replace: true, state: null });
        }
    }, [location.state, location.pathname, navigate, startSupportConversation]);

    useEffect(() => {
        if (!pendingConversationParams || conversations.length === 0) return;

        const { conversationId, candidateEmail } = pendingConversationParams;
        let targetConversation = null;

        if (conversationId) {
            targetConversation = conversations.find(
                (conversation) => String(conversation.id) === String(conversationId)
            );
        }

        if (!targetConversation && candidateEmail) {
            targetConversation = conversations.find(
                (conversation) => conversation.candidate_email === candidateEmail
            );
        }

        if (targetConversation) {
            setSelectedConversation(targetConversation);
            loadMessages(targetConversation.id, targetConversation.all_ids || []);
            setPendingConversationParams(null);

            if (location.search) {
                const params = new URLSearchParams(location.search);
                params.delete("conversationId");
                params.delete("candidateEmail");
                const nextQuery = params.toString();
                navigate(nextQuery ? `${location.pathname}?${nextQuery}` : location.pathname, { replace: true });
            }
        }
    }, [pendingConversationParams, conversations, loadMessages, location.pathname, location.search, navigate]);

    const filteredConversations = conversations.filter(conv =>
        conv && conv.candidate_name && conv.candidate_name.toLowerCase().includes(searchTerm.toLowerCase())
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
        if (!newMessage.trim() || !selectedConversation) return;

        setSendingMessage(true);
        try {
            let conversationId = selectedConversation.id;
            let recipientEmail = selectedConversation.candidate_email;

            // Handle first support message - create conversation if it doesn't exist
            if (selectedConversation.id === "support") {
                const existingSupport = conversations.find(c =>
                    (c.candidate_id === "support_team_id" || c.candidate_email === SUPPORT_EMAIL)
                );
                if (existingSupport) {
                    conversationId = existingSupport.id;
                } else {
                    const newConv = await Conversation.create({
                        employer_email: user.email,
                        employer_id: user.id,
                        candidate_email: SUPPORT_EMAIL,
                        job_title: "תמיכה עסקית",
                        last_message: newMessage.trim(),
                        last_message_time: new Date().toISOString()
                    });
                    conversationId = newConv.id;
                    // Refresh conversations list
                    loadData();
                }
            }

            const currentDate = new Date().toISOString();

            // Create message in database with explicit created_date
            const createdMessage = await Message.create({
                conversation_id: conversationId,
                sender_email: user?.email,
                sender_id: user?.id,
                recipient_email: recipientEmail,
                recipient_id: selectedConversation.candidate_id || null,
                content: newMessage.trim(),
                is_read: false,
                created_date: currentDate
            });

            // Update conversation with last message info
            await Conversation.update(conversationId, {
                last_message: newMessage.trim(),
                last_message_time: currentDate
            });

            // Create notification for recipient (only if not support)
            if (recipientEmail !== SUPPORT_EMAIL) {
                try {
                    const notificationData = {
                        type: 'new_message',
                        user_id: selectedConversation.candidate_id || null,
                        email: recipientEmail,
                        created_by: user.id,
                        title: 'הודעה חדשה',
                        message: `הודעה חדשה מ-${user.company_name || user.full_name || 'מעסיק'}`,
                        is_read: false,
                        created_date: currentDate
                    };
                    console.log('[Messages] Creating notification:', notificationData);
                    await Notification.create(notificationData);
                } catch (e) {
                    console.error("Error creating notification for candidate:", e);
                }
            }

            // --- Explicitly Send Email Notification ---
            // Send email to recipient (Candidate or Support)
            try {
                const isSupport = recipientEmail === SUPPORT_EMAIL;
                const subject = isSupport
                    ? `הודעה חדשה מ-${user.company_name || user.full_name || 'מעסיק'}`
                    : `הודעה חדשה מ-${user.company_name || user.full_name || 'מעסיק'} ב-Metch`;

                const emailHtml = `
                    <div dir="rtl" style="text-align: right; font-family: sans-serif;">
                        <h2>${subject}</h2>
                        <p>התקבלה הודעה חדשה:</p>
                        <blockquote style="background: #f9f9f9; padding: 10px; border-right: 4px solid #007bff; margin: 10px 0;">
                            ${newMessage.trim().replace(/\n/g, '<br/>')}
                        </blockquote>
                        <br/>
                        <a href="https://metch.co.il/MessagesSeeker" style="background: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
                            למעבר להודעות
                        </a>
                        <br/><br/>
                        <p style="color: #666; font-size: 12px;">הודעה זו נשלחה באופן אוטומטי ממערכת Metch.</p>
                    </div>
                `;

                await SendEmail({
                    to: recipientEmail,
                    subject: subject,
                    html: emailHtml,
                    text: `הודעה חדשה מ-${user.company_name || user.full_name}:\n\n${newMessage.trim()}\n\nלמעבר להודעות: https://metch.co.il/MessagesSeeker`
                });
                console.log('[Messages] Email sent successfully to:', recipientEmail);
            } catch (emailErr) {
                console.error('[Messages] Error sending email notification:', emailErr);
            }

            if (selectedConversation.id === "support") {
                // Switch to real conversation
                const updatedConv = {
                    ...selectedConversation,
                    id: conversationId,
                    is_support: true
                };
                setSelectedConversation(updatedConv);
            }

            // Ensure created_date is set for the UI
            const messageWithDate = {
                ...createdMessage,
                created_date: createdMessage.created_date || createdMessage.created_at || currentDate
            };

            // Add message to UI
            setMessages(prev => [...prev, messageWithDate]);
            setNewMessage("");

            // Update conversation in list
            setConversations(prev => prev.map(conv =>
                conv.id === conversationId
                    ? { ...conv, last_message: newMessage.trim(), last_message_time: currentDate }
                    : conv
            ));
        } catch (error) {
            console.error("Error sending message:", error);
        } finally {
            setSendingMessage(false);
        }
    };


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

                {/* Title Above Card / Chat Header */}
                <div className="relative z-10 text-center mt-[60px] mb-0">
                    <ChatHeader
                        setSelectedConversation={setSelectedConversation}
                        selectedConversation={selectedConversation}
                        ConversationStatusIndicator={ConversationStatusIndicator}
                    />
                </div>

                {/* Chat Container - Now split for the "cut" effect */}
                <div className="relative h-[85vh] md:h-[65vh] flex flex-col w-full md:w-[63%] mx-auto mt-[5px] mb-4 z-20">
                    {/* Message List Area - Sharpened corners (3px) and no border */}
                    <div className="flex-1 overflow-hidden bg-white shadow-[0_4px_16px_rgba(0,0,0,0.12)] rounded-t-[3px] md:rounded-t-[3px] flex flex-col">
                        <div className="flex-1 p-8 overflow-y-auto space-y-6 bg-gray-50/30">
                            {loadingMessages && (
                                <div className="flex justify-center items-center py-8">
                                    <div className="w-8 h-8 border-t-2 border-blue-600 rounded-full animate-spin"></div>
                                </div>
                            )}

                            {/* Job Status Message if job is closed/filled */}
                            {!loadingMessages && selectedConversation.job_status && ['filled', 'filled_via_metch', 'closed'].includes(selectedConversation.job_status) && (
                                <div className="bg-gray-100 rounded-lg p-4 text-center">
                                    <p className="text-sm text-gray-600">
                                        {selectedConversation.job_status === 'filled' && "המשרה הזו כבר אוישה"}
                                        {selectedConversation.job_status === 'filled_via_metch' && "המשרה הזו אוישה דרך המערכת"}
                                        {selectedConversation.job_status === 'closed' && "המשרה הזו נסגרה על ידי המעסיק"}
                                    </p>
                                </div>
                            )}

                            <AnimatePresence>
                                {!loadingMessages && messages.map((message, index) => {
                                    const isMyMessage = message.sender_email === user?.email;
                                    const messageDateValue = message.created_date || message.created_at;
                                    if (!messageDateValue) return null;

                                    const messageDate = new Date(messageDateValue);
                                    const previousMessage = messages[index - 1];
                                    const previousDate = previousMessage ? new Date(previousMessage.created_date || previousMessage.created_at) : null;

                                    const showDateSeparator = !previousDate ||
                                        messageDate.toDateString() !== previousDate.toDateString();

                                    let dateSeparatorText = "";
                                    if (showDateSeparator) {
                                        const now = new Date();
                                        const todayStr = now.toDateString();
                                        const yesterday = new Date(now);
                                        yesterday.setDate(now.getDate() - 1);
                                        const yesterdayStr = yesterday.toDateString();

                                        const currentMsgDateStr = messageDate.toDateString();

                                        if (currentMsgDateStr === todayStr) {
                                            dateSeparatorText = "היום";
                                        } else if (currentMsgDateStr === yesterdayStr) {
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
                                            <motion.div
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ duration: 0.2 }}
                                                className={`flex ${isMyMessage ? 'justify-start' : 'justify-end'} mb-2`}
                                            >
                                                <div className={`flex flex-col max-w-xs lg:max-w-md ${isMyMessage ? 'items-start' : 'items-end'}`}>
                                                    <div className={`px-5 py-3 text-sm font-light shadow-sm break-words ${isMyMessage
                                                        ? 'bg-[#001a6e] text-white rounded-2xl rounded-br-none'
                                                        : 'bg-[#F2F4F7] text-gray-800 rounded-2xl rounded-bl-none'
                                                        }`}>
                                                        {message.content}
                                                    </div>
                                                    <div className="flex items-center gap-1 mt-1 px-1">
                                                        <span className="text-[10px] text-gray-400">
                                                            {safeFormatDate(message.created_date || message.created_at, "HH:mm")}
                                                        </span>
                                                        {isMyMessage && (
                                                            <CheckCheck className="w-3 h-3 text-green-500" />
                                                        )}
                                                    </div>
                                                </div>
                                            </motion.div>
                                        </div>
                                    );
                                })}
                            </AnimatePresence>
                        </div>
                    </div>

                    {/* Input Area - Separate card with 12px gap, sharpened corners (3px), and no border */}
                    <div className="mt-3 bg-white shadow-[0_4px_16px_rgba(0,0,0,0.12)] rounded-b-[3px] overflow-hidden">
                        <MessageInput
                            newMessage={newMessage}
                            setNewMessage={setNewMessage}
                            sendMessage={sendMessage}
                            sendingMessage={sendingMessage}
                            selectedConversation={selectedConversation}
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
                    <div className="md:hidden h-4" />

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
                                            const names = conversation.candidate_name ? conversation.candidate_name.split(' ') : [];
                                            const firstName = names[0] || "";
                                            const lastInitial = names.length > 1 ? names[names.length - 1].charAt(0) : "";

                                            return (
                                                <div
                                                    key={conversation.id}
                                                    className={`flex items-center justify-between p-4 bg-[#f0f7fc] hover:bg-[#e1effa] cursor-pointer transition-colors h-[68px] ${['filled', 'filled_via_metch', 'closed'].includes(conversation.job_status) ? 'opacity-60' : ''}`}
                                                    onClick={() => handleConversationSelect(conversation)}
                                                >
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-10 h-10 rounded-full border border-blue-200 bg-white flex items-center justify-center flex-shrink-0 overflow-hidden">
                                                            {conversation.profileImage && conversation.profileImage !== "" ? (
                                                                <img
                                                                    src={conversation.profileImage}
                                                                    alt={conversation.candidate_name}
                                                                    className="w-full h-full object-cover"
                                                                />
                                                            ) : (
                                                                <span className="text-xs font-bold text-gray-600">
                                                                    {conversation.candidate_name.slice(0, 2)}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div className="text-right">
                                                            <span className="text-[15px] text-gray-900 font-bold block mb-0.5">
                                                                {firstName} {lastInitial && <span>{lastInitial}</span>}
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
                                    <Input
                                        placeholder="חיפוש בהודעות"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="pl-12 pr-4 py-3 bg-[#F9FAFB] border-none focus:ring-1 focus:ring-blue-200 rounded-lg h-12 text-right shadow-sm placeholder:text-gray-400"
                                        dir="rtl"
                                    />
                                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-blue-500 w-5 h-5" />
                                </div>

                                <div className="w-full max-w-3xl mx-auto h-px bg-gray-200 mb-3" />
                            </div>
                        </div>

                        {/* Conversations List */}
                        <div className="space-y-3 mb-6 w-full max-w-3xl mx-auto">
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
                                        const names = conversation.candidate_name ? conversation.candidate_name.split(' ') : [];
                                        const firstName = names[0] || "";
                                        const lastInitial = names.length > 1 ? names[names.length - 1].charAt(0) : "";

                                        return (
                                            <div key={conversation.id}>
                                                <motion.div
                                                    initial={{ opacity: 0, y: 20 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ duration: 0.3, delay: index * 0.1 }}
                                                    className="flex items-center justify-between p-3 bg-[#F4F9FF] hover:bg-[#EBF5FF] cursor-pointer transition-colors h-[60px] rounded-xl border border-blue-50 mb-1"
                                                    onClick={() => handleConversationSelect(conversation)}
                                                >
                                                    <div className="flex items-center gap-4">
                                                        <div className={`w-9 h-9 rounded-full overflow-hidden ${['filled', 'filled_via_metch', 'closed'].includes(conversation.job_status) ? 'grayscale opacity-75' : ''
                                                            }`}>
                                                            {conversation.profileImage && conversation.profileImage !== "" ? (
                                                                <img
                                                                    src={conversation.profileImage}
                                                                    alt={conversation.candidate_name}
                                                                    className="w-full h-full object-cover"
                                                                />
                                                            ) : (
                                                                <div className="w-full h-full bg-gray-200 rounded-full flex items-center justify-center">
                                                                    <span className="text-xs font-bold text-gray-600">
                                                                        {conversation.candidate_name.slice(0, 2)}
                                                                    </span>
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div className="text-right">
                                                            <span className={`text-base text-gray-900 font-bold ${['filled', 'filled_via_metch', 'closed'].includes(conversation.job_status) ? 'text-gray-500' : ''
                                                                }`}>
                                                                {firstName} {lastInitial && <span>{lastInitial}</span>}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <span className="text-gray-400 text-xs font-light whitespace-nowrap px-4">
                                                        {safeFormatDate(conversation.last_message_time, "dd.MM.yy")}
                                                    </span>
                                                </motion.div>
                                                {index < paginatedConversations.length - 1 && (
                                                    <div className="h-[1px] bg-gray-300 w-[95%] mx-auto my-1" />
                                                )}
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </div>

                        <div className="hidden md:block">
                            <Pagination
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
};
