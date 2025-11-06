import React, { useState } from "react";
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
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { useRequireUserType } from "@/hooks/use-require-user-type";

const FAQ_DATA = [
  {
    id: 1,
    question: "איך אני נכניס למערכת?",
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
  useRequireUserType(); // Ensure user has selected a user type
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedQuestions, setExpandedQuestions] = useState({});

  const filteredFAQ = FAQ_DATA.filter(item =>
    item.question.includes(searchTerm) || item.answer.includes(searchTerm)
  );

  const toggleQuestion = (questionId) => {
    setExpandedQuestions(prev => ({
      ...prev,
      [questionId]: !prev[questionId]
    }));
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
                <div className="space-y-4">
                  {filteredFAQ.length > 0 ? (
                    filteredFAQ.map((item, index) => (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.1 }}
                        className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm"
                      >
                        <button
                          onClick={() => toggleQuestion(item.id)}
                          className="w-full p-4 text-right hover:bg-gray-50 transition-colors flex items-center justify-between"
                        >
                          <div className="flex items-center text-blue-600">
                            {expandedQuestions[item.id] ? (
                              <Minus className="w-5 h-5" />
                            ) : (
                              <Plus className="w-5 h-5" />
                            )}
                          </div>
                          <div className="flex-1 mr-4">
                            <h3 className="font-semibold text-gray-900 text-lg">שאלה {item.id}</h3>
                            <p className="text-gray-700 mt-1">{item.question}</p>
                          </div>
                        </button>
                        
                        <AnimatePresence>
                          {expandedQuestions[item.id] && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.3 }}
                              className="border-t border-gray-200"
                            >
                              <div className="p-4 bg-gray-50">
                                <h4 className="font-medium text-gray-800 mb-2">תשובה</h4>
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
                  <p className="text-gray-600">
                    לא מצאת התשובה? 
                    <Link to={createPageUrl("Contact")} className="text-blue-600 underline hover:text-blue-700 mr-1">
                      פנה לתמיכה
                    </Link>
                  </p>
                </div>
              </motion.div>
            </CardContent>
          </div>
        </Card>
      </div>
    </div>
  );
}