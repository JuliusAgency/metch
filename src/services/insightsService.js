import { JobApplication, CandidateView, CV, QuestionnaireResponse, UserProfile } from "@/api/entities";
import { Core } from "@/api/integrations";

/**
 * Generate AI-powered career insights for a job seeker
 * @param {Object} stats - Application statistics
 * @param {Object} userProfile - User profile data
 * @param {string} cvText - CV content as text
 * @param {Object} cvDataRaw - Raw CV data object
 * @returns {Promise<Object|null>} AI insights or null if generation fails
 */
export const generateAIInsights = async (stats, userProfile, cvText, cvDataRaw) => {
  // Check cache first
  const cacheKey = `metch_insights_v2_${userProfile?.id}`;
  const cachedData = localStorage.getItem(cacheKey);
  if (cachedData) {
    try {
      const parsedCache = JSON.parse(cachedData);
      console.log("[InsightsService] Using cached insights");
      return parsedCache;
    } catch (e) {
      localStorage.removeItem(cacheKey);
    }
  }

  try {
    // Calculate derived data
    const age = userProfile?.birth_date
      ? Math.floor((new Date() - new Date(userProfile.birth_date)) / 31557600000)
      : "N/A";

    const specialization = userProfile?.specialization || "Not specified";
    const preferences = {
      locations: userProfile?.preferred_locations || [],
      availability: userProfile?.availability || [],
      job_types: userProfile?.job_types || [],
      flexibility: userProfile?.is_flexible || false
    };

    const prompt = `
      Analyze the following job seeker profile and data to provide a comprehensive career insight report.
      
      User Profile:
      - Age: ${age}
      - Specialization: ${specialization}
      - Preferences: ${JSON.stringify(preferences)}
      
      CV Content & Experience:
      "${cvText ? cvText.substring(0, 4000).replace(/"/g, "'") : 'No CV content available'}"
      
      Match History Stats:
      - Total Applications: ${stats.totalApplications}
      - Responses: ${stats.responses}
      - Profile Views: ${stats.profileViews}
      
      Act as an expert career coach. Analyze the profile deeply.
      Return a STRICT VALID JSON object in Hebrew with the following keys:
      {
        "general_summary": "Paragraph summarizing the candidate's profile, tone: professional & empowering.",
        "key_strengths": ["Strength 1 (bullet)", "Strength 2 (bullet)", "Strength 3 (bullet)"],
        "interview_strength": "A specific strength to highlight in interviews.",
        "improvements": ["Point for improvement 1", "Point for improvement 2 (e.g. detailed projects, skills)"],
        "practical_recommendation": "One actionable recommendation.",
        "resume_tips": ["Tip 1 for CV", "Tip 2 for CV"],
        "career_path_status": "A concluding encouraging sentence about their process state (e.g., 'You are on the right path...')."
      }
      
      Guidelines:
      - general_summary: ~2 sentences. Professional.
      - key_strengths: 3 bullets. Focus on concrete skills/traits.
      - interview_strength: 1 sentence explaining what to sell in interviews.
      - improvements: 2-3 bullets. Constructive.
      - practical_recommendation: 1 sentence.
      - resume_tips: 1-2 bullets.
      - career_path_status: 1 inspiring sentence.
      
      Do not format as markdown. Do not include newlines in strings. Return ONLY the JSON.
    `;

    const INSIGHTS_ASSISTANT_ID = import.meta.env.VITE_MY_INSIGHTS_EMPLOYEE_KEY;

    if (!INSIGHTS_ASSISTANT_ID) {
      console.warn("[InsightsService] VITE_MY_INSIGHTS_EMPLOYEE_KEY is missing from env");
      return null;
    }

    console.log("[InsightsService] Generating AI insights...");
    const response = await Core.InvokeAssistant({
      prompt,
      assistantId: INSIGHTS_ASSISTANT_ID
    });

    console.log("[InsightsService] AI Response received");

    let parsed = null;
    try {
      let cleanContent = response.content.replace(/```json/g, '').replace(/```/g, '').trim();
      const jsonMatch = cleanContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        cleanContent = jsonMatch[0];
      }
      parsed = JSON.parse(cleanContent);

      // Cache the result
      if (parsed && userProfile?.id) {
        localStorage.setItem(cacheKey, JSON.stringify(parsed));
        console.log("[InsightsService] Insights cached successfully");
      }

    } catch (e) {
      console.error("[InsightsService] Failed to parse AI response", e);
    }

    return parsed;

  } catch (error) {
    console.error("[InsightsService] Error generating AI insights:", error);
    return null;
  }
};

/**
 * Trigger automatic insights generation for a user
 * Checks if all required data exists before generating
 * @param {string} userId - User ID
 * @param {string} userEmail - User email
 * @returns {Promise<boolean>} True if insights were generated, false otherwise
 */
export const triggerInsightsGeneration = async (userId, userEmail) => {
  try {
    console.log("[InsightsService] Triggering insights generation for user:", userId);

    // Fetch all required data
    const [userProfile, cvData, questionnaireResponse, applications, candidateViews] = await Promise.all([
      UserProfile.filter({ id: userId }).catch(() => []),
      CV.filter({ user_email: userEmail }, "-created_date", 1).catch(() => []),
      QuestionnaireResponse.filter({ user_email: userEmail }).catch(() => []),
      JobApplication.filter({ applicant_email: userEmail }, "-created_date", 1000).catch(() => []),
      CandidateView.filter({ candidate_email: userEmail }).catch(() => [])
    ]);

    const profile = userProfile[0];
    const cv = cvData[0];
    const questionnaire = questionnaireResponse[0];

    // Check if all required data exists
    if (!profile) {
      console.log("[InsightsService] User profile not found, skipping insights generation");
      return false;
    }

    if (!cv) {
      console.log("[InsightsService] CV not found, skipping insights generation");
      return false;
    }

    if (!questionnaire) {
      console.log("[InsightsService] Questionnaire response not found, continuing with limited data");
    }

    console.log("[InsightsService] Required core data found, proceeding with generation");

    // Construct CV text
    let cvText = "";
    if (cv.parsed_content && cv.parsed_content.length > 50) {
      console.log("[InsightsService] Using parsed_content from PDF, length:", cv.parsed_content.length);
      cvText = cv.parsed_content;
    } else {
      console.log("[InsightsService] parsed_content is missing or too short, attempting fallback to structured fields");
      // Build text from structured fields
      const parts = [];
      if (cv.summary) parts.push(`Summary: ${cv.summary}`);

      if (cv.work_experience && Array.isArray(cv.work_experience)) {
        parts.push("Work Experience:");
        cv.work_experience.forEach(exp => {
          parts.push(`- ${exp.title} at ${exp.company} (${exp.start_date} - ${exp.is_current ? 'Present' : exp.end_date}): ${exp.description || ''}`);
        });
      }

      if (cv.education && Array.isArray(cv.education)) {
        parts.push("Education:");
        cv.education.forEach(edu => {
          parts.push(`- ${edu.degree} in ${edu.field_of_study} at ${edu.institution}`);
        });
      }

      if (cv.skills && Array.isArray(cv.skills)) {
        const skillsText = Array.isArray(cv.skills) ? cv.skills.join(', ') : cv.skills;
        parts.push(`Skills: ${skillsText}`);
      }

      cvText = parts.join("\n\n");
      console.log("[InsightsService] Fallback CV text length:", cvText.length);
    }

    // Calculate stats
    const totalApplications = applications.length;
    const responses = applications.filter(app => app.status && app.status !== 'pending').length;
    const profileViews = candidateViews.length;

    const stats = {
      totalApplications,
      responses,
      conversionRate: totalApplications > 0 ? Math.round((responses / totalApplications) * 100) : 0,
      profileViews
    };

    console.log("[InsightsService] Generating insights with CV text length:", cvText.length);

    // Generate insights
    const insights = await generateAIInsights(stats, profile, cvText, cv);

    if (insights) {
      console.log("[InsightsService] Insights generated successfully for user:", userId);
      return true;
    } else {
      console.warn("[InsightsService] Insights generation failed (AI returned null) for user:", userId);
      return false;
    }

  } catch (error) {
    console.error("[InsightsService] Error in triggerInsightsGeneration for user:", userId, error);
    return false;
  }
};

/**
 * Invalidate cached insights for a user
 * Call this when CV is updated to force regeneration
 * @param {string} userId - User ID
 */
export const invalidateInsightsCache = (userId) => {
  const cacheKey = `metch_insights_v2_${userId}`;
  localStorage.removeItem(cacheKey);
  console.log("[InsightsService] Cache invalidated for user:", userId);
};
