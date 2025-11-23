import React, { useState, useEffect } from 'react';
import { User, Job, JobView } from '@/api/entities';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import JobStatsItem from '@/components/JobStatsItem';
import { useRequireUserType } from "@/hooks/use-require-user-type";
import { ChevronRight } from "lucide-react";
import { useNavigate } from 'react-router-dom';

export default function Statistics() {
    useRequireUserType();
    const navigate = useNavigate();
    const [jobs, setJobs] = useState([]);
    const [jobViews, setJobViews] = useState({});
    const [loading, setLoading] = useState(true);
    const [activeView, setActiveView] = useState('active'); // 'active' or 'expired'

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const userData = await User.me();
            if (!userData) return;

            // Fetch all jobs for the user
            const userJobs = await Job.filter({ created_by: userData.email }, "-created_date", 100);
            setJobs(userJobs);

            // Fetch view counts for these jobs
            // Since we don't have a direct aggregation, we might need to fetch counts individually or all views
            // For optimization, if there are many jobs, this might be heavy. 
            // Assuming we can filter JobView by job_id.

            const viewsMap = {};

            // Parallelize fetching view counts
            await Promise.all(userJobs.map(async (job) => {
                // This is not ideal for many jobs, but sticking to available API patterns
                // If JobView has a count method or we can filter by job_id
                const views = await JobView.filter({ job_id: job.id });
                viewsMap[job.id] = views.length;
            }));

            setJobViews(viewsMap);

        } catch (error) {
            console.error("Error loading statistics:", error);
        } finally {
            setLoading(false);
        }
    };

    const activeStatuses = ['active', 'paused', 'draft'];
    const expiredStatuses = ['closed', 'filled', 'filled_via_metch'];

    const filteredJobs = jobs.filter(job => {
        if (activeView === 'active') {
            return activeStatuses.includes(job.status);
        } else {
            return expiredStatuses.includes(job.status);
        }
    });

    return (
        <div className="p-4 md:p-6 min-h-screen bg-gray-50/50" dir="rtl">
            <div className="w-[85vw] mx-auto">
                <Card className="bg-white rounded-[2.5rem] shadow-xl border border-gray-100 overflow-hidden min-h-[80vh]">
                    <div className="relative">
                        {/* Header Background */}
                        <div className="relative h-32 overflow-hidden">
                            <div
                                className="absolute inset-0 w-full h-full [clip-path:ellipse(120%_100%_at_50%_100%)]"
                                style={{
                                    backgroundImage: 'url(https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/689c85a409a96fa6a10f1aca/d9fc7bd69_Rectangle6463.png)',
                                    backgroundSize: 'cover',
                                    backgroundPosition: 'center',
                                    backgroundRepeat: 'no-repeat'
                                }}
                            />
                            <button
                                onClick={() => navigate(-1)}
                                className="absolute top-8 right-8 p-2 bg-white/80 rounded-full hover:bg-white transition-colors z-20"
                            >
                                <ChevronRight className="w-6 h-6 text-gray-600" />
                            </button>
                        </div>

                        <CardContent className="p-4 sm:p-6 md:p-8 -mt-8 relative z-10">
                            {/* Title */}
                            <div className="text-center mb-8">
                                <h1 className="text-3xl font-bold text-[#1a237e]">הסטטיסטיקות שלי</h1>
                            </div>

                            {/* Toggle */}
                            <div className="flex justify-center mb-12">
                                <div className="flex bg-white border border-blue-200 rounded-full p-1 shadow-sm">
                                    <button
                                        onClick={() => setActiveView('active')}
                                        className={`px-8 py-2 rounded-full text-sm font-medium transition-all duration-200 ${activeView === 'active'
                                            ? 'bg-[#2d7ec8] text-white shadow-md'
                                            : 'text-gray-500 hover:bg-gray-50'
                                            }`}
                                    >
                                        משרות פעילות
                                    </button>
                                    <button
                                        onClick={() => setActiveView('expired')}
                                        className={`px-8 py-2 rounded-full text-sm font-medium transition-all duration-200 ${activeView === 'expired'
                                            ? 'bg-[#2d7ec8] text-white shadow-md'
                                            : 'text-gray-500 hover:bg-gray-50'
                                            }`}
                                    >
                                        משרות שהסתיימו
                                    </button>
                                </div>
                            </div>

                            {/* Table Headers */}
                            <div className="flex items-center gap-12 px-4 mb-4 text-gray-600 text-sm font-medium">
                                <div className="flex-1 text-right pr-4">משרה</div>
                                <div className="w-32 text-right">מיקום</div>
                                <div className="w-32 text-center">תאריך</div>
                                <div className="w-24 text-center">קו"ח שהוגשו</div>
                                <div className="w-24 text-center">צפיות</div>
                            </div>

                            {/* List */}
                            <div className="space-y-2">
                                {loading ? (
                                    <div className="space-y-4">
                                        {[1, 2, 3].map(i => (
                                            <div key={i} className="h-20 bg-gray-100 rounded-2xl animate-pulse" />
                                        ))}
                                    </div>
                                ) : filteredJobs.length > 0 ? (
                                    filteredJobs.map(job => (
                                        <JobStatsItem
                                            key={job.id}
                                            job={job}
                                            viewsCount={jobViews[job.id] || 0}
                                        />
                                    ))
                                ) : (
                                    <div className="text-center py-12 text-gray-500">
                                        לא נמצאו משרות {activeView === 'active' ? 'פעילות' : 'שהסתיימו'}
                                    </div>
                                )}
                            </div>

                        </CardContent>
                    </div>
                </Card>
            </div>
        </div>
    );
}
