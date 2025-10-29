import React, { useState, useEffect } from "react";
import { User } from "@/api/entities";
import { Conversation } from "@/api/entities";
import { Message } from "@/api/entities";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { AnimatePresence } from "framer-motion";
import ConversationStatusIndicator from "@/components/conversations/ConversationStatusIndicator";
import ChatHeader from "@/components/messages/ChatHeader";
import MessageItem from "@/components/messages/MessageItem";
import MessageInput from "@/components/messages/MessageInput";
import ConversationList from "@/components/messages/ConversationList";
import Pagination from "@/components/messages/Pagination";

const ITEMS_PER_PAGE = 4;

export default function Messages() {
    const [user, setUser] = useState(null);
    const [conversations, setConversations] = useState([]);
    const [selectedConversation, setSelectedConversation] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState("");
    const [sendingMessage, setSendingMessage] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);

    const totalPages = Math.ceil(conversations.length / ITEMS_PER_PAGE);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const userData = await User.me();
            setUser(userData);

            if (userData) {
                const convs = await Conversation.filter({ employer_email: userData.email });
                setConversations(convs);
            }
        } catch (error) {
            console.error("Error loading data:", error);
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
        if (!newMessage.trim()) return;

        setSendingMessage(true);
        try {
            const newMsg = await Message.create({
                conversation_id: selectedConversation.id,
                sender_email: user.email,
                content: newMessage.trim(),
            });

            setMessages(prev => [...prev, newMsg]);
            setNewMessage("");
        } catch (error) {
            console.error("Error sending message:", error);
        } finally {
            setSendingMessage(false);
        }
    };

    const selectConversation = async (conversation) => {
        setSelectedConversation(conversation);
        const msgs = await Message.filter({ conversation_id: conversation.id });
        setMessages(msgs);
    };

    if (selectedConversation) {
        return (
            <div className="p-4 md:p-6" dir="rtl">
                <div className="w-[85vw] mx-auto">
                    <Card className="bg-white rounded-2xl md:rounded-[2.5rem] shadow-xl border border-gray-100 overflow-hidden h-[80vh]">
                        <div className="relative h-full flex flex-col">
                            <ChatHeader
                                setSelectedConversation={setSelectedConversation}
                                selectedConversation={selectedConversation}
                                ConversationStatusIndicator={ConversationStatusIndicator}
                            />
                            <div className="flex-1 p-6 overflow-y-auto space-y-4">
                                {selectedConversation.job_status && ['filled', 'filled_via_metch', 'closed'].includes(selectedConversation.job_status) && (
                                    <div className="bg-gray-100 rounded-lg p-4 text-center">
                                        <p className="text-sm text-gray-600">
                                            {selectedConversation.job_status === 'filled' && "המשרה הזו כבר אוישה"}
                                            {selectedConversation.job_status === 'filled_via_metch' && "המשרה הזו אוישה דרך המערכת"}
                                            {selectedConversation.job_status === 'closed' && "המשרה הזו נסגרה על ידי המעסיק"}
                                        </p>
                                    </div>
                                )}

                                <AnimatePresence>
                                    {messages.map((message, index) => (
                                        <MessageItem
                                            key={message.id}
                                            message={message}
                                            index={index}
                                            user={user}
                                        />
                                    ))}
                                </AnimatePresence>

                                <div className="flex justify-end">
                                    <div className="bg-gray-100 px-4 py-3 rounded-2xl">
                                        <div className="flex gap-1">
                                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                                        </div>
                                        <div className="text-xs text-gray-500 mt-1 text-right">הקלד/ת...</div>
                                    </div>
                                </div>
                            </div>
                            <MessageInput
                                newMessage={newMessage}
                                setNewMessage={setNewMessage}
                                sendMessage={sendMessage}
                                sendingMessage={sendingMessage}
                                selectedConversation={selectedConversation}
                            />
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

                        <ConversationList
                            conversations={paginatedConversations}
                            selectConversation={selectConversation}
                        />

                        <Pagination
                            currentPage={currentPage}
                            totalPages={totalPages}
                            goToPage={goToPage}
                            pageNumbers={pageNumbers}
                        />
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
