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
  Twitter
} from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function Contact() {
  const [chatLoading, setChatLoading] = useState(false);

  const handleSupportChat = () => {
    setChatLoading(true);
    setTimeout(() => {
      setChatLoading(false);
      const whatsappNumber = "+972501234567";
      const message = encodeURIComponent("שלום! אני זקוק/ה לתמיכה מצוות Metch");
      const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${message}`;
      window.open(whatsappUrl, '_blank');
    }, 1000);
  };

  const handleEmailContact = () => {
    const email = "metch@gmail.com";
    const subject = encodeURIComponent("פניה לתמיכה - Metch");
    const body = encodeURIComponent("שלום,\n\nאני מעוניין/ת לקבל תמיכה בנושא הבא:\n\n");
    const emailUrl = `mailto:${email}?subject=${subject}&body=${body}`;
    window.location.href = emailUrl;
  };

  return (
    <div className="p-4 md:p-6" dir="rtl">
      <div className="w-[85vw] mx-auto">
        <Card className="bg-white rounded-2xl md:rounded-[2.5rem] shadow-xl border border-gray-100 overflow-hidden">
          <div className="relative">
            {/* Header with curved background */}
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
              <Link
                to={createPageUrl("Dashboard")}
                className="absolute top-4 right-6 w-10 h-10 bg-white/30 rounded-full flex items-center justify-center backdrop-blur-sm hover:bg-white/50 transition-colors z-10"
              >
                <ChevronLeft className="w-6 h-6 text-gray-800 rotate-180" />
              </Link>
            </div>

            <CardContent className="p-4 sm:p-6 md:p-8 -mt-6 relative z-10">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="flex flex-col items-center justify-center text-center space-y-10 py-12"
              >
                {/* Title */}
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900">יצירת קשר</h1>

                {/* Action Buttons */}
                <div className="flex flex-col gap-4 w-full max-w-sm">
                  <Button
                    onClick={handleEmailContact}
                    className="bg-[#3B82F6] hover:bg-[#2563EB] text-white px-8 py-3 rounded-full font-bold h-14 text-lg"
                  >
                    <Mail className="w-5 h-5 ml-2" />
                    שלח מייל
                  </Button>
                  <Button
                    onClick={handleSupportChat}
                    disabled={chatLoading}
                    className="bg-[#3B82F6] hover:bg-[#2563EB] text-white px-8 py-3 rounded-full font-bold h-14 text-lg"
                  >
                    {chatLoading ? 'מתחבר...' : (
                      <>
                        <MessageCircle className="w-5 h-5 ml-2" />
                        התחל צ'אט
                      </>
                    )}
                  </Button>
                </div>

                {/* Social Media Links */}
                <div className="space-y-4">
                    <p className="text-gray-600 font-medium">עקבו אחרינו ברשתות</p>
                    <div className="flex items-center gap-4">
                        <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="w-12 h-12 flex items-center justify-center bg-white border border-gray-300 rounded-full hover:bg-gray-100 transition-colors"><Facebook className="w-6 h-6 text-blue-600" /></a>
                        <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="w-12 h-12 flex items-center justify-center bg-white border border-gray-300 rounded-full hover:bg-gray-100 transition-colors"><Instagram className="w-6 h-6 text-pink-600" /></a>
                        <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="w-12 h-12 flex items-center justify-center bg-white border border-gray-300 rounded-full hover:bg-gray-100 transition-colors"><Linkedin className="w-6 h-6 text-sky-700" /></a>
                        <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="w-12 h-12 flex items-center justify-center bg-white border border-gray-300 rounded-full hover:bg-gray-100 transition-colors"><Twitter className="w-6 h-6 text-sky-500" /></a>
                    </div>
                </div>

                {/* Email Display */}
                <p className="text-gray-700 font-semibold pt-6">metch@gmail.com</p>
              </motion.div>
            </CardContent>
          </div>
        </Card>
      </div>
    </div>
  );
}