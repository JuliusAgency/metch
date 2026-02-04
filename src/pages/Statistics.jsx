import React, { useState, useEffect } from 'react';
import { User, Job, JobView, JobApplication } from '@/api/entities';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import JobStatsItem from '@/components/JobStatsItem';
import { useRequireUserType } from "@/hooks/use-require-user-type";
import { ChevronRight, ChevronLeft } from "lucide-react";
import { useNavigate } from 'react-router-dom';
import settingsHeaderBg from "@/assets/settings_header_bg.png";
import settingsMobileBg from "@/assets/payment_mobile_header.png";

export default function Statistics() {
    useRequireUserType();
    const navigate = useNavigate();
    const [jobs, setJobs] = useState([]);
    const [jobViews, setJobViews] = useState({});
    const [jobApplications, setJobApplications] = useState({});
    const [loading, setLoading] = useState(true);
    const [activeView, setActiveView] = useState('active'); // 'active' or 'expired'
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 10;

    useEffect(() => {
        loadData();
    }, []);

    useEffect(() => {
        setCurrentPage(1); // Reset to page 1 when switching views
    }, [activeView]);

    const loadData = async () => {
        setLoading(true);
        try {
            const userData = await User.me();
            if (!userData) return;

            // Fetch all jobs for the user
            const userJobs = await Job.filter({ created_by: userData.email }, "-created_date");

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
            const appsMap = {};

            // Parallelize fetching view and application counts
            // For accurate counts, we should ideally verify if the applicant user still exists (same logic as dashboard)
            await Promise.all(userJobs.map(async (job) => {
                const [views, apps] = await Promise.all([
                    JobView.filter({ job_id: job.id }),
                    JobApplication.filter({ job_id: job.id })
                ]);
                viewsMap[job.id] = views.length;

                // Sync Stats Fix: Verify applications have valid profiles if count is small (<=20)
                // This mimics dashboard logic to avoid mismatches
                if (apps.length > 0 && apps.length <= 20) {
                    try {
                        // Quick verification of profiles without full load
                        const validApps = await Promise.all(apps.map(async (app) => {
                            if (app.applicant_id) {
                                const p = await User.get(app.applicant_id).catch(() => null);
                                return p ? app : null;
                            } else if (app.applicant_email) {
                                // Fallback for older records or email-based systems
                                // We use User table for auth check, or UserProfile for profile check.
                                // Let's purely check if a relevant profile exists in UserProfile as that drives the Dashboard list
                                const p = await UserProfile.filter({ email: app.applicant_email }).catch(() => []);
                                return p.length > 0 ? app : null;
                            }
                            return null;
                        }));
                        appsMap[job.id] = validApps.filter(Boolean).length;
                    } catch (e) {
                        console.warn('Error verifying apps for stats, using raw count', e);
                        appsMap[job.id] = apps.length;
                    }
                } else {
                    appsMap[job.id] = apps.length;
                }
            }));

            setJobViews(viewsMap);
            setJobApplications(appsMap);

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

    // Pagination calculations
    const totalPages = Math.ceil(filteredJobs.length / ITEMS_PER_PAGE);
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    const paginatedJobs = filteredJobs.slice(startIndex, endIndex);

    return (
        <div className="h-full relative" dir="rtl">
            {/* Mobile-Only Background Image */}
            <div
                className="md:hidden fixed top-0 left-0 right-0 z-0 pointer-events-none"
                style={{
                    width: '100%',
                    height: '230px',
                    backgroundImage: `url(${settingsMobileBg})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    backgroundRepeat: 'no-repeat'
                }}
            />

            <div className="relative">
                {/* Desktop Header Background */}
                <div className="relative h-40 overflow-hidden w-full hidden md:block">
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
                        className="absolute top-8 right-8 p-2 bg-white/80 rounded-full hover:bg-white transition-colors z-[60]"
                    >
                        <ChevronRight className="w-6 h-6 text-gray-600" />
                    </button>

                    {/* Title - Higher on the header */}
                    <div className="absolute top-8 left-0 right-0 text-center z-20">
                        <h1 className="text-3xl font-bold text-[#1a237e]">הסטטיסטיקות שלי</h1>
                    </div>
                </div>

                {/* Mobile Title */}
                <div className="text-center pt-24 pb-4 md:hidden relative z-10">
                    <h1 className="text-[24px] font-bold text-[#001a6e]">הסטטיסטיקות שלי</h1>
                </div>

                <div className="p-0 sm:p-6 md:p-8 mt-6 md:-mt-20 relative z-10 w-full md:w-[72%] mx-auto">
                    {/* Toggle - Centered */}
                    <div className="flex justify-center mb-6 md:mb-8 pt-4 md:pt-0">
                        <div className="flex bg-white border border-blue-200 rounded-full p-1 shadow-sm">
                            <button
                                onClick={() => setActiveView('active')}
                                className={`px-6 md:px-8 py-2 rounded-full text-xs md:text-sm font-medium transition-all duration-200 ${activeView === 'active'
                                    ? 'bg-[#2d7ec8] text-white shadow-md'
                                    : 'text-gray-500 hover:bg-gray-50'
                                    }`}
                            >
                                משרות פעילות
                            </button>
                            <button
                                onClick={() => setActiveView('expired')}
                                className={`px-6 md:px-8 py-2 rounded-full text-xs md:text-sm font-medium transition-all duration-200 ${activeView === 'expired'
                                    ? 'bg-[#2d7ec8] text-white shadow-md'
                                    : 'text-gray-500 hover:bg-gray-50'
                                    }`}
                            >
                                משרות שהסתיימו
                            </button>
                        </div>
                    </div>

                    {/* Desktop Table Headers */}
                    <div className="hidden md:grid grid-cols-12 gap-4 px-4 mb-4 text-gray-600 text-sm font-medium items-center">
                        <div className="col-span-4 text-right pr-4">משרה</div>
                        <div className="col-span-2 text-center invisible">מיקום</div>
                        <div className="col-span-2 text-center invisible">תאריך</div>
                        <div className="col-span-2 text-center">קו"ח שהוגשו</div>
                        <div className="col-span-2 text-center">צפיות</div>
                    </div>

                    {/* Mobile Table Headers */}
                    <div className="flex md:hidden w-full items-center justify-between px-6 mb-2 text-gray-900 text-[10px] font-bold">
                        <div className="w-[45%] text-right pr-2">משרה</div>
                        {/* Empty spacer for date to align optically or labels if needed */}
                        <div className="w-[25%] text-center"></div>
                        <div className="w-[15%] text-center leading-tight">קו״ח<br />שהוגשו</div>
                        <div className="w-[15%] text-center">צפיות</div>
                    </div>

                    {/* List */}
                    <div className="space-y-3">
                        {loading ? (
                            <div className="space-y-3">
                                {[1, 2, 3, 4, 5].map(i => (
                                    <div key={i} className="h-20 bg-gray-100 rounded-2xl animate-pulse shadow-md" />
                                ))}
                            </div>
                        ) : paginatedJobs.length > 0 ? (
                            paginatedJobs.map(job => (
                                <JobStatsItem
                                    key={job.id}
                                    job={job}
                                    viewsCount={jobViews[job.id] || 0}
                                    applicationsCount={jobApplications[job.id] || 0}
                                />
                            ))
                        ) : (
                            <div className="text-center py-12 text-gray-500">
                                לא נמצאו משרות {activeView === 'active' ? 'פעילות' : 'שהסתיימו'}
                            </div>
                        )}
                    </div>

                    {/* Pagination Controls */}
                    {totalPages > 1 && (
                        <div className="flex justify-center items-center gap-3 mt-8 pb-6">
                            <Button
                                variant="outline"
                                size="icon"
                                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                disabled={currentPage === 1}
                                className="rounded-full w-10 h-10 p-0 border-blue-200 hover:bg-blue-50 disabled:opacity-30"
                            >
                                <ChevronRight className="w-5 h-5" />
                            </Button>
                            <div className="text-sm font-medium text-gray-600 min-w-[100px] text-center">
                                עמוד {currentPage} מתוך {totalPages}
                            </div>
                            <Button
                                variant="outline"
                                size="icon"
                                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                disabled={currentPage === totalPages}
                                className="rounded-full w-10 h-10 p-0 border-blue-200 hover:bg-blue-50 disabled:opacity-30"
                            >
                                <ChevronLeft className="w-5 h-5" />
                            </Button>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
}
