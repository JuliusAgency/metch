import { InvokeLLM } from '@/api/integrations';

// Persistent cache using localStorage
const CACHE_KEY = 'metch_career_change_cache_v1';
let careerChangeCache = new Map();

// Initialize cache from localStorage
try {
  const savedCache = localStorage.getItem(CACHE_KEY);
  if (savedCache) {
    careerChangeCache = new Map(JSON.parse(savedCache));
  }
} catch (e) {
  console.warn('Failed to load career change cache from localStorage', e);
}

// Helper to save cache
const saveCache = () => {
  try {
    // Convert Map to array for JSON serialization
    const cacheArray = Array.from(careerChangeCache.entries());
    // Limit cache size to prevent quota errors (keep last 500)
    if (cacheArray.length > 500) {
      cacheArray.splice(0, cacheArray.length - 500);
    }
    localStorage.setItem(CACHE_KEY, JSON.stringify(cacheArray));
  } catch (e) {
    console.warn('Failed to save career change cache', e);
  }
};

/**
 * AI-powered function to determine if a job represents a significant career change
 * @param {Object} candidate_profile - Candidate profile data
 * @param {Object} job_posting - Job posting data
 * @returns {Promise<boolean>} True if job represents a career change, false otherwise
 */
export async function is_career_change(candidate_profile, job_posting) {
  try {
    // 1. Fast Heuristic Check
    const candidateSpec = (candidate_profile.specialization || '').toLowerCase();
    const candidateProf = (candidate_profile.profession || '').toLowerCase();
    const jobCat = (job_posting.category || '').toLowerCase();
    const jobTitle = (job_posting.title || '').toLowerCase();

    // If specialization or profession clearly match the job, it's NOT a career change
    if (candidateSpec && (jobCat.includes(candidateSpec) || jobTitle.includes(candidateSpec))) {
      return false;
    }
    if (candidateProf && (jobCat.includes(candidateProf) || jobTitle.includes(candidateProf))) {
      return false;
    }

    // 2. Cache Check
    const cacheKey = `${candidate_profile.id || candidate_profile.email}_${job_posting.id}`;
    if (careerChangeCache.has(cacheKey)) {
      return careerChangeCache.get(cacheKey);
    }

    // 3. AI Analysis (only if heuristic is unclear)
    // Build context about candidate's background
    const candidateBackground = buildCandidateBackground(candidate_profile);
    
    // Build context about job requirements
    const jobRequirements = buildJobRequirements(job_posting);

    // Create prompt for AI analysis
    const prompt = createCareerChangePrompt(candidateBackground, jobRequirements);

    // Call AI to analyze with timeout protection
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('AI analysis timeout')), 8000)
    );

    try {
      const response = await Promise.race([
        InvokeLLM({
          prompt,
          model: 'gpt-3.5-turbo',
          temperature: 0.3,
          max_tokens: 200
        }),
        timeoutPromise
      ]);

      // Parse AI response
      const result = parseCareerChangeResponse(response.content);
      
      // Save to cache
      careerChangeCache.set(cacheKey, result);
      saveCache();
      
      return result;
    } catch (aiError) {
      console.warn(`Career change AI failed for job ${job_posting.id}:`, aiError.message);
      // Fallback: If AI fails (network, timeout, etc.), default to NO career change
      // to avoid blocking the user from potentially relevant jobs.
      // IMPORTANT: Cache this fallback result so we don't retry and block again on next load
      careerChangeCache.set(cacheKey, false);
      saveCache();
      return false; 
    }
  } catch (error) {
    console.error('Critical error in career change detection:', error);
    return false;
  }
}

/**
 * Build candidate background summary for AI analysis
 */
function buildCandidateBackground(candidate_profile) {
  const parts = [];

  if (candidate_profile.specialization) {
    parts.push(`Specialization: ${candidate_profile.specialization}`);
  }

  if (candidate_profile.profession) {
    parts.push(`Profession: ${candidate_profile.profession}`);
  }

  if (candidate_profile.experience && Array.isArray(candidate_profile.experience)) {
    const experienceSummary = candidate_profile.experience
      .map(exp => {
        const role = exp.title || exp.role || 'Unknown role';
        const years = exp.years || 0;
        return `${role} (${years} years)`;
      })
      .join(', ');
    if (experienceSummary) {
      parts.push(`Experience: ${experienceSummary}`);
    }
  }

  if (candidate_profile.skills && Array.isArray(candidate_profile.skills)) {
    parts.push(`Skills: ${candidate_profile.skills.join(', ')}`);
  }

  if (candidate_profile.education && Array.isArray(candidate_profile.education)) {
    const educationSummary = candidate_profile.education
      .map(edu => {
        const degree = edu.degree || edu.field || 'Unknown';
        return degree;
      })
      .join(', ');
    if (educationSummary) {
      parts.push(`Education: ${educationSummary}`);
    }
  }

  return parts.join('\n');
}

/**
 * Build job requirements summary for AI analysis
 */
function buildJobRequirements(job_posting) {
  const parts = [];

  if (job_posting.title) {
    parts.push(`Job Title: ${job_posting.title}`);
  }

  if (job_posting.category) {
    parts.push(`Category: ${job_posting.category}`);
  }

  if (job_posting.description) {
    parts.push(`Description: ${job_posting.description.substring(0, 500)}`); // Limit length
  }

  if (job_posting.structured_requirements && Array.isArray(job_posting.structured_requirements)) {
    const requirements = job_posting.structured_requirements
      .map(req => req.value)
      .filter(Boolean)
      .join(', ');
    if (requirements) {
      parts.push(`Requirements: ${requirements}`);
    }
  }

  return parts.join('\n');
}

/**
 * Create prompt for AI career change analysis
 */
function createCareerChangePrompt(candidateBackground, jobRequirements) {
  return `You are analyzing whether a job opportunity represents a significant career change for a candidate.

CANDIDATE BACKGROUND:
${candidateBackground}

JOB REQUIREMENTS:
${jobRequirements}

A career change is defined as a significant shift in:
- Field/specialization (e.g., software developer -> supermarket cashier)
- Industry (e.g., technology -> retail)
- Skill set (e.g., technical skills -> manual labor)
- Professional level (e.g., senior manager -> entry-level position)

Respond with ONLY "YES" if this represents a significant career change, or "NO" if it's within the same or closely related field.

Response:`;
}

/**
 * Parse AI response to determine if it's a career change
 */
function parseCareerChangeResponse(responseContent) {
  const content = (responseContent || '').toLowerCase().trim();
  
  // Check for explicit yes/no indicators
  if (content.includes('yes') || content.includes('true') || content.includes('career change')) {
    return true;
  }
  
  if (content.includes('no') || content.includes('false') || content.includes('not a career change')) {
    return false;
  }

  // Default to false if unclear (conservative approach)
  return false;
}

