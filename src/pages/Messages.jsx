import { useState, useEffect } from "react";
import { User } from "@/api/entities";
import { Conversation } from "@/api/entities";
import { Message } from "@/api/entities";
import { UserProfile } from "@/api/entities";
import { Job } from "@/api/entities";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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

const ITEMS_PER_PAGE = 4;

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

    const loadMessages = async (conversationId) => {
        setLoadingMessages(true);
        try {
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
    };

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
            <div className="p-4 md:p-6" dir="rtl">
                <div className="w-[85vw] mx-auto">
                    <Card className="bg-white rounded-2xl md:rounded-[2.5rem] shadow-xl border border-gray-100 overflow-hidden h-[80vh]">
                        <div className="relative h-full flex flex-col">
                            {/* Header */}
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
                                <button
                                    onClick={() => setSelectedConversation(null)}
                                    className="absolute top-4 right-6 w-10 h-10 bg-white/30 rounded-full flex items-center justify-center backdrop-blur-sm hover:bg-white/50 transition-colors z-10"
                                >
                                    <ChevronRight className="w-6 h-6 text-gray-800" />
                                </button>
                            </div>

                            {/* Chat Header with Job Status */}
                            <div className="text-center py-4 -mt-6 relative z-10 space-y-2">
                                <h1 className="text-2xl md:text-3xl font-bold text-gray-900">הודעות</h1>
                                <div className="flex justify-center items-center gap-2">
                                    <span className="text-sm text-gray-600">{selectedConversation.job_title}</span>
                                    <ConversationStatusIndicator jobStatus={selectedConversation.job_status} />
                                </div>
                            </div>

                            {/* Messages Area */}
                            <div className="flex-1 p-6 overflow-y-auto space-y-4">
                                {loadingMessages && (
                                    <div className="flex justify-center items-center py-8">
                                        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
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
                                                className={`flex ${isMyMessage ? 'justify-start' : 'justify-end'}`}
                                            >
                                                <div className={`max-w-xs lg:max-w-md px-6 py-3 rounded-2xl ${
                                                    isMyMessage
                                                        ? 'bg-blue-600 text-white'
                                                        : 'bg-gray-100 text-gray-900'
                                                }`}>
                                                    <p className="text-base">{message.content}</p>
                                                    <div className={`flex items-center justify-start gap-1 mt-2 text-xs ${
                                                        isMyMessage ? 'text-blue-100' : 'text-gray-500'
                                                    }`}>
                                                        {isMyMessage && (
                                                            <CheckCheck className="w-3 h-3" />
                                                        )}
                                                        <span>{safeFormatDate(message.created_date || message.created_at, "HH:mm", "--:--")}</span>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        );
                                    })}
                                </AnimatePresence>
                            </div>

                            {/* Message Input - Disabled for closed/filled jobs */}
                            <div className="border-t border-gray-200 p-6">
                                {['filled', 'filled_via_metch', 'closed'].includes(selectedConversation.job_status) ? (
                                    <div className="text-center py-4">
                                        <p className="text-gray-500">לא ניתן לשלוח הודעות - המשרה לא פעילה</p>
                                    </div>
                                ) : (
                                    <form onSubmit={sendMessage} className="flex flex-row-reverse gap-3 items-center">
                                        <Button
                                            type="submit"
                                            disabled={!newMessage.trim() || sendingMessage}
                                            className="bg-blue-100 hover:bg-blue-200 rounded-full w-12 h-12 flex-shrink-0"
                                            size="icon"
                                        >
                                            <Send className="w-4 h-4 text-blue-600" />
                                        </Button>
                                        <Input
                                            value={newMessage}
                                            onChange={(e) => setNewMessage(e.target.value)}
                                            placeholder="הקלד כאן..."
                                            className="flex-1 rounded-full h-12 pr-6 pl-6 text-right border-gray-200 focus:border-blue-400"
                                            dir="rtl"
                                            disabled={sendingMessage}
                                        />
                                    </form>
                                )}
                            </div>
                        </div>
                    </Card>
                </div>
            </div>
        );
    }

    return (
        <div className="p-4 md:p-6" dir="rtl">
            <div className="w-[85vw] mx-auto">
                <Card className="bg-white rounded-2xl md:rounded-[2.5rem] shadow-xl border border-gray-100 overflow-hidden">
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
                    </div>

                    <CardContent className="p-4 sm:p-6 md:p-8 -mt-6 relative z-10">
                        <div className="text-center pb-8">
                            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">הודעות</h1>
                        </div>

                        {/* Search */}
                        <div className="relative mb-8">
                            <Input
                                placeholder="חיפוש בהודעות"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-12 pr-4 py-3 border-gray-300 focus:border-blue-400 rounded-full h-12 text-right"
                                dir="rtl"
                            />
                            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                        </div>

                        {/* Conversations List */}
                        <div className="space-y-4 mb-8">
                            {loading ? (
                                <div className="flex justify-center items-center py-12">
                                    <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                                </div>
                            ) : paginatedConversations.length === 0 ? (
                                <div className="text-center py-12 text-gray-500">
                                    <p>אין הודעות כרגע</p>
                                </div>
                            ) : (
                                paginatedConversations.map((conversation, index) => (
                                    <motion.div
                                        key={conversation.id}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.3, delay: index * 0.1 }}
                                        className="flex items-center justify-between p-4 hover:bg-gray-50/80 rounded-xl cursor-pointer transition-colors"
                                        onClick={() => handleConversationSelect(conversation)}
                                    >
                                        <div className="flex items-center gap-4">
                                             <div className="space-y-1 text-right">
                                                <span className={`font-medium ${
                                                    ['filled', 'filled_via_metch', 'closed'].includes(conversation.job_status) ? 'text-gray-500' : 'text-gray-800'
                                                }`}>
                                                    {conversation.candidate_name}
                                                </span>
                                                <div className="text-xs text-gray-500">{conversation.job_title}</div>
                                                <ConversationStatusIndicator jobStatus={conversation.job_status} className="text-xs" />
                                            </div>
                                            <div className={`w-12 h-12 rounded-full overflow-hidden border-2 border-gray-200 ${
                                                ['filled', 'filled_via_metch', 'closed'].includes(conversation.job_status) ? 'grayscale opacity-75' : ''
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
                                        </div>
                                        <span className="text-gray-500 text-sm whitespace-nowrap">
                                            {safeFormatDate(conversation.last_message_time, "dd.MM.yy", "--")}
                                        </span>
                                    </motion.div>
                                ))
                            )}
                        </div>

                        {/* Pagination */}
                        <div className="flex justify-center items-center pt-4">
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => goToPage(currentPage - 1)}
                                disabled={currentPage === 1}
                                className="rounded-full hover:bg-gray-100"
                            >
                                <ChevronRight className="w-5 h-5" />
                            </Button>
                            <div className="flex items-center gap-2 mx-4">
                                {pageNumbers.map(number => (
                                    <Button
                                        key={number}
                                        variant="ghost"
                                        onClick={() => goToPage(number)}
                                        className={`rounded-full w-9 h-9 transition-colors ${
                                            currentPage === number
                                                ? 'bg-blue-600 text-white font-bold shadow-md'
                                                : 'text-gray-600 hover:bg-gray-100'
                                        }`}
                                    >
                                        {number}
                                    </Button>
                                ))}
                            </div>
                           <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => goToPage(currentPage + 1)}
                                disabled={currentPage === totalPages}
                                className="rounded-full hover:bg-gray-100"
                            >
                                <ChevronLeft className="w-5 h-5" />
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}