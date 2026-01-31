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

const ITEMS_PER_PAGE = 7;

// Allowed notification types
const EMPLOYER_ALLOWED_NOTIFICATION_TYPES = ['application_submitted', 'new_message'];
const SEEKER_ALLOWED_NOTIFICATION_TYPES = ['profile_view', 'new_message'];

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




      // Fetch all notifications for the user using all possible identifiers
      const [byUserId, byEmail, byCreatedBy] = await Promise.all([
        Notification.filter({ user_id: user.id }, "-created_date"),
        Notification.filter({ email: user.email }, "-created_date"),
        Notification.filter({ created_by: user.id }, "-created_date")
      ]);

      // Merge and deduplicate
      const allNotifications = [...byUserId, ...byEmail, ...byCreatedBy]
        .reduce((acc, current) => {
          const x = acc.find(item => item.id === current.id);
          if (!x) return acc.concat([current]);
          return acc;
        }, [])
        .sort((a, b) => new Date(b.created_date || b.created_at) - new Date(a.created_date || a.created_at));

      // Filter based on user type
      const allowedTypes = user.user_type === 'employer'
        ? EMPLOYER_ALLOWED_NOTIFICATION_TYPES
        : SEEKER_ALLOWED_NOTIFICATION_TYPES;

      const filteredNotifications = allNotifications.filter(notif => allowedTypes.includes(notif.type));
      console.log('[NotificationsPage] Displaying filtered notifications:', filteredNotifications.length, filteredNotifications.map(n => n.type));

      setNotifications(filteredNotifications);

    } catch (error) {
      console.error("Error loading notifications:", error);
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  }, [user?.email, user?.id, user?.user_type]);

  // Handle auto-opening notification from state
  useEffect(() => {
    if (notifications.length > 0 && location.state?.selectedNotificationId) {
      const notifId = location.state.selectedNotificationId;
      const notif = notifications.find(n => n.id === notifId);
      if (notif) {
        setSelectedNotification(notif);
        // Mark as read if it's not
        if (notif.is_read === 'false' || notif.is_read === false) {
          handleNotificationClick(notif);
        }
        // Clean up state to avoid re-opening on manual refresh/nav
        window.history.replaceState({}, document.title);
      }
    }
  }, [notifications, location.state, navigate]);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  // Mark all unread notifications as read when page is visited
  useEffect(() => {
    const markAllAsRead = async () => {
      if (!user?.email || notifications.length === 0) return;

      const unreadNotifications = notifications.filter(
        n => n.is_read === false || n.is_read === 'false'
      );
      console.log('[NotificationsPage] Unread notifications count:', unreadNotifications.length);

      if (unreadNotifications.length > 0) {
        try {
          // Mark all as read in parallel
          await Promise.all(
            unreadNotifications.map(notif =>
              Notification.update(notif.id, { is_read: true })
            )
          );

          // Update local state
          setNotifications(prev =>
            prev.map(n => ({ ...n, is_read: true, read: true }))
          );

          // Force refresh badges immediately
          // Using a small timeout to ensure DB trigger (if any) or prop changes propagate
          setTimeout(() => {
            if (user?.id) refreshUnreadCount(user.id, user.email);
          }, 100);

        } catch (error) {
          console.error('Error marking notifications as read:', error);
        }
      } else {
        console.log('[Notifications] No unread notifications to mark.');
      }
    };

    markAllAsRead();
  }, [user?.email, notifications]); // Run when notifications change to catch loaded data

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
    // Mark as read immediately
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

    // Navigation logic
    if (notif.type === 'new_message') {
      console.log('[Notifications] Navigating for message. User:', user);

      // Route based on user type with fallback checks
      const isSeeker =
        user?.user_type === 'seeker' ||
        (user?.full_name && !user?.company_name) || // Fallback: has name but no company
        window.location.pathname.includes('seeker'); // Fallback: current page context

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

    // Default behavior for other types
    setSelectedNotification(notif);
  };

  const closeDialog = () => setSelectedNotification(null);

  return (
    <div className="h-full relative" dir="rtl">
      <div className="relative">
        <div className="relative h-32 overflow-hidden w-full">
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

        <div className="p-4 sm:p-6 md:p-8 -mt-16 relative z-10 w-full max-w-7xl mx-auto">
          <div className="text-center pb-8">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
              התראות
            </h1>
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
                    <div
                      onClick={() => handleNotificationClick(notif)}
                      className="flex items-center justify-center w-10 h-10 rounded-full border border-gray-300 bg-white flex-shrink-0 cursor-pointer hover:bg-gray-50 transition-colors"
                    >
                      <Icon className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="flex-1 text-right px-4 sm:px-8">
                      <p className="font-semibold text-gray-800">
                        {config.title}
                      </p>
                      <p className="font-bold text-gray-900 mt-1">
                        {notif.message || "התראה חדשה"}
                      </p>
                    </div>
                    <span className="text-gray-500 text-sm whitespace-nowrap">
                      {formatDate(notif.created_date || notif.created_at)}
                    </span>
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
        </div>
      </div>

      {/* Notification Details Dialog */}
      <Dialog open={!!selectedNotification} onOpenChange={closeDialog}>
        <DialogContent className="sm:max-w-md text-right" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              {selectedNotification && (() => {
                const config = getNotificationConfig(selectedNotification.type);
                const Icon = config.icon;
                return <><Icon className="w-6 h-6 text-blue-600" /> {config.title}</>;
              })()}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-gray-700 text-lg font-medium leading-relaxed">
                {selectedNotification?.message}
              </p>
            </div>
            <div className="flex justify-between items-center text-sm text-gray-500">
              <span>תאריך קבלה:</span>
              <span>{selectedNotification && formatDate(selectedNotification.created_date || selectedNotification.created_at)}</span>
            </div>
          </div>
          <DialogFooter className="sm:justify-start flex-col gap-2">
            {selectedNotification?.type === 'application_submitted' && selectedNotification?.data?.applicant_email && (
              <Button
                type="button"
                variant="default"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                onClick={() => {
                  navigate(`/CandidateProfile?email=${selectedNotification.data.applicant_email}`);
                  closeDialog();
                }}
              >
                צפה בפרופיל המועמד
              </Button>
            )}
            <Button type="button" variant="secondary" onClick={closeDialog} className="w-full">
              סגור
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
