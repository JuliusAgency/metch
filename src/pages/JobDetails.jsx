
import { useState, useEffect, useCallback } from "react";
import { useLocation, Link, useNavigate } from "react-router-dom";
import { Job } from "@/api/entities";
import { JobApplication } from "@/api/entities";
import { JobView } from "@/api/entities";
import { User } from "@/api/entities";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trash2, Edit, StopCircle, PlayCircle, Users, Eye, ArrowRight, Save, X, RotateCcw, Copy, Share2, ClipboardList, Clock, MapPin, DollarSign, Calendar as CalendarIcon, Play, FileText, ChevronLeft, Building2, Pause, BarChart3 } from "lucide-react";
import { Dialog, DialogContent, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { createPageUrl } from "@/utils";
import { EmployerAnalytics } from "@/components/EmployerAnalytics";
import JobHeader from "@/components/job/JobHeader";
import { useRequireUserType } from "@/hooks/use-require-user-type";
import JobTitle from "@/components/job/JobTitle";
import JobStats from "@/components/job/JobStats";
import JobInfo from "@/components/job/JobInfo";
import JobActions from "@/components/job/JobActions";

export default function JobDetails() {
  useRequireUserType(); // Ensure user has selected a user type
  const [job, setJob] = useState(null);
  const [applications, setApplications] = useState([]);
  const [viewsCount, setViewsCount] = useState(0);
  const [matchesCount, setMatchesCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const location = useLocation();
  const navigate = useNavigate();

  const loadData = useCallback(async () => {
    try {
      const userData = await User.me();
      setUser(userData);

      const params = new URLSearchParams(location.search);
      const jobId = params.get('id');


      if (jobId) {
        const jobResults = await Job.filter({ id: jobId });
        if (jobResults.length > 0) {
          setJob(jobResults[0]);

          const appResults = await JobApplication.filter({ job_id: jobId });
          setApplications(appResults);

          // Load view count for this job
          const views = await JobView.filter({ job_id: jobId });
          setViewsCount(views.length);

          // Calculate matches count - applications with match_score >= 70
          const matches = appResults.filter(app => app.match_score && app.match_score >= 70);
          setMatchesCount(matches.length);
        }
      }
    } catch (error) {
      console.error("Error loading job details:", error);
    } finally {
      setLoading(false);
    }
  }, [location.search]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleStatusChange = async (newStatus) => {
    try {
      const oldStatus = job.status;
      await Job.update(job.id, { status: newStatus });
      setJob(prev => ({ ...prev, status: newStatus }));

      if (user) {
        await EmployerAnalytics.trackJobStatusChange(user.email, job, oldStatus, newStatus);
      }
    } catch (error) {
      console.error("Error updating job status:", error);
    }
  };

  const handleDuplicateJob = async () => {
    try {
      const userData = await User.me();
      const now = new Date().toISOString();

      const duplicatedJob = {
        ...job,
        title: `${job.title} (עותק)`,
        status: 'draft',
        applications_count: 0,
        created_by: userData.email,
        created_by_id: userData.id,
        created_date: now,
        updated_date: now
      };
      delete duplicatedJob.id;

      await Job.create(duplicatedJob);
      navigate(createPageUrl("JobManagement"));
    } catch (error) {
      console.error("Error duplicating job:", error);
    }
  };

  useEffect(() => {
    const trackJobView = async () => {
      if (job && user) {
        await EmployerAnalytics.trackJobView(user.email, job);
      }
    };

    if (job && user) {
      trackJobView();
    }
  }, [job, user]);

  const statusConfig = {
    active: { label: 'פעילה', color: 'bg-green-100 text-green-800' },
    paused: { label: 'מושהית', color: 'bg-yellow-100 text-yellow-800' },
    closed: { label: 'סגורה', color: 'bg-red-100 text-red-800' },
    filled: { label: 'אוישה', color: 'bg-blue-100 text-blue-800' },
    filled_via_metch: { label: 'אוישה דרך METCH', color: 'bg-purple-100 text-purple-800' },
    draft: { label: 'טיוטה', color: 'bg-gray-100 text-gray-800' }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-screen">טוען...</div>;
  }

  if (!job) {
    return <div className="text-center py-12">משרה לא נמצאה</div>;
  }

  const config = statusConfig[job.status] || statusConfig.active;

  return (
    <div className="p-4 md:p-6" dir="rtl">
      <div className="w-[85vw] mx-auto">
        <Card className="bg-white rounded-2xl md:rounded-[2.5rem] shadow-xl border border-gray-100 overflow-hidden">
          <div className="relative">
            <JobHeader />
            <CardContent className="p-4 sm:p-6 md:p-8 -mt-6 relative z-10">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-8"
              >
                {/* Job Header */}
                <div className="text-center space-y-4 pt-4">
                  <div className="w-16 h-16 bg-blue-200 rounded-full flex items-center justify-center mx-auto">
                    <Building2 className="w-8 h-8 text-blue-600" />
                  </div>
                  <h1 className="text-3xl md:text-4xl font-bold text-gray-900">{job.title}</h1>
                  <p className="text-xl text-gray-600">{job.company}</p>
                  <Badge className={config.color}>{config.label}</Badge>
                </div>

                {/* Job Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <Card className="bg-blue-50 border-blue-200">
                    <CardContent className="p-6 text-center">
                      <Eye className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                      <div className="text-2xl font-bold text-gray-900">{viewsCount}</div>
                      <p className="text-gray-600">צפיות</p>
                    </CardContent>
                  </Card>
                  <Card className="bg-green-50 border-green-200">
                    <CardContent className="p-6 text-center">
                      <Users className="w-8 h-8 text-green-600 mx-auto mb-2" />
                      <div className="text-2xl font-bold text-gray-900">{applications.length}</div>
                      <p className="text-gray-600">מועמדויות</p>
                    </CardContent>
                  </Card>
                  <Card className="bg-purple-50 border-purple-200">
                    <CardContent className="p-6 text-center">
                      <BarChart3 className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                      <div className="text-2xl font-bold text-gray-900">{matchesCount}</div>
                      <p className="text-gray-600">התאמות</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Job Details */}
                <div className="bg-gray-50/80 p-6 rounded-xl">
                  <h3 className="font-bold text-lg mb-4">פרטי המשרה</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-right">
                    <div className="space-y-2">
                      <div className="flex items-center justify-end gap-2">
                        <span>{job.location || "לא צוין מיקום"}</span>
                        <MapPin className="w-4 h-4 text-gray-500" />
                      </div>
                      <div className="flex items-center justify-end gap-2">
                        <span>
                          {(() => {
                            const typeMap = {
                              full_time: "משרה מלאה",
                              part_time: "משרה חלקית",
                              contract: "חוזה",
                              freelance: "פרילנס",
                              internship: "התמחות",
                              hourly: "שעתי"
                            };
                            return typeMap[job.employment_type] || job.employment_type?.replace('_', ' ');
                          })()}
                        </span>
                        <Clock className="w-4 h-4 text-gray-500" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      {(job.salary_min || job.salary_max) && (
                        <div className="flex items-center justify-end gap-2">
                          <span>
                            {job.salary_min && job.salary_max
                              ? `₪${job.salary_min.toLocaleString()} - ₪${job.salary_max.toLocaleString()}`
                              : job.salary_min
                                ? `מ-₪${job.salary_min.toLocaleString()}`
                                : `עד ₪${job.salary_max?.toLocaleString()}`
                            }
                          </span>
                          <DollarSign className="w-4 h-4 text-gray-500" />
                        </div>
                      )}
                      <div className="flex items-center justify-end gap-2">
                        <span>{format(new Date(job.created_date), "dd/MM/yyyy")}</span>
                        <Clock className="w-4 h-4 text-gray-500" />
                      </div>
                    </div>
                  </div>

                  <div className="mt-6">
                    <h4 className="font-semibold mb-2">תיאור המשרה:</h4>
                    <p className="text-gray-700 leading-relaxed">{job.description}</p>
                  </div>

                  {job.requirements && (
                    <div className="mt-4">
                      <h4 className="font-semibold mb-2">דרישות:</h4>
                      <p className="text-gray-700 leading-relaxed">{job.requirements}</p>
                    </div>
                  )}

                  {/* Attachments Gallery */}
                  {(() => {
                    let attachments = job.attachments;

                    // Handle Postgres Bytea Hex format (starts with \x)
                    if (typeof attachments === 'string' && attachments.startsWith('\\x')) {
                      try {
                        const hex = attachments.slice(2);
                        let str = '';
                        for (let i = 0; i < hex.length; i += 2) {
                          str += String.fromCharCode(parseInt(hex.substr(i, 2), 16));
                        }
                        attachments = str;
                      } catch (e) {
                        console.warn("Failed to decode hex attachment string", e);
                      }
                    }

                    // Safely parse if it's a string
                    if (typeof attachments === 'string') {
                      try {
                        attachments = JSON.parse(attachments);
                      } catch (e) {
                        // Try double parse or fail safely
                        try {
                          const cleaned = JSON.parse(JSON.stringify(attachments));
                          attachments = JSON.parse(cleaned);
                        } catch (e2) {
                          attachments = [];
                        }
                      }
                    }

                    if (!Array.isArray(attachments) || attachments.length === 0) return null;

                    return (
                      <div className="mt-8">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          {attachments.map((file, index) => {
                            if (!file) return null;

                            const fileUrl = file.url || file;
                            // Ensure URL is valid string
                            const finalUrl = (typeof fileUrl === 'string') ? fileUrl : '';
                            const fileType = file.type || 'image/png'; // Default to assuming image if unknown for now, or check extension

                            const isImage = fileType.startsWith("image/") || finalUrl.match(/\.(jpeg|jpg|gif|png|webp)$/i) != null || !fileType;

                            if (isImage) {
                              return (
                                <Dialog key={index}>
                                  <DialogTrigger asChild>
                                    <div className="relative group aspect-video rounded-xl overflow-hidden shadow-sm border border-gray-100 bg-white cursor-pointer">
                                      <img
                                        src={finalUrl}
                                        alt={`Attachment ${index + 1}`}
                                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                                      />
                                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                                        <Eye className="text-white opacity-0 group-hover:opacity-100 transition-opacity w-8 h-8 drop-shadow-md" />
                                      </div>
                                    </div>
                                  </DialogTrigger>
                                  <DialogContent
                                    hideCloseButton
                                    className="max-w-[90vw] max-h-[95vh] p-0 bg-transparent border-0 shadow-none flex flex-col items-center justify-center outline-none"
                                  >
                                    <div className="w-full flex justify-end mb-2 px-2">
                                      <DialogClose className="p-2 bg-white hover:bg-gray-100 rounded-full text-gray-800 shadow-lg transition-all outline-none focus:ring-0 ring-offset-0">
                                        <X className="w-5 h-5" />
                                        <span className="sr-only">Close</span>
                                      </DialogClose>
                                    </div>
                                    <img
                                      src={finalUrl}
                                      alt={`Full size attachment ${index + 1}`}
                                      className="w-auto h-auto max-w-full max-h-[80vh] object-contain rounded-lg shadow-2xl"
                                    />
                                  </DialogContent>
                                </Dialog>
                              );
                            }

                            // Fallback for non-images
                            return (
                              <a
                                key={index}
                                href={finalUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="flex flex-col items-center justify-center aspect-video bg-white border border-gray-200 rounded-xl hover:border-blue-400 hover:shadow-sm transition-all p-4 text-center group"
                              >
                                <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mb-2 group-hover:bg-blue-100 transition-colors">
                                  {fileType.includes('pdf') ? <ClipboardList className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
                                </div>
                                <span className="text-xs font-medium text-gray-600 truncate w-full px-2">
                                  {file.name || "מסמך מצורף"}
                                </span>
                              </a>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })()}
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap justify-center gap-3">
                  <Link to={createPageUrl(`CreateJob?id=${job.id}`)}>
                    <Button variant="outline" className="border-gray-300 hover:bg-gray-100">
                      <Edit className="w-4 h-4 ml-2" />
                      ערוך משרה
                    </Button>
                  </Link>
                  {job.status === 'active' ? (
                    <Button
                      variant="outline"
                      className="border-yellow-300 hover:bg-yellow-100"
                      onClick={() => handleStatusChange('paused')}
                    >
                      <Pause className="w-4 h-4 ml-2" />
                      השהה משרה
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      className="border-green-300 hover:bg-green-100"
                      onClick={() => handleStatusChange('active')}
                    >
                      <Play className="w-4 h-4 ml-2" />
                      פעל משרה
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    className="border-blue-300 hover:bg-blue-100"
                    onClick={handleDuplicateJob}
                  >
                    <Copy className="w-4 h-4 ml-2" />
                    שכפל משרה
                  </Button>
                  {/* New button for Screening Questionnaire */}
                  {(() => {
                    let questionsData = job.screening_questions;
                    if (!questionsData) return null;

                    if (typeof questionsData === 'string') {
                      try {
                        if (questionsData.startsWith('\\x')) {
                          const hex = questionsData.slice(2);
                          let str = '';
                          for (let i = 0; i < hex.length; i += 2) {
                            str += String.fromCharCode(parseInt(hex.substr(i, 2), 16));
                          }
                          questionsData = str;
                        }
                        questionsData = JSON.parse(questionsData);
                      } catch (e) {
                        return null; // Don't show if parsing fails
                      }
                    }

                    if (!Array.isArray(questionsData) || questionsData.length === 0) return null;

                    return (
                      <Link to={createPageUrl(`ScreeningQuestionnaire?id=${job.id}`)}>
                        <Button variant="outline" className="border-purple-300 hover:bg-purple-100">
                          <ClipboardList className="w-4 h-4 ml-2" />
                          שאלון סינון
                        </Button>
                      </Link>
                    );
                  })()}
                  <Link to={createPageUrl(`JobApplications?job_id=${job.id}`)}>
                    <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                      <Users className="w-4 h-4 ml-2" />
                      צפה במועמדים ({applications.length})
                    </Button>
                  </Link>
                </div>
              </motion.div>
            </CardContent>
          </div>
        </Card>
      </div>
    </div>
  );
}
