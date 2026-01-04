import React, { useState, useEffect } from 'react';
import { User, Job, JobView } from '@/api/entities';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import JobStatsItem from '@/components/JobStatsItem';
import { useRequireUserType } from "@/hooks/use-require-user-type";
import { ChevronRight } from "lucide-react";
import { useNavigate } from 'react-router-dom';
import settingsHeaderBg from "@/assets/settings_header_bg.png";

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

            // Sort in memory to ensure newest jobs are first
            const sortedJobs = userJobs.sort((a, b) => {
                const dateA = new Date(a.created_date);
                const dateB = new Date(b.created_date);
                return dateB - dateA;
            });
            setJobs(sortedJobs);

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

    const activeStatuses = ['active', 'paused'];
    const expiredStatuses = ['closed', 'filled', 'filled_via_metch'];

    const filteredJobs = jobs.filter(job => {
        if (activeView === 'active') {
            return activeStatuses.includes(job.status);
        } else {
            return expiredStatuses.includes(job.status);
        }
    });

    return (
        <div className="h-full relative" dir="rtl">
            <div className="relative">
                {/* Header Background */}
                <div className="relative h-32 overflow-hidden w-full">
                    <div
                        className="absolute inset-0 w-full h-full"
                        style={{
                            backgroundImage: `url(${settingsHeaderBg})`,
                            backgroundSize: '100% 100%',
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

                <div className="p-4 sm:p-6 md:p-8 -mt-16 relative z-10 w-[75%] mx-auto">
                    {/* Title */}
                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-bold text-[#1a237e]">הסטטיסטיקות שלי</h1>
                    </div>

                    {/* Toggle */}
                    <div className="flex justify-end mb-12">
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
                    <div className="grid grid-cols-12 gap-4 px-4 mb-4 text-gray-600 text-sm font-medium items-center">
                        <div className="col-span-4 text-right pr-4">משרה</div>
                        <div className="col-span-2 text-center invisible">מיקום</div>
                        <div className="col-span-2 text-center invisible">תאריך</div>
                        <div className="col-span-2 text-center">קו"ח שהוגשו</div>
                        <div className="col-span-2 text-center">צפיות</div>
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

                </div>
            </div>
        </div>
    );
}
