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
import settingsMobileBg from "@/assets/settings_mobile_bg.jpg";
import paymentsMobileBg from "@/assets/payment_mobile_header.png";

import faqPlus from "@/assets/faq_plus.png";
import faqMinus from "@/assets/faq_minus.png";

const EMPLOYER_FAQ = [
  {
    id: "e1",
    question: "איך מפרסמים משרה חדשה?",
    answer: "כדי לפרסם משרה חדשה בדף הבית לוחצים על כפתור ״ליצירת משרה חדשה״, במהלך התהליך מתבקשים למלא פרטים כמו תיאור התפקיד, דרישות, מיקום והעדפות נוספות. בסיום התהליך המשרה עולה למערכת ומתחילה לקבל התאמות ממועמדים רלוונטיים."
  },
  {
    id: "e2",
    question: "איך מנהלים משרה לאחר הפרסום?",
    answer: "לאחר פרסום משרה ניתן להיכנס אליה דרך עמוד ניהול משרות, לצפות במועמדים, לערוך פרטים, לעקוב אחרי סטטיסטיקות ולנהל את סטטוס המשרה."
  },
  {
    id: "e3",
    question: "מה העלות של פרסום משרה?",
    answer: "עלות למשרה בודדת הינה 599 ש״ח, במידה ותבחרו ביותר ממשרה אחת המחיר פר משרה יורד בהתאם."
  },
  {
    id: "e4",
    question: "איפה רואים את המועמדים למשרה?",
    answer: "את המועמדים ניתן לראות בדשבורד שבדף הבית תחת הכותרת ״מועמדים חדשים״."
  },
  {
    id: "e5",
    question: "מה המשמעות של אחוזי ההתאמה?",
    answer: "אחוזי ההתאמה משקפים את מידת ההתאמה בין דרישות המשרה לבין פרופיל המועמד, על בסיס קו״ח, העדפות, ניסיון ופרמטרים נוספים. חשוב לדעת: אחוז נמוך לא בהכרח אומר חוסר התאמה מקצועית, אלא לעיתים פער בהעדפות כמו מיקום, סוג משרה או זמינות."
  },
  {
    id: "e6",
    question: "האם ניתן לערוך את פרטי החברה ואת פרטי המגייס/ת?",
    answer: "כן. ניתן לערוך את פרטי החברה ופרטי איש הקשר דרך עמוד ההגדרות."
  },
  {
    id: "e7",
    question: "איפה רואים מידע על משרות שפורסמו?",
    answer: "כל המידע על המשרות שפורסמו מופיע בעמוד ניהול משרות, כולל סטטוס, מועמדים ונתונים סטטיסטיים."
  },
  {
    id: "e8",
    question: "איך יוצרים קשר עם מועמד רלוונטי?",
    answer: "ניתן ליצור קשר עם מועמד ישירות דרך כרטיס המועמד במערכת, באמצעות הצאט."
  },
  {
    id: "e9",
    question: "איך רוכשים משרות נוספות?",
    answer: "רכישת משרות נוספות מתבצעת דרך אזור ניהול תשלום / רכישת משרות. שם ניתן לבחור כמות משרות."
  },
  {
    id: "e10",
    question: "איפה רואים חשבוניות וקבלות?",
    answer: "חשבוניות וקבלות זמינות באזור ניהול תשלומים, ניתן לצפות בחשבוניות ולייצא כקובץ."
  },
  {
    id: "e11",
    question: "מה המשמעות של הסטטיסטיקות בדשבורד?",
    answer: "הסטטיסטיקות בדשבורד מציגות נתונים כמו מספר צפיות במשרה, כמות מועמדים, אחוזי התאמה ופעילות כללית. המטרה היא לאפשר מעקב אחרי ביצועי המשרה ותהליך הגיוס."
  },
  {
    id: "e12",
    question: "איך מתנתקים מהמערכת?",
    answer: "ניתן להתנתק דרך תפריט המשתמש, באמצעות האפשרות התנתקות בלוגו החברה."
  },
  {
    id: "e13",
    question: "איך משנים סיסמה?",
    answer: "שינוי סיסמה מתבצע דרך עמוד הגדרות חשבון. במקרה של שכחת סיסמה ניתן לבצע איפוס דרך מסך ההתחברות."
  },
  {
    id: "e14",
    question: "איך יוצרים קשר עם התמיכה?",
    answer: "ניתן ליצור קשר עם התמיכה דרך אזור תמיכה בעמוד ההודעות, או באמצעות עמוד יצירת קשר."
  },
  {
    id: "e15",
    question: "איך המערכת מחליטה אילו מועמדים להתאים למשרה?",
    answer: "המערכת משתמשת באלגוריתם התאמה חכם שמנתח את דרישות המשרה מול קו״ח, ניסיון, העדפות ונתונים נוספים של מועמדים, ומדרג את רמת ההתאמה."
  },
  {
    id: "e16",
    question: "אם לא התקבלו מועמדויות למשרה – מה כדאי לעשות?",
    answer: "במקרה כזה מומלץ לבדוק: האם דרישות המשרה מוגדרות בצורה מדויקת מדי? האם טווח המיקום או סוג המשרה מגבילים? האם כדאי לערוך את תיאור המשרה או ההעדפות? המערכת תעדכן התאמות לאחר כל שינוי."
  },
  {
    id: "e17",
    question: "האם ניתן להשהות משרה?",
    answer: "כן, ניתן להשהות משרה בכל עת."
  },
  {
    id: "e18",
    question: "האם ניתן לשכפל משרה?",
    answer: "כן, ניתן לשכפל משרה בכדי לקצר לכם הליכים."
  },
  {
    id: "e19",
    question: "מהי “תמצית מועמד”?",
    answer: "תמצית מועמד היא סיכום קצר וממוקד של פרופיל המועמד, הכולל ניסיון, חוזקות ונתונים מרכזיים – במטרה לאפשר התרשמות מהירה לפני קריאת קו״ח מלאים."
  },
  {
    id: "e20",
    question: "מה זה “מה מאצ’ חושב על המועמד”?",
    answer: "זהו ניתוח חכם של המערכת שמסביר למה מועמד מסוים הותאם למשרה שלכם, כולל נקודות התאמה מרכזיות ושיקולים אלגוריתמיים."
  },
  {
    id: "e21",
    question: "איך מייצאים קורות חיים של מועמד למייל?",
    answer: "בתחתית כרטיס המועמד דרך כפתור ״ייצוא למייל״."
  }
];

const JOB_SEEKER_FAQ = [
  {
    id: "j1",
    question: "איך מתחילים להשתמש במאצ’?",
    answer: "כדי להתחיל יש להירשם למערכת כמחפש עבודה ולעבור תהליך אונבורדינג קצר הכולל העלאת קורות חיים או יצירת קורות חיים בשבילכם ומילוי שאלון העדפה. במהלך התהליך המערכת לומדת על קורות החיים, הניסיון וההעדפות שלכם כדי להציג משרות מותאמות."
  },
  {
    id: "j2",
    question: "איך יוצרים קורות חיים דרך מאצ’?",
    answer: "ניתן ליצור קו״ח ישירות דרך המערכת באמצעות תהליך מובנה, הכולל הזנת ניסיון, השכלה, תמצית ופרטים נוספים. המערכת משתמשת ב-AI כדי לשפר ניסוחים ולהציע תמצית מקצועית."
  },
  {
    id: "j3",
    question: "האם ניתן להעלות קורות חיים קיימים?",
    answer: "כן. ניתן להעלות קו״ח קיימים, והמערכת תנתח אותם ותשלב את המידע בפרופיל."
  },
  {
    id: "j4",
    question: "איך המערכת מציגה משרות שמתאימות לי?",
    answer: "המערכת מציגה משרות על בסיס אלגוריתם התאמה חכם, שמשקלל קו״ח, העדפות, ניסיון ונתונים נוספים כדי להציג משרות רלוונטיות."
  },
  {
    id: "j5",
    question: "מה המשמעות של אחוזי ההתאמה?",
    answer: "אחוזי ההתאמה משקפים את רמת ההתאמה בין פרופיל המשתמש למשרה מסוימת. אחוז נמוך לא בהכרח מעיד על חוסר התאמה מקצועית, אלא לעיתים על פער בהעדפות כמו מיקום, סוג משרה או זמינות."
  },
  {
    id: "j6",
    question: "למה מוצגת לי משרה עם אחוז התאמה נמוך?",
    answer: "ייתכן שהמשרה מתאימה מקצועית, אך קיימים פערים בהעדפות שהוגדרו. המערכת מציגה זאת כדי לאפשר קבלת החלטה מודעת ולא לפסול הזדמנויות רלוונטיות."
  },
  {
    id: "j7",
    question: "איך מגישים מועמדות למשרה?",
    answer: "הגשת מועמדות מתבצעת מתוך כרטיס המשרה, באמצעות לחיצה על כפתור הגשת מועמדות ומילוי שלב נוסף במידת הצורך (כגון שאלון סינון)."
  },
  {
    id: "j8",
    question: "האם ניתן לסרב למשרה?",
    answer: "כן. ניתן לסרב למשרה מתוך כרטיס המשרה, והמערכת תלמד מהבחירה כדי לשפר התאמות עתידיות."
  },
  {
    id: "j9",
    question: "איפה רואים את המשרות אליהן הוגשה מועמדות?",
    answer: "תוכלו לראות את המשרות שהגשתם אליהן מועמדות בדף הבית באזור ״משרות שצפיתי״."
  },
  {
    id: "j10",
    question: "מה זה “התובנות שלי”?",
    answer: "“התובנות שלי” הוא עמוד שמציג ניתוח והמלצות אישיות על בסיס הפרופיל, הקו״ח והפעילות במערכת, במטרה לשפר את חיפוש העבודה."
  },
  {
    id: "j11",
    question: "מה זה “מה מאצ’ חושב על המשרה”?",
    answer: "זהו הסבר חכם שמציג למה משרה מסוימת הוצעה לכם, ומהם הגורמים העיקריים שמשפיעים על אחוז ההתאמה."
  },
  {
    id: "j12",
    question: "איך יוצרים קשר עם מעסיק?",
    answer: "כאשר הגשתם מועמדות למשרה המעסיק יכול לפנות אליכם דרך המערכת, ניתן להשיב ולנהל תקשורת באמצעות ממשק ההודעות."
  },
  {
    id: "j13",
    question: "האם ניתן לערוך או להחליף קורות חיים?",
    answer: "כן. ניתן לערוך פרטים בקו״ח או להחליף קובץ דרך עמוד ״הקו״ח שלי״."
  },
  {
    id: "j14",
    question: "איך משנים העדפות חיפוש עבודה?",
    answer: "העדפות חיפוש ניתנות לעריכה דרך עמוד ״הקו״ח שלי״, שינוי העדפות משפיע על המשרות שמוצגות בהמשך."
  },
  {
    id: "j15",
    question: "איך משנים סטטוס חיפוש עבודה?",
    answer: "תוכלו בכל זמן לשנות את סטטוס חיפוש העבודה שלכם בעמוד ״הקו״ח שלי״, במידה ותשנו את הסטטוס אל ״לא מחפשים עבודה״ הצעת משרות חדשות תיפסק עד לעדכון מכם."
  },
  {
    id: "j16",
    question: "איפה נשמרים הפרטים שלי?",
    answer: "הפרטים נשמרים בפרופיל האישי וניתנים לעריכה בכל עת דרך עמוד ״הפרטים שלי״"
  },
  {
    id: "j17",
    question: "האם המידע שלי גלוי לכל המעסיקים?",
    answer: "כרטיס המשתמש שלכם יוצג אך ורק למעסיקים אשר הגשתם מועמדות למשרה שלהם."
  },
  {
    id: "j18",
    question: "האם אפשר למחוק חשבון?",
    answer: "כן, תוכלו למחוק את החשבון שלכם לצמיתות בכל שלב במידה ותבחרו בזאת."
  },
  {
    id: "j19",
    question: "איך יוצרים קשר עם התמיכה?",
    answer: "כן, ניתן ליצור קשר עם התמיכה דרך עמוד הודעות."
  },
  {
    id: "j20",
    question: "למה אני לא רואה משרות?",
    answer: "ייתכן שהמערכת עדיין לומדת את הפרופיל, או שההעדפות שהוגדרו מצמצמות את התוצאות. מומלץ לעדכן העדפות או קו״ח ולבדוק שוב, או לפנות לתמיכה."
  }
];

export default function FAQ() {
  const { user } = useUser();
  useRequireUserType(); // Ensure user has selected a user type
  const [searchTerm, setSearchTerm] = useState("");
  const [activeQuestionId, setActiveQuestionId] = useState(null);
  const questionRefs = useRef([]);

  const currentFaqData = user?.user_type === 'employer' ? EMPLOYER_FAQ : JOB_SEEKER_FAQ;

  const filteredFAQ = currentFaqData.filter(item =>
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


  const navigate = useNavigate();

  const handleSupportClick = () => {
    // ... existing support handler ...
    if (user?.user_type === 'job_seeker') {
      navigate(createPageUrl("MessagesSeeker"), { state: { supportChat: true } });
      return;
    }

    if (typeof window === "undefined") return;
    navigate(createPageUrl("Contact"));
  };

  return (
    <div className="h-full relative overflow-hidden md:overflow-visible" dir="rtl">
      {/* Mobile-Only Background Images */}
      {user?.user_type === 'job_seeker' ? (
        <div
          className="md:hidden fixed top-0 left-0 right-0 pointer-events-none"
          style={{
            width: '100%',
            height: '200px',
            backgroundImage: `url(${settingsMobileBg})`,
            backgroundSize: 'cover',
            backgroundPosition: 'top center',
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

      <div className="relative h-full">
        {/* Desktop Header / Employer Mobile Header */}
        <div className={`relative h-32 overflow-hidden w-full hidden md:block`}>
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

        {/* Mobile-Only Header ABOVE Card - Seeker Only */}
        {user?.user_type === 'job_seeker' && (
          <div className="md:hidden relative z-10 w-full h-16">
            <Link to={createPageUrl("Dashboard")} className="absolute right-6 top-4 w-10 h-10 bg-white/50 rounded-full flex items-center justify-center shadow-sm backdrop-blur-sm">
              <ChevronLeft className="w-6 h-6 text-gray-800 rotate-180" />
            </Link>
          </div>
        )}

        {/* Adjust container margin/padding */}
        <div className={`${user?.user_type === 'job_seeker' ? 'p-0 mt-0 pt-4 md:-mt-20 md:p-8' : 'px-4 sm:p-6 md:p-8 mt-24 md:-mt-16'} relative z-10 w-full max-w-4xl mx-auto`}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className={`${user?.user_type === 'employer' ? 'space-y-4' : 'space-y-8'} ${user?.user_type === 'job_seeker'
              ? 'bg-white [border-top-left-radius:50%_40px] [border-top-right-radius:50%_40px] min-h-[calc(100vh-100px)] pt-8 px-6 shadow-[0_0_20px_rgba(0,0,0,0.1)] md:bg-transparent md:rounded-none md:shadow-none md:min-h-0 md:pt-0 md:px-0'
              : 'bg-white rounded-[24px] shadow-xl px-6 pb-6 pt-0 mt-[-30px] md:mt-0 md:bg-transparent md:shadow-none md:rounded-none md:p-0'}`}
          >
            {/* Title */}
            <div className={`text-center block ${user?.user_type === 'employer' ? 'absolute top-[-65px] left-0 right-0 md:relative md:top-0 md:pb-8' : 'pb-2 md:pb-8'}`}>
              <h1 className={`text-2xl md:text-3xl font-bold ${user?.user_type === 'employer' ? 'text-[#001a6e]' : 'text-gray-900'}`}>שאלות נפוצות</h1>
            </div>

            {/* Search Bar */}
            <div className="relative max-w-md mx-auto">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                placeholder="חיפוש בשאלות נפוצות"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-12 pr-4 py-3 bg-[#f8f9fd] border-none focus-visible:ring-1 focus-visible:ring-blue-100 rounded-md h-12 text-right shadow-sm"
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
                          <img src={faqMinus} alt="סגור" className="w-3.5 h-3.5" />
                        ) : (
                          <img src={faqPlus} alt="פתח" className="w-3.5 h-3.5" />
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
                פנייה לתמיכה
              </Button>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
