
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
  Twitter } from
"lucide-react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function Contact() {
  const [chatLoading, setChatLoading] = useState(false);

  const handleWhatsAppContact = () => {
    // WhatsApp business number - replace with actual number
    const whatsappNumber = "+972501234567"; // Replace with actual business WhatsApp number
    const message = encodeURIComponent("שלום! אני מעוניין/ת לקבל תמיכה בשירותי Metch");
    const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${message}`;
    window.open(whatsappUrl, '_blank');
  };

  const handleEmailContact = () => {
    const email = "metch@gmail.com";
    const subject = encodeURIComponent("פניה לתמיכה - Metch");
    const body = encodeURIComponent("שלום,\n\nאני מעוניין/ת לקבל תמיכה בנושא הבא:\n\n");
    const emailUrl = `mailto:${email}?subject=${subject}&body=${body}`;
    window.location.href = emailUrl;
  };

  const handleSupportChat = () => {
    setChatLoading(true);
    // Simulate loading for chat system
    setTimeout(() => {
      setChatLoading(false);
      // This would typically open a support chat widget
      // For now, we'll redirect to WhatsApp as fallback
      handleWhatsAppContact();
    }, 1000);
  };

  const socialLinks = [
  {
    name: "Facebook",
    icon: Facebook,
    url: "https://facebook.com/metch",
    color: "text-blue-600 hover:text-blue-700"
  },
  {
    name: "Instagram",
    icon: Instagram,
    url: "https://instagram.com/metch",
    color: "text-pink-600 hover:text-pink-700"
  },
  {
    name: "LinkedIn",
    icon: Linkedin,
    url: "https://linkedin.com/company/metch",
    color: "text-blue-700 hover:text-blue-800"
  },
  {
    name: "Twitter",
    icon: Twitter,
    url: "https://twitter.com/metch",
    color: "text-blue-500 hover:text-blue-600"
  }];


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
                }} />

              <Link
                to={createPageUrl("Dashboard")}
                className="absolute top-4 right-6 w-10 h-10 bg-white/30 rounded-full flex items-center justify-center backdrop-blur-sm hover:bg-white/50 transition-colors z-10">

                <ChevronLeft className="w-6 h-6 text-gray-800 rotate-180" />
              </Link>
            </div>

            <CardContent className="p-4 sm:p-6 md:p-8 -mt-6 relative z-10">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="text-center space-y-8">

                {/* Title */}
                <div className="mb-12">
                  <h1 className="text-2xl md:text-3xl font-bold text-gray-900">יצירת קשר</h1>
                </div>

                {/* Main Action Buttons */}
                <div className="flex flex-col gap-4 max-w-md mx-auto mb-12">
                  <Button
                    onClick={handleEmailContact}
                    className="w-full h-14 bg-blue-600 hover:bg-blue-700 text-white text-lg font-bold rounded-full shadow-lg transition-all duration-300 hover:shadow-xl">

                    <Mail className="w-5 h-5 ml-2" />
                    שליחת מייל
                  </Button>
                  
                  <Button
                    onClick={handleSupportChat}
                    disabled={chatLoading}
                    className="w-full h-14 bg-blue-600 hover:bg-blue-700 text-white text-lg font-bold rounded-full shadow-lg transition-all duration-300 hover:shadow-xl disabled:opacity-70">

                    <MessageCircle className="w-5 h-5 ml-2" />
                    {chatLoading ? 'מתחבר...' : 'התחל צ\'אט'}
                  </Button>
                </div>

                {/* Social Media Section */}
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold text-gray-800">עקבו אחרינו ברשתות</h3>
                  
                  <div className="flex justify-center gap-6">
                    {socialLinks.map((social, index) =>
                    <motion.a
                      key={social.name}
                      href={social.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      initial={{ opacity: 0, scale: 0.5 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.3, delay: index * 0.1 }}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                      className={`w-12 h-12 rounded-full border-2 border-gray-300 flex items-center justify-center transition-all duration-300 hover:border-current ${social.color}`}>

                        <social.icon className="w-6 h-6" />
                      </motion.a>
                    )}
                  </div>
                </div>

                {/* Email Contact */}
                <div className="pt-8">
                  <a
                    href="mailto:metch@gmail.com"
                    className="text-blue-600 hover:text-blue-700 font-medium text-lg transition-colors underline">

                    metch@gmail.com
                  </a>
                </div>

                {/* Additional Help Section */}
                <div className="bg-gray-50/80 rounded-2xl p-6 mt-8 hidden">
                  <h4 className="font-bold text-lg mb-3 text-gray-900">זקוק לעזרה?</h4>
                  <p className="text-gray-600 mb-4">
                    הצוות שלנו זמין לעזור לך בכל שאלה או בעיה. 
                    בחר את אמצעי התקשורת הנוח לך ביותר.
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                    <div>
                      <strong className="text-gray-800">שעות פעילות:</strong>
                      <br />
                      ראשון-חמישי: 09:00-18:00
                      <br />
                      ששי: 09:00-14:00
                    </div>
                    <div>
                      <strong className="text-gray-800">זמן תגובה:</strong>
                      <br />
                      מייל: עד 24 שעות
                      <br />
                      צ'אט: תגובה מיידית
                    </div>
                  </div>
                </div>

                {/* Quick FAQ */}
                <div className="text-right space-y-3 max-w-2xl mx-auto">
                  <h4 className="font-bold text-lg text-gray-900 text-center mb-4">שאלות נפוצות</h4>
                  
                  <div className="space-y-2 text-sm text-gray-600">
                    <div className="bg-white p-3 rounded-lg border border-gray-100">
                      <strong className="text-gray-800">איך אני מפרסם משרה?</strong>
                      <p>לחץ על "פרסום משרה חדשה" בדף הבית ועקוב אחר השלבים.</p>
                    </div>
                    
                    <div className="bg-white p-3 rounded-lg border border-gray-100">
                      <strong className="text-gray-800">כמה עולה פרסום משרה?</strong>
                      <p>צור איתנו קשר לקבלת מידע מפורט על התעריפים שלנו.</p>
                    </div>
                    
                    <div className="bg-white p-3 rounded-lg border border-gray-100">
                      <strong className="text-gray-800">איך אני רואה את המועמדים?</strong>
                      <p>כל המועמדים מופיעים בדף "ניהול משרות" תחת המשרה הרלוונטית.</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            </CardContent>
          </div>
        </Card>
      </div>
    </div>);

}
