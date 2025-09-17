
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
  MapPin, 
  DollarSign, 
  Clock, 
  Building2, 
  Users, 
  Eye,
  Edit,
  Trash2,
  Play,
  Pause,
  Copy,
  BarChart3,
  ClipboardList // Added ClipboardList icon for screening questionnaire
} from "lucide-react";
import { motion } from "framer-motion";
import { createPageUrl } from "@/utils";
import { format } from "date-fns";

export default function JobDetails() {
  const [job, setJob] = useState(null);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const location = useLocation();

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
          
          // Load applications for this job
          const appResults = await JobApplication.filter({ job_id: jobId });
          setApplications(appResults);
        }
      }
    } catch (error) {
      console.error("Error loading job details:", error);
    } finally {
      setLoading(false);
    }
  }, [location.search]); // Depend on location.search to re-run when URL params change

  useEffect(() => {
    loadData();
  }, [loadData]); // Depend on loadData to re-run when loadData itself changes (due to its dependencies)

  const handleStatusChange = async (newStatus) => {
    try {
      await Job.update(job.id, { status: newStatus });
      setJob(prev => ({ ...prev, status: newStatus }));
    } catch (error) {
      console.error("Error updating job status:", error);
    }
  };

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
  const viewsCount = Math.floor(Math.random() * 200) + 50; // Mock data

  return (
    <div className="p-4 md:p-6" dir="rtl">
      <div className="w-[85vw] mx-auto">
        <Card className="bg-white rounded-2xl md:rounded-[2.5rem] shadow-xl border border-gray-100 overflow-hidden">
          <div className="relative">
            {/* Header */}
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
                to={createPageUrl("JobManagement")} 
                className="absolute top-4 right-6 w-10 h-10 bg-white/30 rounded-full flex items-center justify-center backdrop-blur-sm hover:bg-white/50 transition-colors z-10"
              >
                <ChevronLeft className="w-6 h-6 text-gray-800 rotate-180" />
              </Link>
            </div>

            <CardContent className="p-4 sm:p-6 md:p-8 -mt-6 relative z-10">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-8"
              >
                {/* Job Header */}
                <div className="text-center space-y-4">
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
                      <div className="text-2xl font-bold text-gray-900">{Math.floor(applications.length * 0.7)}</div>
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
                        <span>{job.location}</span>
                        <MapPin className="w-4 h-4 text-gray-500" />
                      </div>
                      <div className="flex items-center justify-end gap-2">
                        <span>{job.employment_type?.replace('_', ' ')}</span>
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
                  >
                    <Copy className="w-4 h-4 ml-2" />
                    שכפל משרה
                  </Button>
                  {/* New button for Screening Questionnaire */}
                  <Link to={createPageUrl("JobScreeningQuestionnaire", { id: job.id })}>
                    <Button variant="outline" className="border-purple-300 hover:bg-purple-100">
                      <ClipboardList className="w-4 h-4 ml-2" />
                      שאלון סינון
                    </Button>
                  </Link>
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
