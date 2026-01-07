import React from 'react';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function JobStatsItem({ job, viewsCount }) {
    const navigate = useNavigate();

    return (
        <div
            onClick={() => navigate(`${createPageUrl('JobDetails')}?id=${job.id}`)}
            className="bg-white rounded-2xl p-4 shadow-md hover:shadow-lg border border-gray-100 flex items-center justify-between mb-3 transition-shadow cursor-pointer"
        >
            <div className="grid grid-cols-12 gap-4 w-full items-center justify-items-center">

                {/* Status & Title */}
                <div className="col-span-4 flex items-center gap-3 min-w-0 pr-2 justify-self-start">
                    <div className={`flex-shrink-0 w-3 h-3 rounded-full ${job.status === 'active'
                        ? 'bg-[#39FF14] shadow-[0_0_8px_rgba(57,255,20,0.6)]'
                        : job.status === 'paused'
                            ? 'bg-yellow-500 shadow-[0_0_8px_rgba(234,179,8,0.4)]'
                            : 'bg-gray-300'
                        }`} />
                    <h3 className="font-semibold text-blue-500 text-lg truncate text-right w-full">{job.title}</h3>
                </div>

                {/* Location */}
                <div className="col-span-2 text-gray-600 text-center truncate px-2">{job.location}</div>

                {/* Date */}
                <div className="col-span-2 text-gray-900 font-medium text-center">
                    {job.created_date ? format(new Date(job.created_date), 'dd.MM.yy') : '-'}
                </div>

                {/* Resumes Count */}
                <div className="col-span-2 text-center">
                    <span className="text-gray-900 font-medium">{job.applications_count || 0}</span>
                </div>

                {/* Views Count */}
                <div className="col-span-2 text-center">
                    <span className="text-gray-900 font-medium">{viewsCount || 0}</span>
                </div>

            </div>
        </div>
    );
}
