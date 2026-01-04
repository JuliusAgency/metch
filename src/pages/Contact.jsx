import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ChevronLeft,
  Mail,
  MessageCircle,
  Facebook,
  Instagram,
  Linkedin
} from "lucide-react";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { useRequireUserType } from "@/hooks/use-require-user-type";
import settingsHeaderBg from "@/assets/settings_header_bg.png";



export default function Contact() {
  const navigate = useNavigate();
  const { user } = useRequireUserType(); // Ensure user has selected a user type
  const supportEmail = user?.user_type === "employer" ? "business@metch.co.il" : "support@metch.co.il";
  const [chatLoading, setChatLoading] = useState(false);

  const handleSupportChat = () => {
    setChatLoading(true);
    setTimeout(() => {
      setChatLoading(false);
      const chatPage =
        user?.user_type === "job_seeker" ? "MessagesSeeker" : "Messages";
      navigate(createPageUrl(chatPage), {
        state: { supportChat: true }
      });
    }, 1000);
  };

  const handleEmailContact = () => {
    const subject = encodeURIComponent("פניה לתמיכה - Metch");
    const body = encodeURIComponent("שלום,\n\nאני מעוניין/ת לקבל תמיכה בנושא הבא:\n\n");
    const emailUrl = `mailto:${supportEmail}?subject=${subject}&body=${body}`;
    window.location.href = emailUrl;
  };

  return (
    <div className="w-full mx-auto" dir="rtl">
      <div className="relative rounded-2xl overflow-hidden mb-6">
        {/* Header with curved background */}
        <div className="relative h-20 overflow-hidden -m-px">
          <div
            className="absolute inset-0 w-full h-full"
            style={{
              backgroundImage: `url(${settingsHeaderBg})`,
              backgroundSize: '100% 100%',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat'
            }}
          />
          <Link
            to={createPageUrl("Dashboard")}
            className="absolute top-4 right-6 w-8 h-8 bg-white/30 rounded-full flex items-center justify-center backdrop-blur-sm hover:bg-white/50 transition-colors z-10"
          >
            <ChevronLeft className="w-5 h-5 text-gray-800 rotate-180" />
          </Link>
        </div>

        <div className="p-4 sm:p-6 md:p-8 -mt-6 relative z-10 bg-white/0">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="flex flex-col items-center justify-center text-center space-y-8 py-4"
          >
            {/* Title */}
            <h1 className="text-xl md:text-2xl font-bold text-gray-900">יצירת קשר</h1>

            {/* Action Buttons */}
            <div className="flex flex-col gap-3 w-full max-w-xs">
              <Button
                onClick={handleEmailContact}
                className="bg-[#3B82F6] hover:bg-[#2563EB] text-white px-6 py-2 rounded-full font-bold h-12 text-base"
              >
                <Mail className="w-4 h-4 ml-2" />
                שלח מייל
              </Button>
              <Button
                onClick={handleSupportChat}
                disabled={chatLoading}
                className="bg-[#3B82F6] hover:bg-[#2563EB] text-white px-6 py-2 rounded-full font-bold h-12 text-base"
              >
                {chatLoading ? 'מתחבר...' : (
                  <>
                    <MessageCircle className="w-4 h-4 ml-2" />
                    התחל צ'אט
                  </>
                )}
              </Button>
            </div>

            {/* Social Media Links */}
            <div className="space-y-4">
              <p className="text-gray-600 font-medium">עקבו אחרינו ברשתות</p>
              <div className="flex items-center gap-4" dir="ltr">
                <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="w-12 h-12 flex items-center justify-center bg-white border border-[#3B82F6] rounded-full hover:bg-blue-50 transition-colors"><Facebook className="w-6 h-6 text-[#3B82F6]" /></a>
                <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="w-12 h-12 flex items-center justify-center bg-white border border-[#3B82F6] rounded-full hover:bg-blue-50 transition-colors"><Instagram className="w-6 h-6 text-[#3B82F6]" /></a>
                <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="w-12 h-12 flex items-center justify-center bg-white border border-[#3B82F6] rounded-full hover:bg-blue-50 transition-colors"><Linkedin className="w-6 h-6 text-[#3B82F6]" /></a>
                <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="w-12 h-12 flex items-center justify-center bg-white border border-[#3B82F6] rounded-full hover:bg-blue-50 transition-colors">
                  <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-[#3B82F6]">
                    <path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z" />
                  </svg>
                </a>
              </div>
            </div>

            {/* Email Display */}
            <p className="text-gray-700 font-semibold pt-6">{supportEmail}</p>

            {/* Legal Links */}
            <div className="flex items-center gap-4 text-sm text-gray-500 mt-2">
              <a href="https://metch.co.il/%d7%9e%d7%93%d7%99%d7%a0%d7%99%d7%95%d7%aa-%d7%94%d7%a4%d7%a8%d7%98%d7%99%d7%95%d7%aa/" target="_blank" rel="noopener noreferrer" className="hover:text-blue-600 transition-colors underline md:no-underline">
                מדיניות פרטיות
              </a>
              <span className="text-gray-300">•</span>
              <a href="https://metch.co.il/%d7%aa%d7%a0%d7%90%d7%99-%d7%a9%d7%99%d7%9e%d7%95%d7%a9/" target="_blank" rel="noopener noreferrer" className="hover:text-blue-600 transition-colors underline md:no-underline">
                תנאי שימוש
              </a>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
