
import React, { useState, useEffect } from "react";
import { User } from "@/api/entities";
import { UserAnalytics } from "@/components/UserAnalytics";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    TrendingUp,
    Eye,
    FileText,
    X,
    Heart,
    Search,
    ChevronLeft,
    Calendar,
    BarChart3,
    Activity
} from "lucide-react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { useRequireUserType } from "@/hooks/use-require-user-type";
import settingsHeaderBg from "@/assets/settings_header_bg.png";

const actionTypeLabels = {
    job_match: "התאמת משרה",
    job_view: "צפייה במשרה",
    job_apply: "הגשת מועמדות",
    job_reject: "דחיית משרה",
    job_save: "שמירת משרה",
    job_unsave: "ביטול שמירה",
    profile_view: "צפייה בפרופיל",
    search_query: "חיפוש"
};

const actionTypeIcons = {
    job_match: TrendingUp,
    job_view: Eye,
    job_apply: FileText,
    job_reject: X,
    job_save: Heart,
    job_unsave: Heart,
    profile_view: Eye,
    search_query: Search
};

const actionTypeColors = {
    job_match: "bg-blue-100 text-blue-800",
    job_view: "bg-green-100 text-green-800",
    job_apply: "bg-purple-100 text-purple-800",
    job_reject: "bg-red-100 text-red-800",
    job_save: "bg-yellow-100 text-yellow-800",
    job_unsave: "bg-gray-100 text-gray-800",
    profile_view: "bg-indigo-100 text-indigo-800",
    search_query: "bg-orange-100 text-orange-800"
};

export default function UserActivity() {
    useRequireUserType(); // Ensure user has selected a user type
    const [user, setUser] = useState(null);
    const [stats, setStats] = useState(null);
    const [activity, setActivity] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('stats');

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const userData = await User.me();
            setUser(userData);

            if (userData?.email) {
                const [userStats, userActivity] = await Promise.all([
                    UserAnalytics.getUserStats(userData.email),
                    UserAnalytics.getUserActivity(userData.email, 100)
                ]);

                setStats(userStats);
                setActivity(userActivity);
            }
        } catch (error) {
            console.error("Error loading user activity data:", error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="p-4 md:p-6" dir="rtl">
                <div className="max-w-4xl mx-auto">
                    <div className="h-64 bg-gradient-to-r from-gray-100 to-gray-200 rounded-2xl animate-pulse" />
                </div>
            </div>
        );
    }

    const StatCard = ({ title, value, icon: Icon, color = "bg-blue-50" }) => (
        <Card className="bg-white border-gray-200/80 shadow-sm hover:shadow-md transition-all duration-300 rounded-2xl">
            <CardContent className="p-6 text-center">
                <div className={`w-12 h-12 ${color} rounded-full flex items-center justify-center mx-auto mb-3`}>
                    <Icon className="w-6 h-6 text-blue-600" />
                </div>
                <div className="text-2xl font-bold text-gray-900 mb-2">{value || 0}</div>
                <p className="text-gray-600 font-medium text-sm">{title}</p>
            </CardContent>
        </Card>
    );

    return (
        <div className="p-4 md:p-6" dir="rtl">
            <div className="max-w-6xl mx-auto">
                <Card className="bg-white rounded-2xl md:rounded-[2.5rem] shadow-xl border border-gray-100 overflow-hidden">
                    <div className="relative">
                        {/* Header */}
                        <div className="relative h-24 overflow-hidden -m-px">
                            <div
                                className="absolute inset-0 w-full h-full"
                                style={{
                                    backgroundImage: `url(${settingsHeaderBg})`,
                                    backgroundSize: '100% 100%',
                                    backgroundPosition: 'center',
                                    backgroundRepeat: 'no-repeat'
                                }}
                            />
                            <Link to={createPageUrl("Dashboard")} className="absolute top-4 right-6 w-10 h-10 bg-white/30 rounded-full flex items-center justify-center backdrop-blur-sm hover:bg-white/50 transition-colors z-10">
                                <ChevronLeft className="w-6 h-6 text-gray-800 rotate-180" />
                            </Link>
                        </div>

                        <CardContent className="p-4 sm:p-6 md:p-8 -mt-6 relative z-10">
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 0.5 }}
                                className="space-y-8"
                            >
                                {/* Header */}
                                <div className="text-center">
                                    <h1 className="text-3xl md:text-4xl font-bold text-gray-900">פעילות המשתמש</h1>
                                    <p className="text-gray-600 mt-2">{user?.full_name || 'משתמש'}</p>
                                </div>

                                {/* Tab Navigation */}
                                <div className="flex justify-center gap-2">
                                    <Button
                                        variant={activeTab === 'stats' ? 'default' : 'outline'}
                                        onClick={() => setActiveTab('stats')}
                                        className="rounded-full px-6 py-2"
                                    >
                                        <BarChart3 className="w-4 h-4 ml-2" />
                                        סטטיסטיקות
                                    </Button>
                                    <Button
                                        variant={activeTab === 'activity' ? 'default' : 'outline'}
                                        onClick={() => setActiveTab('activity')}
                                        className="rounded-full px-6 py-2"
                                    >
                                        <Activity className="w-4 h-4 ml-2" />
                                        פעילות אחרונה
                                    </Button>
                                </div>

                                {/* Content */}
                                {activeTab === 'stats' && stats && (
                                    <div className="space-y-6">
                                        {/* Stats Grid */}
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                            <StatCard
                                                title="התאמות משרה"
                                                value={stats.total_job_matches}
                                                icon={TrendingUp}
                                                color="bg-blue-50"
                                            />
                                            <StatCard
                                                title="צפיות במשרות"
                                                value={stats.total_job_views}
                                                icon={Eye}
                                                color="bg-green-50"
                                            />
                                            <StatCard
                                                title="מועמדויות"
                                                value={stats.total_applications}
                                                icon={FileText}
                                                color="bg-purple-50"
                                            />
                                            <StatCard
                                                title="משרות שנדחו"
                                                value={stats.total_rejections}
                                                icon={X}
                                                color="bg-red-50"
                                            />
                                        </div>

                                        {/* Additional Stats */}
                                        {stats.most_viewed_company && (
                                            <Card className="bg-gray-50/80 rounded-2xl p-6">
                                                <h3 className="font-bold text-lg mb-3 text-center">החברה הנצפית ביותר</h3>
                                                <p className="text-center text-2xl font-bold text-blue-600">{stats.most_viewed_company}</p>
                                            </Card>
                                        )}
                                    </div>
                                )}

                                {activeTab === 'activity' && (
                                    <div className="space-y-4">
                                        <h3 className="text-xl font-bold text-gray-900 text-center mb-6">פעילות אחרונה</h3>

                                        {activity.length > 0 ? (
                                            <div className="space-y-3">
                                                {activity.map((action, index) => {
                                                    const Icon = actionTypeIcons[action.action_type] || Activity;
                                                    const colorClass = actionTypeColors[action.action_type] || "bg-gray-100 text-gray-800";

                                                    return (
                                                        <motion.div
                                                            key={action.id}
                                                            initial={{ opacity: 0, y: 20 }}
                                                            animate={{ opacity: 1, y: 0 }}
                                                            transition={{ duration: 0.3, delay: index * 0.05 }}
                                                            className="flex items-center justify-between p-4 bg-white border border-gray-200/80 rounded-xl hover:shadow-md transition-shadow"
                                                        >
                                                            <div className="flex items-center gap-4">
                                                                <span className="text-sm text-gray-500">
                                                                    {format(new Date(action.created_date), "dd/MM/yy HH:mm")}
                                                                </span>
                                                                <Badge className={`${colorClass} border-0`}>
                                                                    <Icon className="w-3 h-3 ml-1" />
                                                                    {actionTypeLabels[action.action_type]}
                                                                </Badge>
                                                            </div>
                                                            <div className="text-right">
                                                                {action.job_title && (
                                                                    <p className="font-medium text-gray-900">{action.job_title}</p>
                                                                )}
                                                                {action.job_company && (
                                                                    <p className="text-sm text-gray-600">{action.job_company}</p>
                                                                )}
                                                                {action.match_score && (
                                                                    <p className={`text-xs ${action.match_score >= 70 ? 'text-green-600' : action.match_score >= 40 ? 'text-orange-600' : 'text-red-600'}`}>{action.match_score}% התאמה</p>
                                                                )}
                                                            </div>
                                                        </motion.div>
                                                    );
                                                })}
                                            </div>
                                        ) : (
                                            <div className="text-center py-12 text-gray-500">
                                                אין פעילות להצגה
                                            </div>
                                        )}
                                    </div>
                                )}
                            </motion.div>
                        </CardContent>
                    </div>
                </Card>
            </div>
        </div>
    );
}
