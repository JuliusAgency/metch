import React, { useState, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ChevronLeft,
  Search,
  Plus,
  Minus,
  HelpCircle
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { useRequireUserType } from "@/hooks/use-require-user-type";
import { useUser } from "@/contexts/UserContext";
import settingsHeaderBg from "@/assets/settings_header_bg.png";

import faqPlus from "@/assets/faq_plus.png";
import faqMinus from "@/assets/faq_minus.png";

const FAQ_DATA = [
  {
    id: 1,
    question: "איך אני נכנס למערכת?",
    answer: "כדי להיכנס למערכת, לחץ על כפתור 'התחבר' בראש העמוד והשתמש בחשבון Google שלך או צור חשבון חדש."
  },
  {
    id: 2,
    question: "איך אני מפרסם משרה?",
    answer: "לאחר ההתחברת, לחץ על 'פרסום משרה חדשה' בדף הבית ועקוב אחר השלבים במערכת הפרסום."
  },
  {
    id: 3,
    question: "כמה עולה פרסום משרה?",
    answer: "המערכת מציעה מספר חבילות פרסום. צור איתנו קשר לקבלת מידע מפורט על התעריפים המתאימים לך."
  },
  {
    id: 4,
    question: "איך אני רואה את המועמדים שהגישו מועמדות?",
    answer: "כל המועמדים מופיעים בעמוד 'ניהול משרות' תחת המשרה הרלוונטית. תוכל לצפות בקורות החיים ולנהל התכתבות."
  },
  {
    id: 5,
    question: "איך אני משנה את פרטי החברה שלי?",
    answer: "לחץ על אייקון ההגדרות בתפריט העליון ובחר 'פרטי החברה' לעדכון הפרטים שלך."
  },
  {
    id: 6,
    question: "איך אני מחפש משרות במערכת?",
    answer: "השתמש בשדה החיפוש בעמוד 'חיפוש משרות' כדי למצוא משרות לפי תפקיד, חברה או מילות מפתח."
  },
  {
    id: 7,
    question: "איך אני שולח מועמדות למשרה?",
    answer: "לחץ על כפתור 'הגשת מועמדות' בעמוד פרטי המשרה ועקוב אחר ההוראות."
  },
  {
    id: 8,
    question: "איך אני יכול לעדכן את הקורות חיים שלי?",
    answer: "לחץ על אייקון הפרופיל ובחר 'עדכון פרטים אישיים' כדי לעדכן את הקורות חיים והפרטים שלך."
  }
];

export default function FAQ() {
  // ... existing hook calls ...
  useRequireUserType(); // Ensure user has selected a user type
  const [searchTerm, setSearchTerm] = useState("");
  const [activeQuestionId, setActiveQuestionId] = useState(null);
  const questionRefs = useRef([]);

  const filteredFAQ = FAQ_DATA.filter(item =>
    item.question.includes(searchTerm) || item.answer.includes(searchTerm)
  );

  const toggleQuestion = (questionId) => {
    setActiveQuestionId(prev => (prev === questionId ? null : questionId));
  };

  const handleQuestionKeyDown = (event, index) => {
    // ... existing handler ...
    const total = filteredFAQ.length;
    if (!total) return;

    if (event.key === "ArrowDown") {
      event.preventDefault();
      const nextIndex = (index + 1) % total;
      questionRefs.current[nextIndex]?.focus();
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      const prevIndex = (index - 1 + total) % total;
      questionRefs.current[prevIndex]?.focus();
    } else if (event.key === "Home") {
      event.preventDefault();
      questionRefs.current[0]?.focus();
    } else if (event.key === "End") {
      event.preventDefault();
      questionRefs.current[total - 1]?.focus();
    }
  };

  const { user } = useUser();
  const navigate = useNavigate();

  const handleSupportClick = () => {
    // ... existing support handler ...
    if (user?.user_type === 'job_seeker') {
      navigate(createPageUrl("MessagesSeeker"), { state: { supportChat: true } });
      return;
    }

    if (typeof window === "undefined") return;

    const whatsappUrl = "https://api.whatsapp.com/send/?phone=%2B972501234567&text=%D7%A9%D7%9C%D7%95%D7%9D%21+%D7%90%D7%A0%D7%99+%D7%96%D7%A7%D7%95%D7%A7%2F%D7%94+%D7%9C%D7%AA%D7%9E%D7%99%D7%9B%D7%94+%D7%9E%D7%A6%D7%95%D7%95%D7%AA+Metch&type=phone_number&app_absent=0";
    window.open(whatsappUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="h-full relative" dir="rtl">
      <div className="relative">
        {/* ... existing header ... */}
        <div className="relative h-32 overflow-hidden w-full">
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
            className="absolute top-4 right-6 w-10 h-10 bg-white/30 rounded-full flex items-center justify-center backdrop-blur-sm hover:bg-white/50 transition-colors z-10"
          >
            <ChevronLeft className="w-6 h-6 text-gray-800 rotate-180" />
          </Link>
        </div>

        <div className="p-4 sm:p-6 md:p-8 -mt-16 relative z-10 w-full max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="space-y-8"
          >
            {/* Title */}
            <div className="text-center">
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">שאלות נפוצות</h1>
            </div>

            {/* Search Bar */}
            <div className="relative max-w-md mx-auto">
              <Search className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                placeholder="חפש בשאלות נפוצות"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pr-12 pl-4 py-3 border-gray-300 focus:border-blue-400 rounded-full h-12 text-right"
                dir="rtl"
              />
            </div>

            {/* FAQ Questions */}
            <div className="">
              {filteredFAQ.length > 0 ? (
                filteredFAQ.map((item, index) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                    className="border-b-2 border-[#d7def0]"
                  >
                    <button
                      onClick={() => toggleQuestion(item.id)}
                      onKeyDown={(event) => handleQuestionKeyDown(event, index)}
                      className="w-full p-4 text-right hover:bg-gray-50 transition-colors flex items-center justify-between focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 gap-4"
                      aria-expanded={activeQuestionId === item.id}
                      aria-controls={`faq-content-${item.id}`}
                      id={`faq-trigger-${item.id}`}
                      ref={el => { questionRefs.current[index] = el; }}
                      type="button"
                    >
                      <div className="flex-1">
                        <p
                          className="text-gray-900 text-lg font-bold"
                          id={`faq-title-${item.id}`}
                        >
                          {item.question}
                        </p>
                      </div>
                      <div className="flex items-center flex-shrink-0">
                        {activeQuestionId === item.id ? (
                          <img src={faqMinus} alt="סגור" className="w-[30px] h-[30px]" />
                        ) : (
                          <img src={faqPlus} alt="פתח" className="w-[30px] h-[30px]" />
                        )}
                      </div>
                    </button>

                    <AnimatePresence>
                      {activeQuestionId === item.id && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3 }}
                          className="border-t border-gray-200"
                          id={`faq-content-${item.id}`}
                          role="region"
                          aria-labelledby={`faq-title-${item.id}`}
                        >
                          <div className="p-4 bg-gray-50">
                            <p className="text-gray-700 leading-relaxed">{item.answer}</p>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                ))
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-600">לא נמצאו תוצאות התואמות לחיפוש שלך</p>
                  <Button
                    onClick={() => setSearchTerm("")}
                    className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-full"
                  >
                    נקה חיפוש
                  </Button>
                </div>
              )}
            </div>

            {/* Bottom contact message */}
            <div className="text-center pt-6 border-t border-gray-200">
              <p className="text-gray-600 mb-4">לא מצאת התשובה?</p>
              <Button
                type="button"
                onClick={handleSupportClick}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-full inline-flex items-center gap-2"
              >
                <HelpCircle className="w-5 h-5" />
                פנה לתמיכה
              </Button>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
