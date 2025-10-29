import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import NotificationItem from "@/components/notifications/NotificationItem";
import NotificationsPagination from "@/components/notifications/NotificationsPagination";

const ITEMS_PER_PAGE = 7;

export default function Notifications() {
  const [currentPage, setCurrentPage] = useState(1);
  const [notifications, setNotifications] = useState([]);
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
                <NotificationItem
                  key={notif.id}
                  notif={notif}
                  index={index}
                />
              ))}
            </div>

            <NotificationsPagination
              currentPage={currentPage}
              totalPages={totalPages}
              goToPage={goToPage}
              pageNumbers={pageNumbers}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
