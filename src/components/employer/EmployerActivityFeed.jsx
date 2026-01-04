import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  Eye,
  Edit,
  User,
  MessageCircle,
  FileText,
  Pause,
  CheckCircle
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { he } from 'date-fns/locale';

const ACTION_CONFIG = {
  job_create: {
    icon: Plus,
    label: 'יצר משרה חדשה',
    color: 'bg-green-100 text-green-700'
  },
  job_publish: {
    icon: CheckCircle,
    label: 'פרסם משרה',
    color: 'bg-blue-100 text-blue-700'
  },
  job_edit: {
    icon: Edit,
    label: 'ערך משרה',
    color: 'bg-yellow-100 text-yellow-700'
  },
  job_view: {
    icon: Eye,
    label: 'צפה במשרה',
    color: 'bg-gray-100 text-gray-700'
  },
  candidate_view: {
    icon: User,
    label: 'צפה במועמד',
    color: 'bg-purple-100 text-purple-700'
  },
  application_review: {
    icon: FileText,
    label: 'סקר מועמדות',
    color: 'bg-indigo-100 text-indigo-700'
  },
  message_send: {
    icon: MessageCircle,
    label: 'שלח הודעה',
    color: 'bg-pink-100 text-pink-700'
  },
  job_pause: {
    icon: Pause,
    label: 'השהה משרה',
    color: 'bg-orange-100 text-orange-700'
  },
  application_received: {
    icon: FileText,
    label: 'הוגשה מועמדות',
    color: 'bg-green-100 text-green-700'
  }
};

export default function EmployerActivityFeed({ activities = [], className = "" }) {
  if (activities.length === 0) {
    return (
      <Card className={`bg-white rounded-2xl shadow-sm border border-gray-200 ${className}`}>
        <CardHeader>
          <CardTitle className="text-lg font-bold text-gray-900" dir="rtl">פעילות אחרונה</CardTitle>
        </CardHeader>
        <CardContent className="text-center py-8">
          <p className="text-gray-500">אין פעילות אחרונה</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`bg-white rounded-2xl shadow-sm border border-gray-200 ${className}`}>
      <CardHeader>
        <CardTitle className="text-lg font-bold text-gray-900" dir="rtl">פעילות אחרונה</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {activities.map((activity, index) => {
          const config = ACTION_CONFIG[activity.action_type] || {
            icon: Eye,
            label: activity.action_type,
            color: 'bg-gray-100 text-gray-700'
          };

          const Icon = config.icon;
          const timeAgo = formatDistanceToNow(new Date(activity.created_date), {
            addSuffix: true,
            locale: he
          });

          return (
            <div key={activity.id || index} className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors" dir="rtl">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${config.color}`}>
                <Icon className="w-5 h-5" />
              </div>
              <div className="flex-1 text-right">
                <div className="flex items-center gap-2 justify-end">
                  <Badge variant="outline" className="text-xs">
                    {config.label}
                  </Badge>
                </div>
                {activity.job_title && (
                  <p className="font-medium text-gray-900 mt-1">{activity.job_title}</p>
                )}
                {activity.candidate_name && (
                  <p className="text-gray-600 text-sm">מועמד: {activity.candidate_name}</p>
                )}
                <p className="text-xs text-gray-500 mt-1">{timeAgo}</p>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}