import React from 'react';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function JobStatsItem({ job, viewsCount }) {
    const navigate = useNavigate();
    const isActive = job.status === 'active';

    return (
        <div
            onClick={() => navigate(`${createPageUrl('JobDetails')}?id=${job.id}`)}
            className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center justify-between mb-3 hover:shadow-md transition-shadow cursor-pointer"
        >
            <div className="flex items-center gap-12 w-full">

                {/* Status & Title */}
                <div className="flex items-center gap-3 min-w-[200px] flex-1">
                    <div className={`w-3 h-3 rounded-full ${isActive ? 'bg-[#39FF14] shadow-[0_0_8px_rgba(57,255,20,0.6)]' : 'bg-gray-300'}`} />
                    <h3 className="font-semibold text-blue-500 text-lg truncate text-right">{job.title}</h3>
                </div>

                {/* Location */}
                <div className="text-gray-600 w-32 text-right">{job.location}</div>

                {/* Date */}
                <div className="text-gray-900 font-medium w-32 text-center">
                    {job.start_date ? format(new Date(job.start_date), 'dd.MM.yy') : (job.created_date ? format(new Date(job.created_date), 'dd.MM.yy') : '-')}
                </div>

                {/* Resumes Count */}
                <div className="w-24 text-center">
                    <span className="text-gray-900 font-medium">{job.applications_count || 0}</span>
                </div>

                {/* Views Count */}
                <div className="w-24 text-center">
                    <span className="text-gray-900 font-medium">{viewsCount || 0}</span>
                </div>

            </div>
        </div>
    );
}
