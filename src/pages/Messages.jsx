import { useState, useEffect, useCallback } from "react";
import { User } from "@/api/entities";
import { Conversation } from "@/api/entities";
import { Message } from "@/api/entities";
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

                setConversations(mappedConversations);
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

    const loadMessages = useCallback(async (conversationId) => {
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
            // Load real messages from database
            // Load real messages from database
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

            // Ensure created_date is set for all messages
            const mappedMessages = sortedMessages.map(msg => ({
                ...msg,
                created_date: msg.created_date || msg.created_at || new Date().toISOString()
            }));

            setMessages(mappedMessages);
        } catch (error) {
            console.error("Error loading messages:", error);
            setMessages([]);
        } finally {
            setLoadingMessages(false);
        }
    }, []);

    const handleConversationSelect = useCallback((conversation) => {
        setSelectedConversation(conversation);
        loadMessages(conversation.id);
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
            loadMessages(targetConversation.id);
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
                {/* Background "Back Card" with Arch */}
                <div className="absolute inset-0 bg-white/80 backdrop-blur-md rounded-[2.5rem] shadow-lg border border-white/50 -z-10 overflow-hidden">
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
                <div className="relative h-[72vh] flex flex-col w-[63%] mx-auto mt-[15px] mb-4">
                    {/* Message List Area - Sharpened corners (3px) and no border */}
                    <div className="flex-1 overflow-hidden bg-white shadow-[0_4px_16px_rgba(0,0,0,0.12)] rounded-t-[3px] flex flex-col">
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
            <div className="relative">
                <div className="relative h-[92px] overflow-hidden w-full">
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
                <div className="p-2 sm:p-4 md:p-6 -mt-[50px] relative z-10 max-w-7xl w-[75%] mx-auto bg-white/80 backdrop-blur-md rounded-[2.5rem] shadow-lg border border-white/50 mb-8 mt-[-3.125rem]">
                    <div className="text-center pb-4">
                        <h1 className="text-2xl md:text-3xl font-bold text-[#001a6e]">הודעות</h1>
                    </div>
                    <div className="relative mb-8 w-full max-w-md mx-auto">
                        <Input
                            placeholder="חיפוש בהודעות"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-12 pr-4 py-3 bg-[#F9FAFB] border-none focus:ring-1 focus:ring-blue-200 rounded-lg h-12 text-right shadow-sm placeholder:text-gray-400"
                            dir="rtl"
                        />
                        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-blue-500 w-5 h-5" />
                    </div>

                    {/* Conversations List */}
                    <div className="space-y-3 mb-6 w-full max-w-4xl mx-auto">
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
                                    <motion.div
                                        key={conversation.id}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.3, delay: index * 0.1 }}
                                        className="flex items-center justify-between p-4 bg-[#F4F9FF] mb-2 hover:bg-[#EBF5FF] cursor-pointer transition-colors h-16 rounded-xl border border-blue-50"
                                        onClick={() => handleConversationSelect(conversation)}
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className={`w-10 h-10 rounded-full overflow-hidden ${['filled', 'filled_via_metch', 'closed'].includes(conversation.job_status) ? 'grayscale opacity-75' : ''
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
                                );
                            })
                        )}
                    </div>

                    <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        goToPage={goToPage}
                        pageNumbers={pageNumbers}
                    />
                </div>
            </div>
        </div>
    );
};
