import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { User } from "@/api/entities";
import { UserProfile } from "@/api/entities";
import { QuestionnaireResponse, Job, JobApplication, CV, Conversation, Notification } from "@/api/entities";
import { Core } from "@/api/integrations";
import { calculate_match_score } from "@/utils/matchScore";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { User as UserIcon, Loader2, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { createPageUrl, safeParseJSON } from "@/utils";
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
import { SendEmail, InvokeAssistant } from "@/api/integrations";
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
  const [aiInsights, setAiInsights] = useState({ summary: "", thoughts: [], score: 90 });
  const [generatingInsights, setGeneratingInsights] = useState(false);
  const [cvData, setCvData] = useState(null);
  const [isCvPreviewOpen, setIsCvPreviewOpen] = useState(false);
  const [markingNotRelevant, setMarkingNotRelevant] = useState(false);
  const [appliedJob, setAppliedJob] = useState(null);
  const [fullJobData, setFullJobData] = useState(null);
  const [calculatedMatchScore, setCalculatedMatchScore] = useState(null);

  const queryParams = new URLSearchParams(location.search);
  const candidateId = queryParams.get("id");
  const candidateEmail = queryParams.get("email");
  const jobId = queryParams.get("jobId");
  const matchScoreParam = queryParams.get("match") || "N/A";

  useEffect(() => {
    if (candidateId) {
      loadCandidate(candidateId);
    } else if (candidateEmail) {
      loadCandidateByEmail(candidateEmail);
    } else {
      setLoading(false);
    }
    loadUser();
  }, [candidateId, candidateEmail]);

  const loadCandidateByEmail = async (email) => {
    setLoading(true);
    try {
      const results = await UserProfile.filter({ email: email.toLowerCase() });
      if (results.length > 0) {
        setCandidate(results[0]);
        // Also fetch CV
        try {
          const cvs = await CV.filter({ user_email: results[0].email }, "-created_date", 1);
          if (cvs && cvs.length > 0) {
            setCvData(cvs[0]);
          }
        } catch (e) {
          console.error("Error fetching CV", e);
        }
      }
    } catch (error) {
      console.error("Error loading candidate by email:", error);
    } finally {
      setLoading(false);
    }
  };

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

  useEffect(() => {
    const fetchAppliedJobAndCalculateMatch = async () => {
      if (!user?.email || !candidate) return;

      let jobToUse = null;

      try {
        // 1. If we have a specific jobId from URL, try to fetch it first
        if (jobId) {
          try {
            const jobResults = await Job.filter({ id: jobId });
            if (jobResults.length > 0) {
              jobToUse = jobResults[0];
            }
          } catch (e) { console.error("Error fetching specific job", e); }
        }

        // 2. If no job yet, try to find one from employer's jobs that matches candidate applications
        if (!jobToUse) {
          const myJobs = await Job.filter({ created_by: user.email });
          if (myJobs && myJobs.length > 0) {
            const myJobIds = myJobs.map(j => j.id);
            // Get candidate's applications
            let apps = await JobApplication.filter({ applicant_id: candidate.id });
            // Find match
            const relevantApp = apps.find(app => myJobIds.some(id => String(id) === String(app.job_id)));

            if (relevantApp) {
              jobToUse = myJobs.find(j => String(j.id) === String(relevantApp.job_id));
            }
          }
        }

        // 3. Set State & Calculate
        if (jobToUse) {
          // Parse structured fields using safeParseJSON to handle hex strings like JobDetails does
          const parsedJob = { ...jobToUse };
          parsedJob.structured_requirements = safeParseJSON(jobToUse.structured_requirements, []);
          parsedJob.structured_certifications = safeParseJSON(jobToUse.structured_certifications, []);
          parsedJob.structured_education = safeParseJSON(jobToUse.structured_education, []);

          // Also parse standard fields if they are JSON strings
          parsedJob.requirements = safeParseJSON(jobToUse.requirements, []);
          parsedJob.responsibilities = safeParseJSON(jobToUse.responsibilities, []);

          setAppliedJob({ title: jobToUse.title, location: jobToUse.location });
          setFullJobData(parsedJob); // Store the parsed version

          try {
            const score = await calculate_match_score(candidate, parsedJob);
            if (score !== null) {
              setCalculatedMatchScore(Math.round(score * 100));
            }
          } catch (e) {
            console.error("Error calculating match score in profile", e);
          }
        }

      } catch (err) {
        console.error("Error fetching applied job details", err);
      }
    };
    fetchAppliedJobAndCalculateMatch();
  }, [user, candidate, jobId]);

  useEffect(() => {
    // Only trigger if we have a candidate, the questionnaire is loaded, insights are empty, and we aren't already generating
    if (candidate && !aiInsights.summary && !generatingInsights && questionnaireResponse !== null) {
      generateEmployerInsights(candidate);
    }
  }, [candidate, questionnaireResponse, generatingInsights]); // Removed aiInsights.summary to prevent loop if it stays empty

  const loadUser = async () => {
    try {
      const userData = await User.me();
      setUser(userData);
    } catch (error) {
      console.error("Error loading user:", error);
    }
  };

  const generateEmployerInsights = async (candidateData) => {
    const INSIGHTS_ASSISTANT_ID = 'asst_y0XNCLBkyuYcbzxjYUdmHbxr';
    const cacheKey = `employer_insights_v3_${candidateData.id}_${jobId || 'general'}`;

    const cachedData = localStorage.getItem(cacheKey);
    if (cachedData) {
      try {
        const parsed = JSON.parse(cachedData);
        setAiInsights(parsed);
        return;
      } catch (e) {
        console.error("Error parsing cached insights", e);
        localStorage.removeItem(cacheKey);
      }
    }

    setGeneratingInsights(true);
    try {
      const matchScore = matchScoreParam;

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

      // 3. Questionnaire Data
      let questionnaireText = "No questionnaire data available.";
      if (questionnaireResponse) {
        questionnaireText = `
        Preferences Questionnaire:
        - Desired Position: ${questionnaireResponse.desired_position || 'N/A'}
        - Preferred Location: ${questionnaireResponse.preferred_location || 'N/A'}
        - Availability: ${questionnaireResponse.availability || 'N/A'}
        - Job Type: ${questionnaireResponse.job_type || 'N/A'}
        - Career Status: ${questionnaireResponse.career_status || 'N/A'}
        `;
      }

      // 4. Construct Prompt
      const prompt = `
      Analyze this candidate for the following job based on their CV, preferences, and job requirements.
      
      Job Context:
      ${jobDescription}
      
      Candidate Data:
      Name: ${candidateData.full_name}
      ${questionnaireText}
      
      CV Content:
      "${cvText.substring(0, 5000)}"
      
      Task:
      Generate a valid JSON object in Hebrew with the following keys:
      1. "match_score": A number (0-100) representing the match percentage.
      2. "candidate_summary": A professional paragraph (Hebrew) summarizing the candidate's background and suitability for this specific job.
      3. "match_thoughts": A list of 5-7 bullet points (Hebrew) explaining "What Metch Thinks".
      4. "match_analysis": An object mapping criteria to status and feedback. Criteria should be: "professional_experience", "location", "availability", "job_type", "career_fit".
         Status must be one of: "match", "gap", "mismatch".
      
      Return ONLY valid JSON:
      {
        "match_score": 90,
        "candidate_summary": "...",
        "match_thoughts": ["...", "..."],
        "match_analysis": {
          "professional_experience": { "status": "match", "feedback": "ניסיון רלוונטי מאוד ב..." },
          "location": { "status": "match", "feedback": "גר בנתניה, מתאים לתל אביב" },
          "availability": { "status": "gap", "feedback": "זמין תוך חודש, המשרה דורשת מיידית" },
          "job_type": { "status": "match", "feedback": "מחפש משרה מלאה כפי שמוצע" },
          "career_fit": { "status": "match", "feedback": "התפקיד מהווה התקדמות טבעית בקריירה" }
        }
      }
      `;

      // 5. Call Assistant
      console.log("DEBUG: Calling Assistant with ID:", INSIGHTS_ASSISTANT_ID);
      console.log("DEBUG: CV Text Length:", cvText ? cvText.length : 0);
      const response = await Core.InvokeAssistant({
        assistantId: INSIGHTS_ASSISTANT_ID,
        prompt
      });

      console.log("DEBUG: Raw AI Response:", response);
      console.log("Assistant Response:", response);


      if (response.content) {
        try {
          let clean = response.content.trim();
          // Extract JSON if wrapped in text or markdown
          const jsonMatch = clean.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            clean = jsonMatch[0];
          }
          const parsed = JSON.parse(clean);

          if (parsed) {
            const insights = {
              summary: parsed.candidate_summary || parsed.summary,
              thoughts: parsed.match_thoughts || parsed.thoughts,
              score: parsed.match_score || parsed.score || 90,
              analysis: parsed.match_analysis || null
            };
            setAiInsights(insights);
            localStorage.setItem(cacheKey, JSON.stringify(insights));
          }
        } catch (e) {
          console.error("Failed to parse AI JSON", e, response.content);
        }
      }

    } catch (error) {
      console.error("Error generating insights:", error);
      // Set empty but non-null summary to stop the retry loop in useEffect
      setAiInsights(prev => ({ ...prev, summary: "נתונים אינם זמינים כעת" }));
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

        // generateEmployerInsights will be triggered by useEffect when questionnaireResponse is set
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
      const queryParams = new URLSearchParams(location.search);
      const jobId = queryParams.get("jobId");
      const jobTitle = queryParams.get("title") || "משרה כללית";

      const filterParams = {
        employer_id: user.id,
        candidate_id: candidate.id,
      };

      const existingConversations = await Conversation.filter(filterParams);

      let conversation;
      if (existingConversations.length > 0) {
        conversation = existingConversations[0];
        // Update to latest job context if provided
        try {
          await Conversation.update(conversation.id, {
            job_id: jobId || conversation.job_id,
            job_title: jobTitle || conversation.job_title,
            last_message_time: new Date().toISOString()
          });
        } catch (updateErr) {
          console.error("Error updating existing conversation context:", updateErr);
        }
      } else {
        const createParams = {
          employer_email: user.email,
          employer_id: user.id,
          candidate_email: candidate.email,
          candidate_id: candidate.id,
          candidate_name: candidate.full_name,
          job_title: jobTitle,
          last_message: "",
          last_message_time: new Date().toISOString(),
          unread_count: 0,
        };

        if (jobId) {
          createParams.job_id = jobId;
        }

        conversation = await Conversation.create(createParams);
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

  const formatCvDataToHtml = (cv) => {
    if (!cv) return "";

    const formatSection = (title, content) => `
      <div style="margin-bottom: 20px; border-bottom: 2px solid #2987cd; padding-bottom: 5px;">
        <h2 style="color: #003566; margin: 0; font-size: 18px;">${title}</h2>
      </div>
      <div style="margin-bottom: 25px;">${content}</div>
    `;

    let html = `
      <div style="font-family: Arial, sans-serif; direction: rtl; text-align: right; max-width: 800px; margin: 0 auto; color: #333;">
        <h1 style="color: #003566; text-align: center; border-bottom: 1px solid #eee; padding-bottom: 15px;">${cv.personal_details?.full_name || candidate.full_name}</h1>
        <div style="text-align: center; margin-bottom: 30px; color: #666; font-size: 14px;">
          ${cv.personal_details?.email ? `<span>${cv.personal_details.email}</span>` : ""}
          ${cv.personal_details?.phone ? ` | <span>${cv.personal_details.phone}</span>` : ""}
          ${cv.personal_details?.address ? ` | <span>${cv.personal_details.address}</span>` : ""}
        </div>
    `;

    if (cv.summary) {
      html += formatSection("תמצית", `<p style="line-height: 1.6;">${cv.summary}</p>`);
    }

    if (cv.work_experience?.length > 0) {
      const expHtml = cv.work_experience.map(exp => `
        <div style="margin-bottom: 15px;">
          <div style="display: flex; justify-content: space-between; font-weight: bold;">
            <span>${exp.title}</span>
            <span style="color: #666; font-size: 12px;">${exp.start_date || ""} - ${exp.is_current ? "היום" : (exp.end_date || "")}</span>
          </div>
          <div style="color: #2987cd; margin-top: 2px;">${exp.company} | ${exp.location || ""}</div>
          ${exp.description ? `<p style="margin-top: 5px; color: #555; font-size: 13px; white-space: pre-wrap;">${exp.description}</p>` : ""}
        </div>
      `).join("");
      html += formatSection("ניסיון תעסוקתי", expHtml);
    }

    if (cv.education?.length > 0) {
      const eduHtml = cv.education.map(edu => `
        <div style="margin-bottom: 15px;">
          <div style="display: flex; justify-content: space-between; font-weight: bold;">
            <span>${edu.institution}</span>
            <span style="color: #666; font-size: 12px;">${edu.start_date || ""} - ${edu.is_current ? "היום" : (edu.end_date || "")}</span>
          </div>
          <div style="color: #2987cd; margin-top: 2px;">${edu.degree || ""} ${edu.field_of_study ? `| ${edu.field_of_study}` : ""}</div>
          ${edu.description ? `<p style="margin-top: 5px; color: #555; font-size: 13px; white-space: pre-wrap;">${edu.description}</p>` : ""}
        </div>
      `).join("");
      html += formatSection("השכלה", eduHtml);
    }

    if (cv.skills?.length > 0) {
      const skillsHtml = `<p>${cv.skills.join(" • ")}</p>`;
      html += formatSection("כישורים", skillsHtml);
    }

    html += `
        <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; text-align: center; color: #999; font-size: 12px;">
          נשלח באמצעות מערכת Metch
        </div>
      </div>
    `;

    return html;
  };

  const handleExportToEmail = async () => {
    if (!user || !candidate || exportingResume) return;

    if (!candidate.resume_url && !cvData) {
      toast({
        title: "לא נמצאו קורות חיים",
        description: "אין קובץ מצורף או קורות חיים דיגיטליים למועמד זה.",
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
          has_pdf: !!candidate.resume_url,
          has_digital: !!cvData
        }
      );

      let attachments = [];
      let emailHtml = "";

      if (candidate.resume_url) {
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

        attachments = [{
          filename,
          content: resumeBase64,
          contentType: "application/pdf",
        }];

        emailHtml = `
          <div style="direction: rtl; text-align: right; font-family: Arial, sans-serif;">
            <p>שלום,</p>
            <p>מצ"ב קורות החיים המקוריים (PDF) של <b>${candidate.full_name}</b>.</p>
            <p>בברכה,<br/>צוות Metch</p>
          </div>
        `;
      } else if (cvData) {
        emailHtml = formatCvDataToHtml(cvData);
      }

      await SendEmail({
        to: recipient,
        from: user.email,
        subject,
        html: emailHtml,
        text: `קורות החיים של ${candidate.full_name}.`,
        attachments: attachments.length > 0 ? attachments : undefined,
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

      const isResendSandboxError = error?.message?.includes("testing emails") ||
        error?.message?.includes("registered email") ||
        error?.message?.includes("resend.dev");

      if (isResendSandboxError) {
        const verifiedEmailMatch = error?.message?.match(/\(([^)]+)\)/);
        const verifiedEmail = verifiedEmailMatch ? verifiedEmailMatch[1] : user.email;

        toast({
          title: "ממתין לאימות דומיין ב-Resend",
          description: `במצב בדיקה ניתן לשלוח מייל רק לחשבון שאליו משויך המפתח (${verifiedEmail}). המייל nagosa... לא מאומת ב-Resend.`,
          variant: "warning",
        });
      } else {
        toast({
          title: "שגיאה בשליחת המייל",
          description: error.message || "לא הצלחנו לשלוח את קורות החיים. נסה שוב מאוחר יותר.",
          variant: "destructive",
        });
      }

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
      if (candidate && user && user.user_type === 'employer') {
        try {
          // Get jobId from query params
          const params = new URLSearchParams(location.search);
          const jobId = params.get("jobId");
          const jobTitle = params.get("title");

          const jobContext = jobId ? { id: jobId, title: jobTitle } : null;

          await EmployerAnalytics.trackCandidateView(user.email, candidate, jobContext);
        } catch (err) {
          console.error("Error tracking candidate view:", err);
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
  const jobTitle = params.get("title");
  const matchFromUrl = params.get("match");

  // Prioritize URL match score if valid, then calculated, then stable hash
  const matchScore = (matchFromUrl && matchFromUrl !== "N/A" && matchFromUrl !== "0")
    ? parseInt(matchFromUrl, 10)
    : (calculatedMatchScore !== null ? calculatedMatchScore : (candidate ? getStableMatchScore(candidate.id) : 90));

  const availabilityText = {
    immediate: "מיידית",
    '1_2_weeks': 'שבוע עד שבועיים',
    two_weeks: "תוך שבועיים",
    '1_2_months': 'חודש עד חודשיים',
    one_month: "תוך חודש",
    negotiable: "גמיש/ה",
    flexible: "גמיש/ה"
  };

  const jobTypeText = {
    full_time: "משרה מלאה",
    part_time: "משרה חלקית",
    contract: "חוזה",
    freelance: "פרילנס",
    internship: "התמחות",
    shifts: "משמרות",
    flexible: "גמיש/ה",
  };

  return (
    <div className="w-full min-h-screen bg-gray-50/30 py-4 px-2 flex justify-center" dir="rtl">
      <Card className="text-card-foreground bg-white border border-gray-100 shadow-xl overflow-hidden min-h-[85vh] flex flex-col w-full max-w-[99.5%] rounded-[1.5rem] md:rounded-[2rem]">
        {/* Header Background */}
        <ProfileHeader />

        <CardContent className="p-4 sm:p-6 md:p-8 -mt-12 relative z-10 flex-grow">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col items-center text-center space-y-3"
          >
            {/* Avatar - Centered & Overlapping */}
            <div className="relative">
              <div className="w-24 h-24 md:w-28 md:h-28 bg-[#72C0E8] rounded-full flex items-center justify-center border-[5px] border-white shadow-xl overflow-hidden">
                {candidate.profile_picture ? (
                  <img
                    src={candidate.profile_picture}
                    alt={candidate.full_name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <UserIcon className="w-10 h-10 md:w-12 md:h-12 text-white" />
                )}
              </div>
            </div>

            {/* Name/Title */}
            <div className="text-center mb-4">
              <h1 className="text-2xl font-bold text-[#003566]">
                {(() => {
                  if (candidate.full_name && candidate.full_name.trim().length > 0) return candidate.full_name;
                  if (candidate.email) return candidate.email;
                  return 'מועמד ללא שם';
                })()}
              </h1>
              {(jobTitle || appliedJob?.title) && (
                <p className="text-base font-medium text-gray-500 mt-1">
                  מועמד למשרת {jobTitle || appliedJob?.title}
                </p>
              )}
            </div>

            {/* Badges */}
            <ProfileBadges
              jobTypeText={jobTypeText}
              preferred_job_types={candidate.preferred_job_types}
              preferred_location={candidate.preferred_location}
              availabilityText={availabilityText}
              availability={candidate.availability}
            />

            {/* Job Applied For */}
            {/* Removed appliedJob text to match design example 0 */}

            {/* Content Sections Container - Constrained Width */}
            <div className="w-full max-w-4xl mx-auto space-y-7">
              {/* Match Score */}
              <ProfileMatchScore matchScore={matchScore} />

              {/* Info Cards */}
              <ProfileInfo
                looking_for_summary={candidate.looking_for_summary}
                bio={candidate.bio}
                aiSummary={aiInsights.summary}
                aiThoughts={aiInsights.thoughts}
                aiAnalysis={aiInsights.analysis}
                isLoading={generatingInsights}
              />

              {/* Resume/CV */}
              <ProfileResume
                resume_url={candidate.resume_url}
                full_name={candidate.full_name}
                cvData={cvData}
                onViewCv={() => {
                  setIsCvPreviewOpen(true);
                  if (user?.user_type === 'employer' && user?.email) {
                    const params = new URLSearchParams(location.search);
                    const jobId = params.get("jobId");
                    const jobTitle = params.get("title");
                    const jobContext = jobId ? { id: jobId, title: jobTitle } : null;
                    EmployerAnalytics.trackResumeView(user.email, candidate, jobContext);
                  }
                }}
              />
            </div>

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
            jobId={new URLSearchParams(location.search).get("jobId")}
            jobTitle={new URLSearchParams(location.search).get("title")}
          />
        </CardFooter>
      </Card>

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
