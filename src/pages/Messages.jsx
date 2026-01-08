import { useState, useEffect, useCallback } from "react";
import { User } from "@/api/entities";
import { Conversation } from "@/api/entities";
import { Message } from "@/api/entities";
import { UserProfile } from "@/api/entities";
import { Job } from "@/api/entities";
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
            try {
                const conversationsData = await Conversation.filter(
                    { employer_email: userData.email },
                    "-last_message_time",
                    100
                );

                // Fetch candidate information and job status for each conversation
                const mappedConversations = await Promise.all(conversationsData.map(async (conv) => {
                    let candidateName = conv.candidate_name || "מועמד לא ידוע";
                    let profileImage = "";
                    let jobStatus = "active";

                    // Try to fetch candidate info from UserProfile
                    try {
                        const candidateResults = await UserProfile.filter({ email: conv.candidate_email });
                        if (candidateResults.length > 0) {
                            candidateName = candidateResults[0].full_name || conv.candidate_name || "מועמד לא ידוע";
                            profileImage = candidateResults[0].profile_image || "";
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
                            }
                        } catch (error) {
                            console.error("Error fetching job status:", error);
                        }
                    }

                    return {
                        id: conv.id,
                        candidate_name: candidateName,
                        candidate_email: conv.candidate_email,
                        last_message_time: conv.last_message_time,
                        last_message: conv.last_message || "",
                        profileImage: profileImage,
                        job_title: conv.job_title || "משרה כללית",
                        job_status: jobStatus,
                        job_id: conv.job_id
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
            const messagesData = await Message.filter(
                { conversation_id: conversationId },
                "created_date",
                100
            );

            // Ensure created_date is set for all messages
            const mappedMessages = messagesData.map(msg => ({
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

    const startSupportConversation = useCallback(() => {
        const supportConversation = {
            id: "support",
            candidate_name: "צוות התמיכה",
            candidate_email: SUPPORT_EMAIL,
            last_message_time: new Date().toISOString(),
            last_message: "איך אנחנו יכולים לעזור?",
            profileImage: "",
            job_title: "תמיכה טכנית",
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
    }, []);

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
        conv.candidate_name.toLowerCase().includes(searchTerm.toLowerCase())
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
            if (selectedConversation?.is_support) {
                const newMsg = {
                    id: Date.now().toString(),
                    content: newMessage.trim(),
                    sender_email: user?.email || "employer@example.com",
                    created_date: new Date().toISOString(),
                    is_read: false
                };

                setMessages(prev => [...prev, newMsg]);
                setNewMessage("");
                setSendingMessage(false);
                return;
            }
            const currentDate = new Date().toISOString();

            // Create message in database with explicit created_date
            const createdMessage = await Message.create({
                conversation_id: selectedConversation.id,
                sender_email: user?.email,
                recipient_email: selectedConversation.candidate_email,
                content: newMessage.trim(),
                is_read: false,
                created_date: currentDate
            });

            // Update conversation with last message info
            await Conversation.update(selectedConversation.id, {
                last_message: newMessage.trim(),
                last_message_time: currentDate
            });

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
                conv.id === selectedConversation.id
                    ? { ...conv, last_message: newMessage.trim(), last_message_time: currentDate }
                    : conv
            ));
        } catch (error) {
            console.error("Error sending message:", error);
        } finally {
            setSendingMessage(false);
        }
    };

    const handleConversationSelect = (conversation) => {
        setSelectedConversation(conversation);
        loadMessages(conversation.id);
    };

    if (selectedConversation) {
        return (
            <div className="h-full relative flex flex-col" dir="rtl">
                <div className="relative h-full flex flex-col w-full">
                    <ChatHeader
                        setSelectedConversation={setSelectedConversation}
                        selectedConversation={selectedConversation}
                        ConversationStatusIndicator={ConversationStatusIndicator}
                    />
                    <div className="flex-1 p-6 overflow-y-auto space-y-4">
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
                                return (
                                    <motion.div
                                        key={message.id}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.3, delay: index * 0.1 }}
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
                                );
                            })}
                        </AnimatePresence>
                    </div>
                    <MessageInput
                        newMessage={newMessage}
                        setNewMessage={setNewMessage}
                        sendMessage={sendMessage}
                        sendingMessage={sendingMessage}
                        selectedConversation={selectedConversation}
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

                <div className="p-2 sm:p-4 md:p-6 -mt-12 relative z-10 w-full">
                    <div className="text-center pb-4">
                        <h1 className="text-2xl md:text-3xl font-bold text-[#001a6e]">הודעות</h1>
                    </div>

                    <div className="relative mb-4 w-1/3 mx-auto">
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
                    <div className="space-y-2.5 mb-6 w-[858px] mx-auto">
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
                                        className="flex items-center justify-between p-3 bg-[#F4F9FF] mb-2 hover:bg-[#EBF5FF] cursor-pointer transition-colors h-14 rounded-lg"
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
                                            {format(new Date(conversation.last_message_time), "dd.MM.yy")}
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
}
