
import { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Notification } from "@/api/entities";
import { useUser } from "@/contexts/UserContext";
import { useRequireUserType } from "@/hooks/use-require-user-type";
import { 
  Eye, 
  MessageSquare, 
  FileText, 
  UserPlus, 
  ChevronLeft, 
  ChevronRight,
  Bell
} from "lucide-react";
import { motion } from "framer-motion";
import { format } from "date-fns";

const ITEMS_PER_PAGE = 7;

// Map notification types to icons and titles
const getNotificationConfig = (type) => {
  const configs = {
    job_view: { icon: Eye, title: "צפייה במשרה" },
    new_message: { icon: MessageSquare, title: "הודעה חדשה" },
    application_submitted: { icon: FileText, title: "הוגשה מועמדות" },
    new_candidate: { icon: UserPlus, title: "מועמד חדש" },
    job_status_change: { icon: Bell, title: "שינוי סטטוס משרה" },
    default: { icon: Bell, title: "התראה" }
  };
  return configs[type] || configs.default;
};

export default function Notifications() {
  useRequireUserType(); // Ensure user has selected a user type
  const { user } = useUser();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  const loadNotifications = useCallback(async () => {
    if (!user?.email) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      // Fetch all notifications for the user, ordered by created_date descending
      const allNotifications = await Notification.filter({ user_email: user.email }, "-created_date");
      setNotifications(allNotifications);
    } catch (error) {
      console.error("Error loading notifications:", error);
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  }, [user?.email]);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  const totalPages = Math.ceil(notifications.length / ITEMS_PER_PAGE);
  const paginatedNotifications = notifications.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const goToPage = (pageNumber) => {
    if (pageNumber >= 1 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber);
    }
  };

  const pageNumbers = Array.from({ length: totalPages }, (_, i) => i + 1);

  const formatDate = (dateString) => {
    if (!dateString) return "";
    try {
      const date = new Date(dateString);
      return format(date, "dd.MM.yy");
    } catch {
      return "";
    }
  };
  
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

            {loading ? (
              <div className="flex justify-center items-center py-12">
                <div className="text-gray-500">טוען...</div>
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex justify-center items-center py-12">
                <div className="text-gray-500">אין התראות</div>
              </div>
            ) : (
              <div className="space-y-2">
                {paginatedNotifications.map((notif, index) => {
                  const config = getNotificationConfig(notif.type);
                  const Icon = config.icon;
                  return (
                    <motion.div
                      key={notif.id}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.5, delay: index * 0.1 }}
                      className="flex items-center justify-between p-4 border-b border-gray-200/80 last:border-b-0"
                    >
                      <span className="text-gray-500 text-sm whitespace-nowrap">
                        {formatDate(notif.created_date || notif.created_at)}
                      </span>
                      <div className="flex-1 text-right px-4 sm:px-8">
                        <p className="font-semibold text-gray-800">{config.title}</p>
                        <p className="text-gray-600">{notif.message || "התראה חדשה"}</p>
                      </div>
                      <div className="flex items-center justify-center w-10 h-10 rounded-full border border-gray-300 bg-white flex-shrink-0">
                        <Icon className="w-5 h-5 text-gray-600" />
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}

            {notifications.length > 0 && (
              <div className="flex justify-center items-center pt-8">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => goToPage(currentPage + 1)} 
                  disabled={currentPage === totalPages || totalPages === 0}
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
                  disabled={currentPage === 1 || totalPages === 0}
                  className="rounded-full hover:bg-gray-100"
                >
                  <ChevronLeft className="w-5 h-5" />
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
