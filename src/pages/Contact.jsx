import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ChevronLeft,
  Mail,
  MessageCircle,
  Facebook,
  Instagram,
  Linkedin,
  Youtube
} from "lucide-react";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { useRequireUserType } from "@/hooks/use-require-user-type";
import settingsHeaderBg from "@/assets/settings_header_bg.png";
import settingsMobileBg from "@/assets/settings_mobile_bg.jpg";
import paymentsMobileBg from "@/assets/payment_mobile_header.png";



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

        {/* Mobile-Only Background Images */}
        {user?.user_type === 'job_seeker' ? (
          <div
            className="md:hidden fixed top-0 left-0 right-0 pointer-events-none"
            style={{
              width: '100%',
              height: '280px',
              backgroundImage: `url(${settingsMobileBg})`,
              backgroundSize: '100% 100%',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat',
              zIndex: 0
            }}
          />
        ) : (
          <div
            className="md:hidden fixed top-0 left-0 right-0 h-[210px] z-0 pointer-events-none"
            style={{
              backgroundImage: `url(${paymentsMobileBg})`,
              backgroundSize: 'cover',
              backgroundPosition: 'top center',
              backgroundRepeat: 'no-repeat',
              zIndex: 0
            }}
          />
        )}

        {/* Desktop Header - Hidden for Mobile */}
        <div className={`relative h-20 overflow-hidden -m-px hidden md:block`}>
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

        {/* Mobile Job Seeker Custom Header */}
        {user?.user_type === 'job_seeker' && (
          <div className="md:hidden flex items-center px-6 pt-10 pb-4 relative z-10 w-full justify-center">
            <Link to={createPageUrl("Dashboard")} className="absolute right-6 w-10 h-10 bg-white/50 rounded-full flex items-center justify-center shadow-sm backdrop-blur-sm">
              <ChevronLeft className="w-6 h-6 text-gray-800 rotate-180" />
            </Link>
          </div>
        )}

        <div className={`relative z-10 ${user?.user_type === 'job_seeker' ? 'mt-4 px-0 md:p-8 md:-mt-6' : 'px-4 sm:p-6 md:p-8 mt-32 md:-mt-6'}`}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className={`${user?.user_type === 'employer' || user?.user_type === 'job_seeker' ? 'space-y-4' : 'space-y-8'} flex flex-col items-center ${user?.user_type === 'job_seeker' ? 'justify-start' : 'justify-center'} text-center ${user?.user_type === 'job_seeker'
              ? 'bg-white md:bg-transparent [border-top-left-radius:50%_40px] md:rounded-none [border-top-right-radius:50%_40px] min-h-[60vh] md:min-h-0 pt-16 md:pt-4 px-6 md:px-0 shadow-[0_0_20px_rgba(0,0,0,0.1)] md:shadow-none'
              : 'bg-white rounded-[24px] shadow-2xl pt-6 px-4 pb-24 mt-0 md:mt-0 md:bg-transparent md:shadow-none md:rounded-none md:p-0'}`}
          >
            {/* Title */}
            <h1 className={`text-[24px] md:text-2xl font-bold absolute top-[-65px] left-0 right-0 md:relative md:top-0 ${user?.user_type === 'employer' ? 'text-[#001a6e]' : 'text-gray-900'} md:text-gray-900`}>יצירת קשר</h1>

            <div className={`${user?.user_type === 'job_seeker' ? 'mt-0 md:mt-0 flex flex-col items-center space-y-8 w-full' : 'contents'}`}>
              {/* Action Buttons */}
              <div className={`flex flex-col gap-3 w-full max-w-xs ${user?.user_type === 'job_seeker' ? 'mt-[-20px] md:mt-0' : ''}`}>
                <Button
                  onClick={handleEmailContact}
                  className="bg-[#3B82F6] hover:bg-[#2563EB] text-white px-6 py-2 rounded-full font-bold h-12 text-base"
                >
                  <Mail className="w-4 h-4 ml-2" />
                  שליחת מייל
                </Button>
                <Button
                  onClick={handleSupportChat}
                  disabled={chatLoading}
                  className="bg-[#3B82F6] hover:bg-[#2563EB] text-white px-6 py-2 rounded-full font-bold h-12 text-base"
                >
                  {chatLoading ? 'מתחבר...' : (
                    <>
                      <MessageCircle className="w-4 h-4 ml-2" />
                      התחלת צ'אט
                    </>
                  )}
                </Button>
              </div>

              {/* Social Media Links */}
              <div className="space-y-4">
                <p className="text-gray-600 font-medium">עקבו אחרינו ברשתות</p>
                <div className="flex items-center gap-4" dir="ltr">
                  <a href="https://www.facebook.com/metchjobs" target="_blank" rel="noopener noreferrer" className="w-12 h-12 flex items-center justify-center bg-white border border-[#3B82F6] rounded-full hover:bg-blue-50 transition-colors"><Facebook className="w-6 h-6 text-[#3B82F6]" /></a>
                  <a href="https://www.instagram.com/metchofficial/" target="_blank" rel="noopener noreferrer" className="w-12 h-12 flex items-center justify-center bg-white border border-[#3B82F6] rounded-full hover:bg-blue-50 transition-colors"><Instagram className="w-6 h-6 text-[#3B82F6]" /></a>
                  <a href="https://www.linkedin.com/company/metch-%D7%9E%D7%90%D7%A6%D7%B3" target="_blank" rel="noopener noreferrer" className="w-12 h-12 flex items-center justify-center bg-white border border-[#3B82F6] rounded-full hover:bg-blue-50 transition-colors"><Linkedin className="w-6 h-6 text-[#3B82F6]" /></a>
                  <a href="https://www.tiktok.com/@metchofficial?_r=1&_t=ZS-93Awd5fSaua" target="_blank" rel="noopener noreferrer" className="w-12 h-12 flex items-center justify-center bg-white border border-[#3B82F6] rounded-full hover:bg-blue-50 transition-colors">
                    <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 text-[#3B82F6]">
                      <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.17-2.86-.6-4.12-1.31a8.134 8.134 0 0 1-1.88-1.42v6.24a8.13 8.13 0 0 1-2.43 5.75c-1.57 1.56-3.73 2.4-5.96 2.4-2.22 0-4.39-.84-5.94-2.4-1.55-1.55-2.39-3.71-2.39-5.93 0-2.22.84-4.38 2.4-5.93 1.55-1.55 3.72-2.39 5.94-2.39.45 0 .9.02 1.35.08v4.07c-.45-.07-.9-.09-1.35-.08-1.11.02-2.19.46-2.97 1.24s-1.21 1.88-1.21 3c0 1.12.44 2.21 1.22 2.99s1.88 1.22 3 1.22c1.13 0 2.21-.44 2.99-1.22s1.22-1.87 1.22-3V.02z" />
                    </svg>
                  </a>
                  <a href="https://www.youtube.com/@metch_official" target="_blank" rel="noopener noreferrer" className="w-12 h-12 flex items-center justify-center bg-white border border-[#3B82F6] rounded-full hover:bg-blue-50 transition-colors">
                    <Youtube className="w-6 h-6 text-[#3B82F6]" />
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
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
