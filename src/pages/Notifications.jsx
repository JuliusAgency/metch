
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { 
  Eye, 
  MessageSquare, 
  FileText, 
  UserPlus, 
  ChevronLeft, 
  ChevronRight 
} from "lucide-react";
import { motion } from "framer-motion";

const MOCK_NOTIFICATIONS = [
  { id: 1, type: "job_view", title: "צפייה במשרה", message: "יש לך 7 צפיות חדשות", date: "10.07.25", icon: Eye },
  { id: 2, type: "job_view", title: "צפייה במשרה", message: "יש לך 3 צפיות חדשות", date: "10.07.25", icon: Eye },
  { id: 3, type: "new_message", title: "הודעה חדשה", message: "שירלי ארנון ענתה להודעתך", date: "10.07.25", icon: MessageSquare },
  { id: 4, type: "job_view", title: "צפייה במשרה", message: "יש לך 2 צפיות חדשות", date: "10.07.25", icon: Eye },
  { id: 5, type: "application_submitted", title: "הוגשה מועמדות", message: "עידן צרפתי הגיש מועמדות", date: "10.07.25", icon: FileText },
  { id: 6, type: "new_message", title: "הודעה חדשה", message: "אריאל בכר ענה להודעתך", date: "10.07.25", icon: MessageSquare },
  { id: 7, type: "new_candidate", title: "מועמד חדש", message: "יש לך מועמד חדש למשרה", date: "10.07.25", icon: UserPlus },
  { id: 8, type: "job_view", title: "צפייה במשרה", message: "יש לך 1 צפייה חדשה", date: "09.07.25", icon: Eye },
  { id: 9, type: "new_message", title: "הודעה חדשה", message: "דנה לוי ענתה להודעתך", date: "09.07.25", icon: MessageSquare },
  { id: 10, type: "application_submitted", title: "הוגשה מועמדות", message: "יוסי כהן הגיש מועמדות", date: "08.07.25", icon: FileText },
  { id: 11, type: "new_candidate", title: "מועמד חדש", message: "מועמדת חדשה למשרת מנהל/ת", date: "08.07.25", icon: UserPlus },
  { id: 12, type: "job_view", title: "צפייה במשרה", message: "יש לך 5 צפיות חדשות", date: "07.07.25", icon: Eye },
  { id: 13, type: "new_message", title: "הודעה חדשה", message: "ישראל ישראלי ענה להודעתך", date: "07.07.25", icon: MessageSquare },
  { id: 14, type: "job_view", title: "צפייה במשרה", message: "יש לך צפייה חדשה", date: "06.07.25", icon: Eye },
];

const ITEMS_PER_PAGE = 7;

export default function Notifications() {
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = Math.ceil(MOCK_NOTIFICATIONS.length / ITEMS_PER_PAGE);

  const paginatedNotifications = MOCK_NOTIFICATIONS.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const goToPage = (pageNumber) => {
    if (pageNumber >= 1 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber);
    }
  };

  const pageNumbers = Array.from({ length: totalPages }, (_, i) => i + 1);
  
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
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900">התראות</h1>
            </div>

            <div className="space-y-2">
              {paginatedNotifications.map((notif, index) => (
                <motion.div
                  key={notif.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="flex items-center justify-between p-4 border-b border-gray-200/80 last:border-b-0"
                >
                  <span className="text-gray-500 text-sm whitespace-nowrap">{notif.date}</span>
                  <div className="flex-1 text-right px-4 sm:px-8">
                      <p className="font-semibold text-gray-800">{notif.title}</p>
                      <p className="text-gray-600">{notif.message}</p>
                  </div>
                  <div className="flex items-center justify-center w-10 h-10 rounded-full border border-gray-300 bg-white flex-shrink-0">
                      <notif.icon className="w-5 h-5 text-gray-600" />
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="flex justify-center items-center pt-8">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => goToPage(currentPage + 1)} 
                disabled={currentPage === totalPages}
                className="rounded-full hover:bg-gray-100"
              >
                <ChevronRight className="w-5 h-5" />
              </Button>
              <div className="flex items-center gap-2 mx-4">
                {pageNumbers.map(number => (
                  <Button
                    key={number}
                    variant="ghost"
                    onClick={() => goToPage(number)}
                    className={`rounded-full w-9 h-9 transition-colors ${
                      currentPage === number 
                        ? 'bg-blue-600 text-white font-bold shadow-md' 
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    {number}
                  </Button>
                ))}
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => goToPage(currentPage - 1)} 
                disabled={currentPage === 1}
                className="rounded-full hover:bg-gray-100"
              >
                <ChevronLeft className="w-5 h-5" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
