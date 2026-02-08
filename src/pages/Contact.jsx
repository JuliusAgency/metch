import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { SendEmail } from "@/api/integrations";
import { Message, Conversation, Notification } from "@/api/entities";
import {
  ChevronLeft,
  Mail,
  MessageCircle,
  Facebook,
  Instagram,
  Linkedin,
  Youtube,
  Send,
  X
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { useRequireUserType } from "@/hooks/use-require-user-type";
import settingsHeaderBg from "@/assets/settings_header_bg.png";
import settingsMobileBg from "@/assets/settings_mobile_bg.jpg";
import paymentsMobileBg from "@/assets/payment_mobile_header.png";



export default function Contact() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useRequireUserType(); // Ensure user has selected a user type
  const supportEmail = user?.user_type === "employer" ? "business@metch.co.il" : "support@metch.co.il";
  const [chatLoading, setChatLoading] = useState(false);
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [formData, setFormData] = useState({
    subject: "",
    message: ""
  });

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
    setShowEmailForm(true);
  };

  const handleSendEmail = async (e) => {
    e.preventDefault();
    if (!formData.subject || !formData.message) {
      toast({
        title: "חסרים פרטים",
        description: "אנא מלאו את נושא ההודעה ואת התוכן.",
        variant: "destructive"
      });
      return;
    }

    setIsSending(true);
    let emailSuccess = false;
    let chatSuccess = false;

    // 1. Try sending email
    try {
      const userDetails = `
        <br/><br/>
        ---<br/>
        <b>פרטי שולח:</b><br/>
        שם: ${user?.full_name || user?.company_name || 'לא צוין'}<br/>
        מייל: ${user?.email || 'לא צוין'}<br/>
        סוג משתמש: ${user?.user_type === 'employer' ? 'מעסיק' : 'מחפש עבודה'}<br/>
      `;

      await SendEmail({
        to: supportEmail,
        subject: `פנייה חדשה מהאתר: ${formData.subject}`,
        html: `<div dir="rtl" style="text-align: right;">${formData.message.replace(/\n/g, '<br/>')}${userDetails}</div>`,
        text: `${formData.message}\n\nפרטי שולח:\nשם: ${user?.full_name || user?.company_name}\nמייל: ${user?.email}`,
      });
      emailSuccess = true;
    } catch (error) {
      console.error("Error sending support email:", error);
    }

    // 2. Try saving to Chat (Redundancy)
    try {
      if (user) {
        const isEmployer = user.user_type === 'employer';
        // Logic should match Messages.jsx / MessagesSeeker.jsx
        // Employer view: candidate_email is support
        // Seeker view: employer_email is support

        const supportName = "צוות התמיכה";
        let conversation = null;

        // Find existing conversation
        if (isEmployer) {
          const convs = await Conversation.filter({
            employer_id: user.id,
            candidate_email: supportEmail
          });
          if (convs.length > 0) conversation = convs[0];
        } else {
          const convs = await Conversation.filter({
            candidate_id: user.id,
            employer_email: supportEmail
          });
          if (convs.length > 0) conversation = convs[0];
        }

        const currentDate = new Date().toISOString();

        // Create if not exists
        if (!conversation) {
          const newConvData = {
            last_message: formData.message,
            last_message_time: currentDate,
            job_title: isEmployer ? "תמיכה עסקית" : "תמיכה טכנית"
          };

          if (isEmployer) {
            newConvData.employer_id = user.id;
            newConvData.employer_email = user.email;
            newConvData.candidate_email = supportEmail;
            newConvData.candidate_name = supportName;
          } else {
            newConvData.candidate_id = user.id;
            newConvData.candidate_email = user.email;
            newConvData.employer_email = supportEmail;
            newConvData.employer_name = supportName;
          }

          conversation = await Conversation.create(newConvData);
        } else {
          // Update existing
          await Conversation.update(conversation.id, {
            last_message: formData.message,
            last_message_time: currentDate
          });
        }

        // Create Message
        await Message.create({
          conversation_id: conversation.id,
          sender_email: user.email,
          sender_id: user.id,
          recipient_email: supportEmail,
          content: `[פנייה מטופס צור קשר]\nנושא: ${formData.subject}\n\n${formData.message}`,
          is_read: false, // Support hasn't read it yet
          created_date: currentDate
        });

        chatSuccess = true;
      }
    } catch (chatError) {
      console.error("Error saving support message to chat:", chatError);
    }

    setIsSending(false);

    if (emailSuccess || chatSuccess) {
      let desc = "קיבלנו את פנייתך ונחזור אליך בהקדם.";
      if (chatSuccess && !emailSuccess) {
        desc = "המייל לא נשלח, אך הפנייה נשמרה בצ'אט התמיכה ונטפל בה בהקדם.";
      } else if (chatSuccess && emailSuccess) {
        desc = "פנייתך נשלחה במייל וגם תועדה בצ'אט מול התמיכה.";
      }

      toast({
        title: "ההודעה נשלחה",
        description: desc,
      });

      setShowEmailForm(false);
      setFormData({ subject: "", message: "" });
    } else {
      toast({
        title: "שגיאה בשליחה",
        description: "לא הצלחנו לשלוח את ההודעה. אנא נסה שוב מאוחר יותר או פנה ישירות לוואטסאפ.",
        variant: "destructive"
      });
    }
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
            <h1 className={`text-[24px] md:text-2xl font-bold absolute ${user?.user_type === 'employer' ? 'top-[-105px]' : 'top-[-65px]'} left-0 right-0 md:relative md:top-0 ${user?.user_type === 'employer' ? 'text-[#001a6e]' : 'text-gray-900'} md:text-gray-900`}>יצירת קשר</h1>

            <div className={`${user?.user_type === 'job_seeker' ? 'mt-0 md:mt-0 flex flex-col items-center space-y-8 w-full' : 'contents'}`}>
              {/* Action Buttons & Email Form */}
              <div className={`relative w-full max-w-sm md:mt-12 ${user?.user_type === 'job_seeker' ? 'mt-[-20px] md:mt-0' : ''}`}>
                <AnimatePresence mode="wait">
                  {!showEmailForm ? (
                    <motion.div
                      key="buttons"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="flex flex-col gap-3 w-full"
                    >
                      <Button
                        onClick={handleEmailContact}
                        className="bg-[#3B82F6] hover:bg-[#2563EB] text-white px-6 py-2 rounded-full font-bold h-12 text-base transition-all active:scale-95 shadow-md"
                      >
                        <Mail className="w-4 h-4 ml-2" />
                        שליחת מייל
                      </Button>
                      <Button
                        onClick={handleSupportChat}
                        disabled={chatLoading}
                        className="bg-[#3B82F6] hover:bg-[#2563EB] text-white px-6 py-2 rounded-full font-bold h-12 text-base transition-all active:scale-95 shadow-md"
                      >
                        {chatLoading ? 'מתחבר...' : (
                          <>
                            <MessageCircle className="w-4 h-4 ml-2" />
                            התחלת צ'אט
                          </>
                        )}
                      </Button>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="form"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 20 }}
                      className="bg-[#f8f9fd] p-6 rounded-[24px] border border-blue-100 shadow-inner w-full"
                    >
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="font-bold text-[#001a6e]">שליחת מייל לתמיכה</h3>
                        <button
                          onClick={() => setShowEmailForm(false)}
                          className="p-1 hover:bg-red-50 rounded-full text-red-400 transition-colors"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>

                      <form onSubmit={handleSendEmail} className="space-y-4">
                        <div className="text-right">
                          <label className="text-xs text-gray-500 mr-2 mb-1 block">נושא הפנייה</label>
                          <Input
                            placeholder="על מה תרצו לדבר?"
                            value={formData.subject}
                            onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                            className="bg-white border-blue-50 focus:border-blue-300 rounded-xl"
                            dir="rtl"
                          />
                        </div>

                        <div className="text-right">
                          <label className="text-xs text-gray-500 mr-2 mb-1 block">תוכן ההודעה</label>
                          <Textarea
                            placeholder="פרטו כאן את פנייתכם..."
                            value={formData.message}
                            onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                            className="bg-white border-blue-50 focus:border-blue-300 rounded-xl min-h-[120px]"
                            dir="rtl"
                          />
                        </div>

                        <Button
                          type="submit"
                          disabled={isSending}
                          className="w-full bg-[#3B82F6] hover:bg-[#2563EB] text-white rounded-full font-bold h-12 shadow-lg transition-all active:scale-95"
                        >
                          {isSending ? (
                            <div className="flex items-center gap-2">
                              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                              שולח...
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <Send className="w-4 h-4 ml-1" />
                              שלח פנייה
                            </div>
                          )}
                        </Button>
                      </form>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Social Media Links */}
              <div className="space-y-4 md:mt-16">
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
              <p className="text-gray-700 font-semibold pt-6 md:pt-12">{supportEmail}</p>

              {/* Legal Links */}
              <div className="flex items-center gap-4 text-sm text-gray-500 mt-2 md:mt-10">
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
