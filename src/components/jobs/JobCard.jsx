import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  MapPin,
  Clock,
  Building2,
  Eye,
  CheckCircle,
  XCircle,
  Pause
} from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion } from "framer-motion";

const STATUS_ICONS = {
  filled: CheckCircle,
  filled_via_metch: CheckCircle,
  closed: XCircle,
  paused: Pause,
  active: null,
  draft: null
};

const STATUS_COLORS = {
  filled: "text-green-600 bg-green-100",
  filled_via_metch: "text-purple-600 bg-purple-100",
  closed: "text-red-600 bg-red-100",
  paused: "text-yellow-600 bg-yellow-100",
  active: "text-green-600 bg-green-100",
  draft: "text-gray-600 bg-gray-100"
};

const STATUS_LABELS = {
  filled: "אוישה",
  filled_via_metch: "אוישה דרך Metch",
  closed: "נסגרה",
  paused: "מושהית",
  active: "פעילה",
  draft: "טיוטה"
};

export default function JobCard({ job, onView, userType = "job_seeker", className = "" }) {
  const isUnavailable = ['filled', 'filled_via_metch', 'closed'].includes(job.status);
  const StatusIcon = STATUS_ICONS[job.status];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`${className}`}
    >
      <Card className={`bg-white border border-gray-200/90 shadow-sm hover:shadow-lg transition-all duration-300 rounded-2xl ${isUnavailable ? 'opacity-75 grayscale-[30%]' : ''
        }`}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between gap-4">
            {/* Action Button */}
            <div className="flex flex-col gap-2">
              {userType === "job_seeker" ? (
                <>
                  <Button
                    asChild
                    disabled={isUnavailable}
                    className={`px-5 py-2 rounded-full font-bold w-32 h-9 text-sm shadow-sm transition-colors duration-300 ${isUnavailable
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed hover:bg-gray-300'
                      : job.match_score >= 70
                        ? 'bg-green-400 hover:bg-green-500 text-white'
                        : job.match_score >= 40
                          ? 'bg-orange-400 hover:bg-orange-500 text-white'
                          : 'bg-red-500 hover:bg-red-600 text-white'
                      }`}
                  >
                    {isUnavailable ? (
                      <span>לא זמין</span>
                    ) : (
                      <Link to={createPageUrl(`JobDetailsSeeker?id=${job.id}`)} onClick={onView}>
                        לצפייה
                      </Link>
                    )}
                  </Button>
                  {isUnavailable && (
                    <span className="text-xs text-gray-500 text-center">
                      {STATUS_LABELS[job.status]}
                    </span>
                  )}
                </>
              ) : (
                <Button
                  asChild
                  className={`px-5 py-2 rounded-full font-bold w-32 h-9 text-sm shadow-sm transition-colors duration-300 ${job.match_score >= 70 ? 'bg-green-400 hover:bg-green-500 text-white' : job.match_score >= 40 ? 'bg-orange-400 hover:bg-orange-500 text-white' : 'bg-red-500 hover:bg-red-600 text-white'
                    }`}
                >
                  <Link to={createPageUrl(`JobDetails?id=${job.id}`)}>
                    <Eye className="w-4 h-4 ml-2" />
                    צפייה
                  </Link>
                </Button>
              )}
            </div>

            {/* Job Info */}
            <div className="flex-1 text-right">
              {userType === "job_seeker" && job.match_score !== null && (
                <div className="relative h-5 bg-gray-200 rounded-full overflow-hidden shadow-inner w-full mb-3">
                  <div
                    className={`absolute right-0 top-0 h-full transition-all duration-700 ${job.match_score >= 70 ? 'bg-green-400/90' : job.match_score >= 40 ? 'bg-orange-400/90' : 'bg-red-500/90'} ${isUnavailable ? 'opacity-50' : ''}`}
                    style={{ width: `${job.match_score}%` }}
                  ></div>
                  <div className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-black z-10 pointer-events-none">
                    {job.match_score}% התאמה
                  </div>
                </div>
              )}

              <div className="flex items-center gap-2 mb-2">
                <h3 className={`font-bold text-lg ${isUnavailable ? 'text-gray-500' : 'text-gray-900'}`}>
                  {job.title}
                </h3>
                {StatusIcon && (
                  <StatusIcon className={`w-4 h-4 ${STATUS_COLORS[job.status].split(' ')[0]}`} />
                )}
              </div>

              <p className={`text-sm mb-2 ${isUnavailable ? 'text-gray-400' : 'text-gray-600'}`}>
                {job.company}
              </p>

              <div className="flex gap-4 text-xs text-gray-500 flex-wrap">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  {job.location}
                </span>
                <span className="flex items-center gap-1">
                  <Building2 className="w-3 h-3" />
                  משרה מלאה
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {job.start_date || 'מיידית'}
                </span>
              </div>

              {/* Status Badge */}
              {job.status !== 'active' && (
                <div className="mt-2">
                  <Badge className={`text-xs ${STATUS_COLORS[job.status]}`}>
                    {STATUS_LABELS[job.status]}
                  </Badge>
                </div>
              )}
            </div>

            {/* Company Logo */}
            <div className="w-16 h-16 rounded-full overflow-hidden shadow-md border-2 border-white flex-shrink-0">
              <img
                src={job.company_logo_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(job.company)}&background=random`}
                alt={job.company}
                className={`w-full h-full object-cover ${isUnavailable ? 'grayscale' : ''}`}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}