
import { useState, useEffect, useCallback } from "react";
import { useLocation, Link } from "react-router-dom";
import { Job } from "@/api/entities";
import { JobApplication } from "@/api/entities";
import { User } from "@/api/entities";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  ChevronLeft, 
  User as UserIcon, 
  FileText,
  Mail,
  Calendar,
  Star
} from "lucide-react";
import { motion } from "framer-motion";
import { createPageUrl } from "@/utils";
import { format } from "date-fns";

export default function JobApplications() {
  const [job, setJob] = useState(null);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const location = useLocation();

  const loadData = useCallback(async () => {
    try {
      const params = new URLSearchParams(location.search);
      const jobId = params.get('job_id');
      
      if (jobId) {
        const jobResults = await Job.filter({ id: jobId });
        if (jobResults.length > 0) {
          setJob(jobResults[0]);
        }
        
        const appResults = await JobApplication.filter({ job_id: jobId });
        setApplications(appResults);
      }
    } catch (error) {
      console.error("Error loading applications:", error);
    } finally {
      setLoading(false);
    }
  }, [location.search]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const updateApplicationStatus = async (applicationId, newStatus) => {
    try {
      await JobApplication.update(applicationId, { status: newStatus });
      loadData(); // Reload data
    } catch (error) {
      console.error("Error updating application status:", error);
    }
  };

  const statusConfig = {
    pending: { label: 'ממתין', color: 'bg-yellow-100 text-yellow-800' },
    reviewed: { label: 'נצפה', color: 'bg-blue-100 text-blue-800' },
    interview: { label: 'לראיון', color: 'bg-purple-100 text-purple-800' },
    accepted: { label: 'התקבל', color: 'bg-green-100 text-green-800' },
    rejected: { label: 'נדחה', color: 'bg-red-100 text-red-800' }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-screen">טוען...</div>;
  }

  return (
    <div className="p-4 md:p-6" dir="rtl">
      <div className="w-[85vw] mx-auto">
        <Card className="bg-white rounded-2xl md:rounded-[2.5rem] shadow-xl border border-gray-100 overflow-hidden">
          <div className="relative">
            <div className="relative h-24 overflow-hidden -m-px">
              <div 
                className="absolute inset-0 w-full h-full [clip-path:ellipse(120%_100%_at_50%_100%)]"
                style={{
                  backgroundImage: 'url(https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/ca93821b0_image.png)',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center top'
                }}
              />
              <Link 
                to={createPageUrl(`JobDetails?id=${job?.id}`)} 
                className="absolute top-4 right-6 w-10 h-10 bg-white/30 rounded-full flex items-center justify-center backdrop-blur-sm hover:bg-white/50 transition-colors z-10"
              >
                <ChevronLeft className="w-6 h-6 text-gray-800 rotate-180" />
              </Link>
            </div>

            <CardContent className="p-4 sm:p-6 md:p-8 -mt-6 relative z-10">
              <div className="text-center mb-8">
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                  מועמדים למשרה: {job?.title}
                </h1>
                <p className="text-gray-600 mt-2">{applications.length} מועמדויות</p>
              </div>

              <div className="space-y-4">
                {applications.length > 0 ? (
                  applications.map((application, index) => {
                    const config = statusConfig[application.status] || statusConfig.pending;
                    const matchScore = application.match_score || Math.floor(Math.random() * (95 - 70) + 70);
                    
                    return (
                      <motion.div
                        key={application.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.1 }}
                      >
                        <Card className="bg-white border border-gray-200/90 shadow-sm hover:shadow-lg transition-all duration-300">
                          <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-4">
                                <Badge className={config.color}>{config.label}</Badge>
                                <div className="flex items-center gap-2">
                                  <Star className="w-4 h-4 text-yellow-500" />
                                  <span className="font-bold text-blue-600">{matchScore}%</span>
                                </div>
                                {application.resume_url && (
                                  <a 
                                    href={application.resume_url}
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                  >
                                    <Button variant="outline" size="sm">
                                      <FileText className="w-4 h-4 ml-1" />
                                      קורות חיים
                                    </Button>
                                  </a>
                                )}
                              </div>

                              <div className="flex-1 px-6 text-right">
                                <div className="flex items-center justify-end gap-3 mb-2">
                                  <div>
                                    <p className="font-semibold text-gray-900">{application.applicant_email}</p>
                                    <p className="text-sm text-gray-600">
                                      הוגש ב-{format(new Date(application.created_date), "dd/MM/yyyy")}
                                    </p>
                                  </div>
                                  <div className="w-12 h-12 bg-blue-200 rounded-full flex items-center justify-center">
                                    <UserIcon className="w-6 h-6 text-blue-600" />
                                  </div>
                                </div>
                                
                                {application.cover_letter && (
                                  <div className="text-sm text-gray-700 mt-2 max-w-md">
                                    <p className="line-clamp-2">{application.cover_letter}</p>
                                  </div>
                                )}
                              </div>

                              <div className="flex flex-col gap-2">
                                <select
                                  value={application.status}
                                  onChange={(e) => updateApplicationStatus(application.id, e.target.value)}
                                  className="px-3 py-1 border border-gray-300 rounded-lg text-sm"
                                >
                                  {Object.entries(statusConfig).map(([value, config]) => (
                                    <option key={value} value={value}>{config.label}</option>
                                  ))}
                                </select>
                                <Button size="sm" variant="outline">
                                  <Mail className="w-4 h-4 ml-1" />
                                  שלח הודעה
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    );
                  })
                ) : (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <UserIcon className="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">עדיין אין מועמדויות</h3>
                    <p className="text-gray-600">מועמדויות יופיעו כאן כאשר יגישו למשרה זו</p>
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
