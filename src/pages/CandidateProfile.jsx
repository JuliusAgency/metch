import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { User } from "@/api/entities";
import { UserProfile } from "@/api/entities";
import { QuestionnaireResponse, Job, JobApplication, CV } from "@/api/entities";
import { Core } from "@/api/integrations";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { User as UserIcon, Loader2, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { createPageUrl } from "@/utils";
import { EmployerAnalytics } from "@/components/EmployerAnalytics";
import ProfileHeader from "@/components/candidate/ProfileHeader";
import ProfileBadges from "@/components/candidate/ProfileBadges";
import ProfileMatchScore from "@/components/candidate/ProfileMatchScore";
import ProfileInfo from "@/components/candidate/ProfileInfo";
import ProfileResume from "@/components/candidate/ProfileResume";
import CVPreview from '@/components/cv_generator/CVPreview';
import ProfileSocials from "@/components/candidate/ProfileSocials";
import ProfileActions from "@/components/candidate/ProfileActions";
import { useRequireUserType } from "@/hooks/use-require-user-type";
import { useToast } from "@/components/ui/use-toast";
import { SendEmail } from "@/api/integrations";
import { extractTextFromPdf } from "@/utils/pdfUtils";

const arrayBufferToBase64 = (buffer) => {
  let binary = "";
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
};

export default function CandidateProfile() {
  useRequireUserType(); // Ensure user has selected a user type
  const [candidate, setCandidate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [creatingConversation, setCreatingConversation] = useState(false);
  const [exportingResume, setExportingResume] = useState(false);
  const [questionnaireResponse, setQuestionnaireResponse] = useState(null);
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [aiInsights, setAiInsights] = useState({ summary: "", thoughts: [] });
  const [generatingInsights, setGeneratingInsights] = useState(false);
  const [cvData, setCvData] = useState(null);
  const [isCvPreviewOpen, setIsCvPreviewOpen] = useState(false);
  const [markingNotRelevant, setMarkingNotRelevant] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const id = params.get("id");
    if (id) {
      loadCandidate(id);
    } else {
      setLoading(false);
    }
    loadUser();
  }, [location.search]);

  useEffect(() => {
    const fetchQuestionnaire = async () => {
      if (candidate?.email) {
        try {
          const responses = await QuestionnaireResponse.filter({ candidate_email: candidate.email });
          if (responses && responses.length > 0) {
            setQuestionnaireResponse(responses[0]);
          }
        } catch (error) {
          console.error("Error fetching questionnaire response:", error);
        }
      }
    };
    fetchQuestionnaire();
  }, [candidate]);

  const loadUser = async () => {
    try {
      const userData = await User.me();
      setUser(userData);
    } catch (error) {
      console.error("Error loading user:", error);
    }
  };

  const generateEmployerInsights = async (candidateData) => {
    const apiKey = import.meta.env.VITE_EMPLOYER_VIEW_CANDIDATE_KEY;
    if (!apiKey) {
      console.log("Skipping AI generation: No API key found");
      return;
    }

    setGeneratingInsights(true);
    try {
      const params = new URLSearchParams(location.search);
      const jobId = params.get("jobId");
      const matchScore = params.get("match") || "N/A";

      // 1. Fetch CV Content
      let cvText = "";
      if (candidateData.email) {
        try {
          const cvs = await CV.filter({ user_email: candidateData.email }, "-created_date", 1);
          if (cvs && cvs.length > 0) {
            const record = cvs[0];
            if (record.parsed_content) {
              cvText = record.parsed_content;
            } else {
              // Build text from structured fields if parsed content is missing
              const parts = [];
              if (record.summary) parts.push(`Summary: ${record.summary}`);

              if (record.work_experience && Array.isArray(record.work_experience)) {
                parts.push("Work Experience:");
                record.work_experience.forEach(exp => {
                  parts.push(`- ${exp.title} at ${exp.company} (${exp.start_date} - ${exp.is_current ? 'Present' : exp.end_date}): ${exp.description || ''}`);
                });
              }

              if (record.education && Array.isArray(record.education)) {
                parts.push("Education:");
                record.education.forEach(edu => {
                  parts.push(`- ${edu.degree} in ${edu.field_of_study} at ${edu.institution}`);
                });
              }

              if (record.skills && Array.isArray(record.skills)) {
                parts.push(`Skills: ${record.skills.join(', ')}`);
              }

              if (parts.length > 0) {
                cvText = parts.join("\n\n");
              }
            }
          }
        } catch (e) {
          console.warn("Failed to fetch CV", e);
        }
      }

      // If still no text but we have a PDF URL, try to extract it on the fly
      if ((!cvText || cvText.length < 50) && candidateData.resume_url && candidateData.resume_url.toLowerCase().endsWith('.pdf')) {
        try {

          const extractedText = await extractTextFromPdf(candidateData.resume_url);
          if (extractedText && extractedText.length > 50) {
            cvText = extractedText;

            // Update the CV record if we found one earlier, otherwise we might need to find/create one
            // But for safety, let's just use it for the prompt now. 
            // Optionally: fire and forget update
            // (finding the ID again or passing it down would be better, but this is okay for now)
          }
        } catch (pdfErr) {
          console.warn("Failed to extract PDF text on the fly", pdfErr);
        }
      }
      // Fallback: If no CV text found (PDF not parsed or no CV record), use Profile Metadata
      if (!cvText || cvText.length < 50) {
        const profileParts = [];
        if (candidateData.bio) profileParts.push(`Bio: ${candidateData.bio}`);
        if (candidateData.looking_for_summary) profileParts.push(`Looking For: ${candidateData.looking_for_summary}`);

        if (candidateData.preferred_job_types && Array.isArray(candidateData.preferred_job_types)) {
          profileParts.push(`Preferred Job Types: ${candidateData.preferred_job_types.join(', ')}`);
        }
        if (candidateData.preferred_location) profileParts.push(`Preferred Location: ${candidateData.preferred_location}`);
        if (candidateData.availability) profileParts.push(`Availability: ${candidateData.availability}`);

        if (profileParts.length > 0) {
          cvText = "Candidate Profile metadata (CV file content not available):\n" + profileParts.join("\n");
        } else {
          cvText = "No specific CV text or profile metadata available. Candidate has applied/registered.";
        }
      }

      // 2. Fetch Job Description
      let jobDescription = "General Candidate Review";
      if (jobId) {
        try {
          const job = await Job.get(jobId);
          jobDescription = `Title: ${job.title}\nDescription: ${job.description}\nRequirements: ${job.requirements}`;
        } catch (e) {
          console.warn("Failed to fetch Job", e);
        }
      }

      // 3. Career Answer (using specific field if available, or bio)
      const careerAnswer = candidateData.career_path_status || candidateData.bio || "Not specified";

      // 4. Construct Prompt
      const prompt = `
      Analyze this candidate for the following job.
      
      Job Context:
      ${jobDescription}
      
      Candidate Data:
      Name: ${candidateData.full_name}
      Match Score: ${matchScore}
      Career Status/Goal: ${careerAnswer}
      
      CV Content:
      "${cvText.substring(0, 5000)}"
      
      Task:
      Generate a JSON object with two keys:
      1. "candidate_summary": A concise paragraph analyzing the candidate's professional background and suitability (in Hebrew).
      2. "match_thoughts": A list of 3-5 bullet points (strings) explaining "What Match Thinks" - highlighting key strengths or gaps relative to the job (in Hebrew).
      
      Return ONLY valid JSON:
      {
        "candidate_summary": "...",
        "match_thoughts": ["...", "..."]
      }
      `;

      // 5. Call Assistant
      const response = await Core.InvokeAssistant({
        assistantId: apiKey,
        prompt
      });



      let parsed = null;
      try {
        let clean = response.content.replace(/```json/g, '').replace(/```/g, '').trim();
        const jsonMatch = clean.match(/\{[\s\S]*\}/);
        if (jsonMatch) clean = jsonMatch[0];
        parsed = JSON.parse(clean);
      } catch (e) {
        console.error("Failed to parse AI JSON", e);
      }

      if (parsed) {
        setAiInsights({
          summary: parsed.candidate_summary,
          thoughts: parsed.match_thoughts
        });
      }

    } catch (error) {
      console.error("Error generating insights:", error);
    } finally {
      setGeneratingInsights(false);
    }
  };

  const loadCandidate = async (id) => {
    setLoading(true);
    try {
      const results = await UserProfile.filter({ id });
      if (results.length > 0) {
        setCandidate(results[0]);

        // Fetch CV for resume view
        try {
          const cvs = await CV.filter({ user_email: results[0].email }, "-created_date", 1);
          if (cvs && cvs.length > 0) {
            setCvData(cvs[0]);
          }
        } catch (e) {
          console.error("Error fetching CV", e);
        }

        // Trigger AI generation after loading candidate
        generateEmployerInsights(results[0]);
      } else {
        console.error(`Candidate with ID ${id} not found.`);
      }
    } catch (error) {
      console.error("Error fetching candidate data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleStartConversation = async () => {
    if (!user || !candidate || creatingConversation) return;

    setCreatingConversation(true);
    try {
      const existingConversations = await Conversation.filter({
        employer_email: user.email,
        candidate_email: candidate.email,
      });

      let conversation;
      if (existingConversations.length > 0) {
        conversation = existingConversations[0];
      } else {
        conversation = await Conversation.create({
          employer_email: user.email,
          candidate_email: candidate.email,
          candidate_name: candidate.full_name,
          job_title: "משרה כללית",
          last_message: "",
          last_message_time: new Date().toISOString(),
          unread_count: 0,
        });
      }

      await EmployerAnalytics.trackAction(
        user.email,
        "candidate_message_initiated",
        {
          candidate_email: candidate.email,
          candidate_name: candidate.full_name,
          conversation_id: conversation.id,
        }
      );

      toast({
        title: "פתחנו צ'אט עם המועמד",
        description: "מועברים להודעות עם המועמד שנבחר",
      });

      const params = new URLSearchParams({
        conversationId: conversation.id,
        candidateEmail: candidate.email,
      });
      navigate(`${createPageUrl("Messages")}?${params.toString()}`);
    } catch (error) {
      console.error("Error creating conversation:", error);
      toast({
        title: "שגיאה בפתיחת שיחה",
        description: "לא הצלחנו לפתוח את הצ'אט עם המועמד. נסה שוב.",
        variant: "destructive",
        duration: 3000,
      });
      await EmployerAnalytics.trackAction(
        user.email,
        "candidate_message_failed",
        {
          candidate_email: candidate?.email,
          candidate_name: candidate?.full_name,
          error: error?.message,
        }
      );
    } finally {
      setCreatingConversation(false);
    }
  };

  const handleExportToEmail = async () => {
    if (!user || !candidate || exportingResume) return;

    if (!candidate.resume_url) {
      toast({
        title: "לא נמצא קובץ קורות חיים",
        description: "אין קובץ מצורף למועמד זה.",
        variant: "destructive",
      });
      return;
    }

    setExportingResume(true);
    const recipient = user.cv_reception_email || user.email;
    const subject = `קורות חיים - ${candidate.full_name}`;

    try {
      await EmployerAnalytics.trackAction(
        user.email,
        "candidate_resume_export_started",
        {
          candidate_email: candidate.email,
          candidate_name: candidate.full_name,
        }
      );

      const response = await fetch(candidate.resume_url);
      if (!response.ok) {
        throw new Error("לא ניתן למשוך את קובץ הקורות חיים");
      }

      const arrayBuffer = await response.arrayBuffer();
      const resumeBase64 = arrayBufferToBase64(arrayBuffer);
      const guessedName =
        candidate.resume_url.split("/").pop() ||
        `${candidate.full_name}-resume.pdf`;
      const filename = guessedName.toLowerCase().endsWith(".pdf")
        ? guessedName
        : `${guessedName}.pdf`;

      await SendEmail({
        to: recipient,
        from: user.email,
        subject,
        html: `
                    <p>שלום,</p>
                    <p>מצ"ב קורות החיים העדכניים של ${candidate.full_name}.</p>
                    <p>בברכה,<br/>צוות Metch</p>
                `,
        text: `מצורפים קורות החיים של ${candidate.full_name}.`,
        attachments: [
          {
            filename,
            content: resumeBase64,
            contentType: "application/pdf",
          },
        ],
      });

      toast({
        title: "הקובץ בדרך אליך",
        description: `קורות החיים של ${candidate.full_name} נשלחו בהצלחה למייל.`,
      });

      await EmployerAnalytics.trackAction(
        user.email,
        "candidate_resume_export_success",
        {
          candidate_email: candidate.email,
          candidate_name: candidate.full_name,
        }
      );
    } catch (error) {
      console.error("Error exporting resume:", error);
      toast({
        title: "שגיאה בשליחת המייל",
        description: "לא הצלחנו לשלוח את קורות החיים. נסה שוב מאוחר יותר.",
        variant: "destructive",
      });
      await EmployerAnalytics.trackAction(
        user.email,
        "candidate_resume_export_failed",
        {
          candidate_email: candidate.email,
          candidate_name: candidate.full_name,
          error: error?.message,
        }
      );
    } finally {
      setExportingResume(false);
    }
  };

  const handleNotRelevant = async () => {
    if (!user || !candidate || markingNotRelevant) return;

    setMarkingNotRelevant(true);
    try {
      const params = new URLSearchParams(location.search);
      const jobId = params.get("jobId");
      const jobTitle = params.get("title");

      // 1. Track Analytics
      await EmployerAnalytics.trackCandidateRejection(user.email, candidate, { id: jobId, title: jobTitle });

      // 2. Update Application Status (if exists and jobId is present)
      if (jobId) {
        try {
          const apps = await JobApplication.filter({
            job_id: jobId,
            applicant_email: candidate.email
          });

          if (apps.length > 0) {
            const app = apps[0];
            await JobApplication.update(app.id, { ...app, status: 'rejected' });
          } else {
            // Create a rejected application record to ensure it's filtered out
            await JobApplication.create({
              job_id: jobId,
              applicant_email: candidate.email,
              status: 'rejected'
            });
          }
        } catch (e) {
          console.error("Error updating application status:", e);
        }
      }

      toast({
        title: "המועמד סומן כלא רלוונטי",
        description: "המועמד הוסר מהרשימה.",
      });

      handleNavigateBack();
    } catch (error) {
      console.error("Error marking candidate as not relevant:", error);
      toast({
        title: "שגיאה",
        description: "אירעה שגיאה. נסה שוב.",
        variant: "destructive",
      });
    } finally {
      setMarkingNotRelevant(false);
    }
  };

  const handleNavigateBack = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      navigate(-1);
    } else {
      navigate(createPageUrl("JobApplications"));
    }
  };

  useEffect(() => {
    const trackCandidateView = async () => {
      if (candidate && user) {
        try {
          await EmployerAnalytics.trackCandidateView(user.email, candidate);
        } catch (error) {
          console.error("Error tracking candidate view:", error);
        }
      }
    };

    trackCandidateView();
  }, [candidate, user]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="w-12 h-12 border-t-2 border-blue-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!candidate) {
    return <div className="text-center py-12">Candidate not found.</div>;
  }

  // Calculate a stable match score based on candidate ID to ensure consistency
  // Use same logic as Dashboard to ensure match works if navigating directly
  const getStableMatchScore = (id) => {
    if (!id) return 90;
    let hash = 0;
    const str = String(id);
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return 75 + (Math.abs(hash) % 25);
  };

  const params = new URLSearchParams(location.search);
  const matchFromUrl = params.get("match");
  const matchScore = matchFromUrl ? parseInt(matchFromUrl, 10) : (candidate ? getStableMatchScore(candidate.id) : 90);

  const availabilityText = {
    immediate: "מיידי",
    two_weeks: "תוך שבועיים",
    one_month: "תוך חודש",
    negotiable: "גמיש",
  };

  const jobTypeText = {
    full_time: "משרה מלאה",
    part_time: "משרה חלקית",
    contract: "חוזה",
    freelance: "פרילנס",
    internship: "התמחות",
  };

  return (
    <div className="p-4 md:p-6" dir="rtl">
      <div className="w-[95%] md:w-[80%] mx-auto">
        <Card className="bg-white rounded-2xl md:rounded-[2.5rem] shadow-xl border border-gray-100 overflow-hidden min-h-[85vh] flex flex-col">
          {/* Header Background */}
          <ProfileHeader />

          <CardContent className="p-4 sm:p-6 md:p-8 -mt-20 relative z-10 flex-grow">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="flex flex-col items-center text-center space-y-6"
            >
              {/* Avatar - Centered & Overlapping */}
              <div className="relative">
                <div className="w-24 h-24 md:w-28 md:h-28 bg-[#72C0E8] rounded-full flex items-center justify-center border-[5px] border-white shadow-xl">
                  <UserIcon className="w-10 h-10 md:w-12 md:h-12 text-white" />
                </div>
              </div>

              {/* Name */}
              <h1 className="text-3xl md:text-4xl font-bold text-[#003566]">
                {(() => {
                  if (candidate.full_name && candidate.full_name.trim().length > 0) return candidate.full_name;
                  if (candidate.email) return candidate.email;
                  return 'מועמד ללא שם';
                })()}
              </h1>

              {/* Badges */}
              <ProfileBadges
                jobTypeText={jobTypeText}
                preferred_job_types={candidate.preferred_job_types}
                preferred_location={candidate.preferred_location}
                availabilityText={availabilityText}
                availability={candidate.availability}
              />

              {/* Match Score */}
              <ProfileMatchScore matchScore={matchScore} />

              {/* Info Cards */}
              <ProfileInfo
                looking_for_summary={candidate.looking_for_summary}
                bio={candidate.bio}
                aiSummary={aiInsights.summary}
                aiThoughts={aiInsights.thoughts}
                isLoading={generatingInsights}
              />

              {/* Resume */}
              <ProfileResume
                resume_url={candidate.resume_url}
                full_name={candidate.full_name}
                cvData={cvData}
                onViewCv={() => setIsCvPreviewOpen(true)}
              />

              {/* Socials */}
              <ProfileSocials
                facebook_url={candidate.facebook_url}
                instagram_url={candidate.instagram_url}
                linkedin_url={candidate.linkedin_url}
                twitter_url={candidate.twitter_url}
              />
            </motion.div>
          </CardContent>
          <CardFooter className="p-6 md:p-8">
            {/* Actions */}
            <ProfileActions
              handleStartConversation={handleStartConversation}
              creatingConversation={creatingConversation}
              handleExportToEmail={handleExportToEmail}
              exportingResume={exportingResume}
              questionnaireResponse={questionnaireResponse}
              handleNotRelevant={handleNotRelevant}
              markingNotRelevant={markingNotRelevant}
            />
          </CardFooter>
        </Card>
      </div>

      <AnimatePresence>
        {isCvPreviewOpen && cvData && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
            onClick={() => setIsCvPreviewOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative bg-white rounded-lg shadow-2xl w-full max-w-4xl h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsCvPreviewOpen(false)}
                className="absolute top-2 right-2 rounded-full z-10 bg-white/50 hover:bg-white/80"
              >
                <X className="w-6 h-6" />
              </Button>
              <CVPreview cvData={cvData} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
