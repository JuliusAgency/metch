import React, { useState, useEffect } from "react";
import { User } from "@/api/entities";
import { Conversation } from "@/api/entities";
import { Message } from "@/api/entities";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
    MessageCircle,
    Send,
    ChevronLeft,
    ChevronRight,
    HelpCircle,
    User as UserIcon,
    Clock,
    Check,
    CheckCheck,
    Search,
    Headphones
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

// Mock conversations data for job seekers
const MOCK_CONVERSATIONS = [
    { id: "1", employer_name: "ארומה", employer_email: "aroma@example.com", last_message_time: "2025-03-10T10:00:00Z", last_message: "שלום, ראיתי את הקורות חיים שלך", profileImage: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face", job_title: "מנהלת קשרי לקוחות" },
    { id: "2", employer_name: "ארומה", employer_email: "aroma2@example.com", last_message_time: "2025-03-09T09:30:00Z", last_message: "מתי תוכל להתחיל לעבוד?", profileImage: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/0e/Aroma_Espresso_Bar_logo.svg/1200px-Aroma_Espresso_Bar_logo.svg.png", job_title: "בריסטה" },
    { id: "3", employer_name: "ארומה", employer_email: "aroma3@example.com", last_message_time: "2025-03-08T09:00:00Z", last_message: "אשמח לקבוע איתך ראיון", profileImage: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/0e/Aroma_Espresso_Bar_logo.svg/1200px-Aroma_Espresso_Bar_logo.svg.png", job_title: "מנהל משמרת" },
    { id: "4", employer_name: "ארומה", employer_email: "aroma4@example.com", last_message_time: "2025-03-07T08:30:00Z", last_message: "תודה על הפנייה שלך", profileImage: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/0e/Aroma_Espresso_Bar_logo.svg/1200px-Aroma_Espresso_Bar_logo.svg.png", job_title: "עובד קופה" },
];

const ITEMS_PER_PAGE = 4;

export default function MessagesSeeker() {
    const [user, setUser] = useState(null);
    const [conversations, setConversations] = useState(MOCK_CONVERSATIONS);
    const [selectedConversation, setSelectedConversation] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState("");
    const [sendingMessage, setSendingMessage] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [loading, setLoading] = useState(true);

    const totalPages = Math.ceil(conversations.length / ITEMS_PER_PAGE);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const userData = await User.me();
            setUser(userData);
            
            // In a real implementation, load conversations for job seeker
            // const conversationsData = await Conversation.filter({ candidate_email: userData.email });
            // setConversations(conversationsData);
        } catch (error) {
            console.error("Error loading data:", error);
        } finally {
            setLoading(false);
        }
    };

    const loadMessages = async (conversationId) => {
        try {
            // Mock messages for the selected conversation
            const mockMessages = [
                {
                    id: "1",
                    content: "שלום! ראיתי את הקורות חיים שלך ואני מעוניין לשמוע עליך יותר",
                    sender_email: "employer@aroma.com",
                    created_date: "2025-01-03T16:45:00Z",
                    is_read: true
                },
                {
                    id: "2", 
                    content: "שלום! תודה על הפנייה. אשמח לשמוע עוד על התפקיד",
                    sender_email: user?.email || "seeker@example.com",
                    created_date: "2025-01-03T16:48:00Z",
                    is_read: true
                },
                {
                    id: "3",
                    content: "מתי תוכל להגיע לראיון?",
                    sender_email: "employer@aroma.com",
                    created_date: "2025-01-03T17:00:00Z",
                    is_read: false
                }
            ];
            setMessages(mockMessages);
        } catch (error) {
            console.error("Error loading messages:", error);
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
            const newMsg = {
                id: Date.now().toString(),
                content: newMessage.trim(),
                sender_email: user?.email || "seeker@example.com",
                created_date: new Date().toISOString(),
                is_read: false
            };

            setMessages(prev => [...prev, newMsg]);
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
    };

    const handleSupportContact = () => {
        // Create a support conversation
        const supportConversation = {
            id: "support",
            employer_name: "צוות התמיכה",
            employer_email: "support@metch.com",
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
                sender_email: "support@metch.com",
                created_date: new Date().toISOString(),
                is_read: true
            }
        ]);
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
                                    <ChevronLeft className="w-6 h-6 text-gray-800 rotate-180" />
                                </button>
                            </div>

                            {/* Chat Header */}
                            <div className="text-center py-4 -mt-6 relative z-10">
                                <h1 className="text-2xl md:text-3xl font-bold text-gray-900">הודעות</h1>
                                <p className="text-gray-600 mt-1">{selectedConversation.employer_name} - {selectedConversation.job_title}</p>
                            </div>

                            {/* Messages Area */}
                            <div className="flex-1 p-6 overflow-y-auto space-y-4">
                                <AnimatePresence>
                                    {messages.map((message, index) => {
                                        const isMyMessage = message.sender_email === user?.email || message.sender_email === "seeker@example.com";
                                        return (
                                            <motion.div
                                                key={message.id}
                                                initial={{ opacity: 0, y: 20 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ duration: 0.3, delay: index * 0.1 }}
                                                className={`flex ${isMyMessage ? 'justify-end' : 'justify-start'}`}
                                            >
                                                <div className={`max-w-xs lg:max-w-md px-6 py-3 rounded-2xl ${
                                                    isMyMessage 
                                                        ? 'bg-blue-600 text-white' 
                                                        : 'bg-gray-100 text-gray-900'
                                                }`}>
                                                    <p className="text-base">{message.content}</p>
                                                    <div className={`flex items-center justify-end gap-1 mt-2 text-xs ${
                                                        isMyMessage ? 'text-blue-100' : 'text-gray-500'
                                                    }`}>
                                                        <span>{format(new Date(message.created_date), "HH:mm")}</span>
                                                        {isMyMessage && (
                                                            <CheckCheck className="w-3 h-3" />
                                                        )}
                                                    </div>
                                                </div>
                                            </motion.div>
                                        );
                                    })}
                                </AnimatePresence>

                                {/* Typing indicator for support */}
                                {selectedConversation.is_support && (
                                    <div className="flex justify-start">
                                        <div className="bg-gray-100 px-4 py-3 rounded-2xl">
                                            <div className="flex gap-1">
                                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                                            </div>
                                            <div className="text-xs text-gray-500 mt-1 text-right">הקלד/ת...</div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Message Input */}
                            <div className="border-t border-gray-200 p-6">
                                <form onSubmit={sendMessage} className="flex gap-3 items-center">
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
                            <Search className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                            <Input
                                placeholder="חיפוש בהודעות"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pr-12 pl-4 py-3 border-gray-300 focus:border-blue-400 rounded-full h-12 text-right"
                                dir="rtl"
                            />
                        </div>

                        {/* Support Contact Button */}
                        <div className="mb-6">
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

                        {/* Conversations List */}
                        <div className="space-y-4 mb-8">
                            {paginatedConversations.map((conversation, index) => (
                                <motion.div
                                    key={conversation.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.3, delay: index * 0.1 }}
                                    className="flex items-center justify-between p-4 hover:bg-gray-50/80 rounded-xl cursor-pointer transition-colors border border-gray-100"
                                    onClick={() => handleConversationSelect(conversation)}
                                >
                                    <div className="flex items-center gap-4">
                                        <span className="text-gray-500 text-sm whitespace-nowrap">
                                            {format(new Date(conversation.last_message_time), "dd.MM.yy")}
                                        </span>
                                        <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-gray-200 bg-white flex items-center justify-center">
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
                                            <span className="font-medium text-gray-800 block">{conversation.employer_name}</span>
                                            <span className="text-sm text-gray-500">{conversation.job_title}</span>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>

                        {/* Pagination */}
                        <div className="flex justify-center items-center pt-4">
                            <Button 
                                variant="ghost" 
                                size="icon" 
                                onClick={() => goToPage(currentPage + 1)} 
                                disabled={currentPage === totalPages}
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
                                onClick={() => goToPage(currentPage - 1)} 
                                disabled={currentPage === 1}
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