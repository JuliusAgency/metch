import React, { useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
    User,
    Settings,
    Bell,
    MessageSquareText,
    Home,
    Headphones,
    CreditCard,
    Briefcase,
    BarChart2,
    HelpCircle,
    FileText,
    Sparkles
} from "lucide-react";
import { createPageUrl } from "@/utils";
import { User as UserEntity, Message } from "@/api/entities";

const NavItem = ({ icon: Icon, text, to, isActive, isLast, badge }) => {
    const [isHovered, setIsHovered] = useState(false);

    // Determine open state: Active OR Hovered
    const isOpen = isActive || isHovered;

    return (
        <div className="flex items-center" dir="rtl">
            <Link
                to={to}
                className={`flex items-center relative py-2 outline-none transition-colors duration-200 group no-underline`}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
            >
                <div className="flex items-center px-2">
                    {/* Icon Section */}
                    <div className="relative z-10 flex items-center justify-center">
                        <Icon
                            className={`w-6 h-6 transition-colors duration-200 ${isActive ? "text-gray-900" : "text-gray-500 group-hover:text-gray-800"}`}
                            strokeWidth={1.5} // Thin stroke as requested
                        />
                        {!isActive && badge > 0 && (
                            <div className="absolute -top-1 -right-1 min-w-[16px] h-4 bg-blue-600 text-[10px] text-white flex items-center justify-center rounded-full px-1 z-20 shadow-sm border border-white">
                                {badge > 99 ? "99+" : badge}
                            </div>
                        )}
                    </div>

                    {/* Text Reveal Section */}
                    <motion.div
                        initial={false}
                        animate={{ width: isOpen ? "auto" : 0, opacity: isOpen ? 1 : 0 }}
                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                        className="overflow-hidden whitespace-nowrap"
                    >
                        <span className={`text-base font-normal mr-2 ${isActive ? "text-gray-900" : "text-gray-600 group-hover:text-gray-800"}`}>
                            {text}
                        </span>
                    </motion.div>
                </div>
            </Link>

            {/* Vertical Divider (unless it's the last item) */}
            {!isLast && (
                <div className="h-5 w-px bg-gray-200 mx-1" />
            )}
        </div>
    );
};

export default function Navbar({ currentPageName, isJobSeeker }) {
    const [unreadCount, setUnreadCount] = useState(0);

    useEffect(() => {
        const fetchUnread = async () => {
            try {
                const user = await UserEntity.me();
                if (user) {
                    // Fetch by email first (as IDs might be missing in some created messages)
                    const messagesByEmail = await Message.filter({
                        recipient_email: user.email
                    }, "-created_date", 200);

                    // Fetch by ID as well to coverage all bases
                    const messagesById = await Message.filter({
                        recipient_id: user.id
                    }, "-created_date", 200);

                    // Combine and deduplicate by ID
                    const allMessages = [...messagesByEmail, ...messagesById];
                    const uniqueMessages = Array.from(new Map(allMessages.map(item => [item.id, item])).values());

                    // Filter for unread in memory to avoid backend boolean parsing issues
                    const unread = uniqueMessages.filter(m => m.is_read === false || m.is_read === "false" || m.is_read === 0);

                    setUnreadCount(unread.length);
                }
            } catch (e) {
                console.error("Error fetching unread count", e);
            }
        };

        fetchUnread();
        const interval = setInterval(fetchUnread, 5000);
        return () => clearInterval(interval);
    }, []);

    let navLinks = [];

    if (isJobSeeker) {
        navLinks = [
            // 1. Home
            { page: "Dashboard", icon: Home, text: "דף הבית" },
            // 2. Personal Details (User Icon)
            { page: "Settings", icon: User, text: "פרטים אישיים" },
            // 3. CV (Briefcase/FileText? User used FileText recently, but requested Briefcase in prompt? Sticking to FileText/Previous logic if "Don't change if okay")
            { page: "Profile", icon: FileText, text: "קו״ח" },
            // 4. Insights
            { page: "Insights", icon: Sparkles, text: "תובנות" },
            // 5. Notifications (Bell) - Added based on request tickbox, though strictly speaking layout had it? No, layout had it for Employer. Adding for Seeker as per icons request.
            // Wait, Layout.jsx didn't have Notifications for seeker. Prompt checklist asks for Bell -> Notifications. I will add it.
            { page: "Notifications", icon: Bell, text: "התראות" },
            // 6. Messages
            { page: "MessagesSeeker", icon: MessageSquareText, text: "הודעות", badge: unreadCount },
            // 7. FAQ 
            { page: "FAQ", icon: HelpCircle, text: "שאלות נפוצות" },
            // 8. Contact
            { page: "Contact", icon: Headphones, text: "יצירת קשר" }
        ];
    } else {
        // Employer
        navLinks = [
            { page: "Dashboard", icon: Home, text: "דף הבית" },
            { page: "JobManagement", icon: Briefcase, text: "משרות" },
            { page: "Statistics", icon: BarChart2, text: "סטטיסטיקות" },
            { page: "Notifications", icon: Bell, text: "התראות" },
            { page: "Payments", icon: CreditCard, text: "תשלומים" },
            { page: "Settings", icon: Settings, text: "הגדרות" },
            { page: "Messages", icon: MessageSquareText, text: "הודעות", badge: unreadCount },
            { page: "FAQ", icon: HelpCircle, text: "שאלות נפוצות" },
            { page: "Contact", icon: Headphones, text: "צור קשר" }
        ];
    }

    return (
        /* Desktop Navbar Wrapper */
        /* Pill shape, backdrop blur, shadow - matching Figma description */
        <nav className="hidden md:block pt-[14px] sticky top-0 z-50 pointer-events-none">
            <div className="pointer-events-auto w-max max-w-[90vw] mx-auto rounded-full shadow-sm border border-white/50 bg-white/20 backdrop-blur-md px-6 py-2.5 flex items-center justify-between gap-8" dir="rtl">

                {/* Logo Section */}
                <div className="flex items-center gap-2 select-none">
                    <h1 className="text-gray-800 text-xl font-normal metch-logo-font tracking-wide">Metch</h1>
                    <img
                        src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/689c85a409a96fa6a10f1aca/4654a1b94_image.png"
                        alt="Metch Logo"
                        className="h-5 opacity-90"
                    />
                </div>

                {/* Navigation Items */}
                <div className="flex items-center flex-row-reverse">
                    {navLinks.map((link, index) => {
                        // Active Logic
                        const isActive =
                            (currentPageName === link.page) ||
                            (link.page === "Profile" && currentPageName === "Profile") || // Add more specific sub-path logic if needed
                            (link.page === "MessagesSeeker" && currentPageName === "MessagesSeeker") ||
                            (link.page === "Messages" && currentPageName === "Messages");

                        return (
                            <NavItem
                                key={link.page}
                                icon={link.icon}
                                text={link.text}
                                to={createPageUrl(link.page)}
                                isActive={isActive}
                                badge={link.badge}
                                isLast={index === navLinks.length - 1} // Right-to-Left: last index is leftmost visually? No, flex-row-reverse makes first index rightmost. 
                            // Wait, simple flex row is better for logical RTL.
                            // If parent has dir="rtl", flex-row means First Item is Rightmost.
                            // So index 0 is Rightmost.
                            />
                        );
                    })}
                </div>

            </div>
        </nav>
    );
}
