import { useState, useEffect, useCallback } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Notification } from "@/api/entities";
import { useUser } from "@/contexts/UserContext";
import { useRequireUserType } from "@/hooks/use-require-user-type";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Eye,
  MessageSquare,
  FileText,
  UserPlus,
  ChevronLeft,
  ChevronRight,
  Bell,
} from "lucide-react";
import { motion } from "framer-motion";
import { format } from "date-fns";

import { createPageUrl } from "@/utils";
import settingsHeaderBg from "@/assets/settings_header_bg.png";
import settingsMobileBg from "@/assets/payment_mobile_header.png";

const ITEMS_PER_PAGE = 7;
// Allowed notification types
const EMPLOYER_ALLOWED_NOTIFICATION_TYPES = ['application_submitted', 'new_message'];
const SEEKER_ALLOWED_NOTIFICATION_TYPES = ['profile_view', 'new_message', 'job_view'];

// Map notification types to icons and titles
const getNotificationConfig = (type) => {
  const configs = {
    job_view: { icon: Eye, title: "צפייה במשרה" },
    profile_view: { icon: Eye, title: "צפייה בכרטיס" },
    new_message: { icon: MessageSquare, title: "הודעה חדשה" },
    application_submitted: { icon: FileText, title: "הוגשה מועמדות" },
    new_candidate: { icon: UserPlus, title: "מועמד חדש" },
    job_status_change: { icon: Bell, title: "שינוי סטטוס משרה" },
    high_match_alert: { icon: UserPlus, title: "התאמה גבוהה נמצאה!" },
    daily_match_summary: { icon: Bell, title: "סיכום התאמות יומי" },
    default: { icon: Bell, title: "התראה" },
  };
  return configs[type] || configs.default;
};

export default function Notifications() {
  useRequireUserType(); // Ensure user has selected a user type
  const { user, refreshUnreadCount } = useUser();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedNotification, setSelectedNotification] = useState(null); // State for modal
  const location = useLocation();
  const navigate = useNavigate();

  const loadNotifications = useCallback(async () => {
    if (!user?.email) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      const [byUserId, byEmail, byCreatedBy] = await Promise.all([
        Notification.filter({ user_id: user.id }, "-created_date"),
        Notification.filter({ email: user.email }, "-created_date"),
        Notification.filter({ created_by: user.id }, "-created_date")
      ]);

      const allNotifications = [...byUserId, ...byEmail, ...byCreatedBy]
        .reduce((acc, current) => {
          const x = acc.find(item => item.id === current.id);
          if (!x) return acc.concat([current]);
          return acc;
        }, [])
        .sort((a, b) => new Date(b.created_date || b.created_at) - new Date(a.created_date || a.created_at));

      const allowedTypes = user.user_type === 'employer'
        ? EMPLOYER_ALLOWED_NOTIFICATION_TYPES
        : SEEKER_ALLOWED_NOTIFICATION_TYPES;

      const filteredNotifications = allNotifications.filter(notif => allowedTypes.includes(notif.type));
      setNotifications(filteredNotifications);

    } catch (error) {
      console.error("Error loading notifications:", error);
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  }, [user?.email, user?.id, user?.user_type]);

  useEffect(() => {
    if (notifications.length > 0 && location.state?.selectedNotificationId) {
      const notifId = location.state.selectedNotificationId;
      const notif = notifications.find(n => n.id === notifId);
      if (notif) {
        setSelectedNotification(notif);
        if (notif.is_read === 'false' || notif.is_read === false) {
          handleNotificationClick(notif);
        }
        window.history.replaceState({}, document.title);
      }
    }
  }, [notifications, location.state, navigate]);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  useEffect(() => {
    const markAllAsRead = async () => {
      if (!user?.email || notifications.length === 0) return;

      const unreadNotifications = notifications.filter(
        n => n.is_read === false || n.is_read === 'false'
      );

      if (unreadNotifications.length > 0) {
        try {
          await Promise.all(
            unreadNotifications.map(notif =>
              Notification.update(notif.id, { is_read: true })
            )
          );

          setNotifications(prev =>
            prev.map(n => ({ ...n, is_read: true, read: true }))
          );

          setTimeout(() => {
            if (user?.id) refreshUnreadCount(user.id, user.email);
          }, 100);

        } catch (error) {
          console.error('Error marking notifications as read:', error);
        }
      }
    };

    markAllAsRead();
  }, [user?.email, notifications]);

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

  const handleNotificationClick = async (notif) => {
    if (notif.is_read === 'false' || notif.is_read === false) {
      try {
        await Notification.update(notif.id, { is_read: true });
        setNotifications(prev => prev.map(n =>
          n.id === notif.id ? { ...n, is_read: true, read: true } : n
        ));
      } catch (error) {
        console.error("Error marking notification as read:", error);
      }
    }

    if (notif.type === 'new_message') {
      const isSeeker = user?.user_type === 'seeker' || (user?.full_name && !user?.company_name) || window.location.pathname.includes('seeker');
      if (isSeeker) {
        navigate('/messagesseeker', { state: { selectedNotificationId: notif.id } });
      } else {
        navigate('/Messages', { state: { selectedNotificationId: notif.id } });
      }
      return;
    }

    if (notif.type === 'high_match_alert' && notif.data?.job_id) {
      navigate(`/JobDetails?id=${notif.data.job_id}`);
      return;
    }

    setSelectedNotification(notif);
  };

  const closeDialog = () => setSelectedNotification(null);

  return (
    <div className="h-full relative overflow-hidden md:overflow-visible" dir="rtl">
      {/* Mobile-Only Background Image - Shortened */}
      <div
        className="md:hidden fixed top-0 left-0 right-0 z-0 pointer-events-none"
        style={{
          width: '100%',
          height: '200px',
          backgroundImage: `url(${settingsMobileBg})`,
          backgroundSize: 'cover',
          backgroundPosition: 'top center',
          backgroundRepeat: 'no-repeat'
        }}
      />

      <div className="relative h-full">
        {/* Mobile Header: Title Center, Back Button Right */}
        <div className="md:hidden flex items-center justify-center pt-0 pb-8 relative z-10 w-full px-6">
          <h1 className="text-[24px] font-bold text-[#001a6e]">התראות</h1>
        </div>

        <div className="p-0 mt-6 relative z-10 w-full md:w-[98%] mx-auto md:bg-white md:rounded-[32px] md:shadow-xl md:overflow-hidden md:min-h-[88vh]">
          {/* Desktop Header Image - Moved Inside Card */}
          <div className="relative h-32 overflow-hidden w-full hidden md:block">
            <div
              className="absolute inset-0 w-full h-full"
              style={{
                backgroundImage: `url(${settingsHeaderBg})`,
                backgroundSize: "100% 100%",
                backgroundPosition: "center",
                backgroundRepeat: "no-repeat",
              }}
            />
            <Link
              to={createPageUrl("Dashboard")}
              className="absolute top-4 right-6 w-10 h-10 bg-white/30 rounded-full flex items-center justify-center backdrop-blur-sm hover:bg-white/50 transition-colors z-10"
            >
              <ChevronLeft className="w-6 h-6 text-gray-800 rotate-180" />
            </Link>
          </div>

          <div className="md:px-8 md:pt-0">
            <div className="bg-transparent md:bg-transparent min-h-screen md:min-h-0 pt-0 md:pt-0 px-4 md:px-0">
              {/* Desktop only title */}
              <div className="text-center pb-4 -mt-6 hidden md:block">
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                  התראות
                </h1>
              </div>

              {loading ? (
                <div className="flex justify-center items-center py-4">
                  <div className="text-gray-500">טוען...</div>
                </div>
              ) : notifications.length === 0 ? (
                <div className="flex justify-center items-center py-4">
                  <div className="text-gray-500 font-bold text-lg">אין התראות כרגע</div>
                </div>
              ) : (
                <div className="pb-10">
                  {/* Mobile: Use an inner card container */}
                  <div className="md:hidden w-full bg-white border border-gray-100 rounded-[28px] shadow-[0_4px_20px_rgba(0,0,0,0.03)] overflow-hidden">
                    {notifications.map((notif, index) => {
                      const config = getNotificationConfig(notif.type);
                      const Icon = config.icon;
                      return (
                        <motion.div
                          key={notif.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.4, delay: index * 0.05 }}
                          className="flex items-center gap-4 py-5 px-5 border-b border-gray-100 last:border-b-0 cursor-pointer"
                          onClick={() => handleNotificationClick(notif)}
                        >
                          {/* Icon on the right */}
                          <div className="w-10 h-10 rounded-full border border-blue-200 bg-white flex items-center justify-center flex-shrink-0">
                            <Icon className="w-5 h-5 text-blue-500" />
                          </div>

                          {/* Content in the middle - Smaller & Truncated */}
                          <div className="flex-1 text-right overflow-hidden">
                            <p className="text-gray-500 text-[10px] mb-0.5 truncate">
                              {config.title}
                            </p>
                            <p className="font-bold text-gray-900 text-[12px] leading-tight truncate">
                              {notif.message || "התראה חדסה"}
                            </p>
                          </div>

                          {/* Date on the left */}
                          <span className="text-gray-400 text-[10px] font-medium min-w-[50px] text-left">
                            {formatDate(notif.created_date || notif.created_at)}
                          </span>
                        </motion.div>
                      );
                    })}
                  </div>

                  {/* Desktop: Original layout with pagination */}
                  <div className="hidden md:block space-y-0">
                    {paginatedNotifications.map((notif, index) => {
                      const config = getNotificationConfig(notif.type);
                      const Icon = config.icon;
                      return (
                        <motion.div
                          key={notif.id}
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.5, delay: index * 0.1 }}
                          className="flex items-center gap-8 py-6 border-b border-gray-100 last:border-b-0 cursor-pointer"
                          onClick={() => handleNotificationClick(notif)}
                        >
                          {/* Icon on the right */}
                          <div className="w-12 h-12 rounded-full border border-blue-200 bg-white flex items-center justify-center flex-shrink-0 order-1">
                            <Icon className="w-6 h-6 text-blue-500" />
                          </div>

                          {/* Content in the middle */}
                          <div className="flex-1 text-right order-2">
                            <p className="text-gray-500 text-[15px] mb-1">
                              {config.title}
                            </p>
                            <p className="font-bold text-gray-900 text-[18px] leading-tight">
                              {notif.message || "התראה חדשה"}
                            </p>
                          </div>

                          {/* Date on the left */}
                          <span className="text-gray-400 text-sm font-medium min-w-[80px] text-left order-3">
                            {formatDate(notif.created_date || notif.created_at)}
                          </span>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Pagination visible only on Desktop */}
              {notifications.length > 0 && (
                <div className="hidden md:flex justify-center items-center pt-10 pb-16">
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
                    {pageNumbers.map((number) => (
                      <Button
                        key={number}
                        variant="ghost"
                        onClick={() => goToPage(number)}
                        className={`rounded-full w-9 h-9 transition-colors ${currentPage === number
                          ? "bg-blue-600 text-white font-bold shadow-md"
                          : "text-gray-600 hover:bg-gray-100"
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

              {/* Added bottom padding for mobile to ensure scrollability feels right */}
              <div className="md:hidden h-20" />
            </div>
          </div>
        </div>
      </div>

      {/* Notification Details Dialog */}
      <Dialog open={!!selectedNotification} onOpenChange={closeDialog}>
        <DialogContent className="sm:max-w-md text-right border-0 shadow-2xl rounded-[32px] p-6" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-3">
              {selectedNotification && (() => {
                const config = getNotificationConfig(selectedNotification.type);
                const Icon = config.icon;
                return (
                  <>
                    <div className="w-10 h-10 rounded-full border border-blue-100 bg-blue-50 flex items-center justify-center">
                      <Icon className="w-5 h-5 text-blue-500" />
                    </div>
                    <span className="text-gray-900">{config.title}</span>
                  </>
                );
              })()}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-6">
            <div className="bg-gray-50/50 p-5 rounded-2xl border border-gray-100">
              <p className="text-gray-800 text-lg font-bold leading-relaxed">
                {selectedNotification?.message}
              </p>
            </div>
            <div className="flex justify-between items-center text-sm text-gray-400 px-1">
              <span>תאריך קבלה:</span>
              <span className="font-medium">{selectedNotification && formatDate(selectedNotification.created_date || selectedNotification.created_at)}</span>
            </div>
          </div>
          <DialogFooter className="sm:justify-start flex-col gap-3">
            {selectedNotification?.type === 'application_submitted' && selectedNotification?.data?.applicant_email && (
              <Button
                type="button"
                variant="default"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-full h-12 font-bold shadow-lg shadow-blue-100"
                onClick={() => {
                  const jobIdParam = selectedNotification.data?.job_id ? `&jobId=${selectedNotification.data.job_id}` : '';
                  navigate(`/CandidateProfile?email=${selectedNotification.data.applicant_email}${jobIdParam}`);
                  closeDialog();
                }}
              >
                צפה בפרופיל המועמד
              </Button>
            )}
            <Button
              type="button"
              variant="secondary"
              onClick={closeDialog}
              className="w-full rounded-full h-12 font-bold bg-gray-100 hover:bg-gray-200 text-gray-700 border-0"
            >
              סגור
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
