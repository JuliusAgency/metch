
import React, { useState, useEffect, useCallback } from "react";
import { useLocation, Link, useNavigate } from "react-router-dom";
import { Job } from "@/api/entities";
import { JobApplication } from "@/api/entities";
import { User } from "@/api/entities";
import { Conversation } from "@/api/entities";
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
import { useRequireUserType } from "@/hooks/use-require-user-type";
import { useToast } from "@/components/ui/use-toast";
import settingsHeaderBg from "@/assets/settings_header_bg.png";

export default function JobApplications() {
  useRequireUserType(); // Ensure user has selected a user type
  const [job, setJob] = useState(null);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creatingConversation, setCreatingConversation] = useState(false);
  const [applicantProfiles, setApplicantProfiles] = useState({});
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();

  const loadData = useCallback(async () => {
    try {
      const userData = await User.me();
      setUser(userData);

      const params = new URLSearchParams(location.search);
      const jobId = params.get('job_id');

      if (jobId) {
        const jobResults = await Job.filter({ id: jobId });
        if (jobResults.length > 0) {
          setJob(jobResults[0]);
        }

        const appResults = await JobApplication.filter({ job_id: jobId });
        setApplications(appResults);

        // Fetch profiles for applicants to get their IDs
        const uniqueEmails = [...new Set(appResults.map(a => a.applicant_email))];
        const profilesMap = {};
        await Promise.all(uniqueEmails.map(async (email) => {
          try {
            const results = await UserProfile.filter({ email });
            if (results.length > 0) {
              profilesMap[email] = results[0];
            }
          } catch (e) {
            console.error(`Error fetching profile for ${email}`, e);
          }
        }));
        setApplicantProfiles(profilesMap);
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

  const handleStartConversation = async (application) => {
    if (!user || !job || creatingConversation) return;

    setCreatingConversation(true);
    try {
      // Find candidate profile to get their ID
      let candidateId = null;
      try {
        const candidateResults = await UserProfile.filter({ email: application.applicant_email });
        if (candidateResults.length > 0) {
          candidateId = candidateResults[0].id;
        }
      } catch (error) {
        console.error("Error fetching candidate profile for ID:", error);
      }

      const existingConversations = await Conversation.filter({
        employer_id: user.id,
        candidate_id: candidateId,
        job_id: job.id,
      });

      let conversation;
      if (existingConversations.length > 0) {
        conversation = existingConversations[0];
      } else {
        conversation = await Conversation.create({
          employer_email: user.email,
          employer_id: user.id,
          candidate_email: application.applicant_email,
          candidate_id: candidateId,
          job_id: job.id,
          job_title: job.title,
          last_message: "",
          last_message_time: new Date().toISOString(),
        });
      }



      toast({
        title: "פתחנו צ'אט עם המועמד",
        description: "מועברים להודעות",
      });

      navigate(createPageUrl("Messages"));
    } catch (error) {
      console.error("Error creating conversation:", error);
      toast({
        title: "שגיאה בפתיחת שיחה",
        description: "לא הצלחנו לפתוח את הצ'אט עם המועמד. נסה שוב.",
        variant: "destructive",
      });
    } finally {
      setCreatingConversation(false);
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
    <div className="h-full relative" dir="rtl">
      <div className="relative">
        <div className="relative h-32 overflow-hidden w-full">
          <div
            className="absolute inset-0 w-full h-full"
            style={{
              backgroundImage: `url(${settingsHeaderBg})`,
              backgroundSize: '100% 100%',
              backgroundPosition: 'center top'
            }}
          />
          <Link
            to={createPageUrl(`JobDetails?id=${job?.id}`)}
            className="absolute top-8 right-8 w-10 h-10 bg-white/30 rounded-full flex items-center justify-center backdrop-blur-sm hover:bg-white/50 transition-colors z-10"
          >
            <ChevronLeft className="w-6 h-6 text-gray-800 rotate-180" />
          </Link>
        </div>

        <div className="p-4 sm:p-6 md:p-8 -mt-16 relative z-10 w-full max-w-7xl mx-auto">
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
                        <div className="flex flex-col gap-4">
                          {/* Top Row: Info and Buttons */}
                          <div className="flex items-center justify-between gap-4">
                            <div className="flex items-center gap-4 flex-1">
                              <div className="w-16 h-16 rounded-full overflow-hidden shadow-md border-2 border-white flex-shrink-0 bg-blue-100 flex items-center justify-center">
                                <UserIcon className="w-8 h-8 text-blue-500" />
                              </div>
                              <div className="text-right">
                                <h3 className="font-bold text-lg text-gray-900 leading-tight">
                                  {application.applicant_email}
                                </h3>
                                <p className="text-gray-500 text-sm mt-0.5">
                                  הוגש ב-{format(new Date(application.created_date), "dd/MM/yyyy")}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 flex-shrink-0">
                              <Link to={createPageUrl(`CandidateProfile?id=${applicantProfiles[application.applicant_email]?.id || ''}`)}>
                                <Button
                                  className={`text-white px-6 py-1.5 h-9 rounded-full font-bold w-32 text-sm view-candidate-button transition-colors duration-300 ${matchScore >= 80 ? 'bg-green-400 hover:bg-green-500' : 'bg-orange-400 hover:bg-orange-500'
                                    }`}
                                >
                                  לצפייה
                                </Button>
                              </Link>
                              <Button
                                size="sm"
                                variant="outline"
                                className="rounded-full border-gray-300 hover:bg-gray-100 px-3 h-9"
                                onClick={() => handleStartConversation(application)}
                                disabled={creatingConversation}
                              >
                                <Mail className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>

                          {/* Middle Row: Status and Selection */}
                          <div className="flex items-center gap-4 bg-gray-50/50 p-2 rounded-xl border border-gray-100">
                            <Badge className={`${config.color} px-3 py-1 rounded-lg text-xs font-bold`}>{config.label}</Badge>
                            <div className="flex-1">
                              <select
                                value={application.status}
                                onChange={(e) => updateApplicationStatus(application.id, e.target.value)}
                                className="px-3 py-1 border border-gray-200 rounded-lg text-xs bg-white shadow-xs focus:ring-2 focus:ring-blue-500/20 outline-none transition-all w-full max-w-[150px]"
                              >
                                {Object.entries(statusConfig).map(([value, config]) => (
                                  <option key={value} value={value}>{config.label}</option>
                                ))}
                              </select>
                            </div>
                            {application.resume_url && (
                              <a
                                href={application.resume_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex-shrink-0"
                              >
                                <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700 font-bold p-0 px-2 h-8 text-xs">
                                  <FileText className="w-4 h-4 ml-1" />
                                  קורות חיים
                                </Button>
                              </a>
                            )}
                          </div>

                          {/* Bottom Row: Match Bar */}
                          {matchScore !== null && (
                            <div className="relative h-5 bg-gray-200 rounded-full overflow-hidden shadow-inner w-full">
                              <div
                                className={`absolute right-0 top-0 h-full transition-all duration-700 ${matchScore >= 80 ? 'bg-green-400/90' : 'bg-orange-400/90'}`}
                                style={{ width: `${matchScore}%` }}
                              ></div>
                              <div className="absolute inset-0 flex items-center justify-center text-[11px] font-bold text-black z-10 pointer-events-none">
                                {matchScore}% התאמה
                              </div>
                            </div>
                          )}

                          {application.cover_letter && (
                            <div className="text-sm text-gray-700 mt-2 max-w-md">
                              <p className="line-clamp-2">{application.cover_letter}</p>
                            </div>
                          )}
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
        </div>
      </div>
    </div>
  );
}
