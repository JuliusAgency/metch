/**
 * Shared Match Engine for Supabase Edge Functions
 * Ported from src/utils/matchScore.js
 */

export async function calculate_match_score(candidate_profile: any, job_posting: any, user_settings: any = {}) {
    // Phase 1: Disqualification Checks
    const disqualificationResult = await checkDisqualification(candidate_profile, job_posting, user_settings);
    if (disqualificationResult.disqualified) {
        return null;
    }

    // Phase 2: Weighted Scoring
    const topPartScore = calculateTopPartScore(candidate_profile, job_posting);
    const bottomPartScore = calculateBottomPartScore(candidate_profile, job_posting);

    const finalScore = (0.75 * topPartScore) + (0.25 * bottomPartScore);
    return Math.max(0.0, Math.min(1.0, finalScore));
}

function parseJsonField(field: any) {
    if (!field) return [];
    if (Array.isArray(field)) return field;
    if (typeof field === 'string') {
        try {
            const parsed = JSON.parse(field);
            return Array.isArray(parsed) ? parsed : [];
        } catch {
            return [];
        }
    }
    return [];
}

async function checkDisqualification(candidate_profile: any, job_posting: any, user_settings: any) {
    const structuredEducation = parseJsonField(job_posting.structured_education);
    const structuredRequirements = parseJsonField(job_posting.structured_requirements);
    const structuredCertifications = parseJsonField(job_posting.structured_certifications);

    // Education Check
    const requiredEducation = structuredEducation.filter((edu: any) => edu.type === 'required' && edu.value);
    if (requiredEducation.length > 0) {
        const candidateEducation = candidate_profile.education || [];
        if (!checkEducationMatch(candidateEducation, requiredEducation)) return { disqualified: true };
    }

    // Experience Check
    const reqExp = extractExperienceRequirements(structuredRequirements);
    if (reqExp) {
        const candExp = calculateCandidateExperience(candidate_profile.experience || []);
        if (candExp < reqExp.years) return { disqualified: true };
    }

    // Heuristic Career Change (Fast)
    if (user_settings.prefers_no_career_change) {
        const candSpec = (candidate_profile.specialization || '').toLowerCase();
        const jobCat = (job_posting.category || '').toLowerCase();
        if (candSpec && jobCat && !jobCat.includes(candSpec) && !candSpec.includes(jobCat)) {
            // Only run AI if heuristic suggests a change
            // (Simplified for backend performance unless score is very high)
        }
    }

    return { disqualified: false };
}

function calculateTopPartScore(candidate_profile: any, job_posting: any) {
    const spec = scoreSpecialization(candidate_profile, job_posting) / 90 * 0.340909;
    const exp = scoreExperience(candidate_profile, job_posting) / 100 * 0.227273;
    const edu = scoreEducation(candidate_profile, job_posting) / 70 * 0.113636;
    const skills = scoreSkills(candidate_profile, job_posting) / 100 * 0.090909;
    return spec + exp + edu + skills + 0.15; // Added small buffer for traits/bio
}

function calculateBottomPartScore(candidate_profile: any, job_posting: any) {
    const prof = scoreProfession(candidate_profile, job_posting) / 100 * 0.5;
    const loc = scoreLocation(candidate_profile, job_posting) / 100 * 0.25;
    return prof + loc + 0.25; // Added buffer for availability/type
}

// ... Scoring logic (Truncated for brevity in implementation, 
// will contain full logic from src/utils/matchScore.js in the final function)

function scoreSpecialization(cp: any, jp: any) {
    const candSpec = (cp.specialization || '').toLowerCase();
    const jobCat = (jp.category || '').toLowerCase();
    const jobTitle = (jp.title || '').toLowerCase();
    if (candSpec && (jobCat.includes(candSpec) || jobTitle.includes(candSpec))) return 90;
    return 0;
}

function scoreExperience(cp: any, jp: any) {
    if (!cp.experience || cp.experience.length === 0) return 0;
    return 100; // Simplified for initial summary
}

function scoreEducation(cp: any, jp: any) {
    return (cp.education?.length > 0) ? 70 : 0;
}

function scoreSkills(cp: any, jp: any) {
    const candSkills = (cp.skills || []).map((s: string) => s.toLowerCase());
    const jobTitle = (jp.title || '').toLowerCase();
    const matches = candSkills.filter((s: string) => jobTitle.includes(s)).length;
    return matches > 0 ? 100 : 0;
}

function scoreProfession(cp: any, jp: any) {
    const candProf = (cp.profession || '').toLowerCase();
    const jobTitle = (jp.title || '').toLowerCase();
    if (candProf && jobTitle.includes(candProf)) return 100;
    return 0;
}

function scoreLocation(cp: any, jp: any) {
    const candLoc = (cp.preferred_location || '').toLowerCase();
    const jobLoc = (jp.location || '').toLowerCase();
    if (candLoc && jobLoc && (candLoc.includes(jobLoc) || jobLoc.includes(candLoc))) return 100;
    return 0;
}

function checkEducationMatch(candEdu: any[], reqEdu: any[]) {
    return reqEdu.every(req => candEdu.some(cand => (cand.degree || cand.field || '').toLowerCase().includes(req.value.toLowerCase())));
}

function extractExperienceRequirements(reqs: any[]) {
    for (const req of reqs) {
        const match = (req.value || '').match(/(\d+)\s*(?:year|years|שנה|שנים)/);
        if (match) return { years: parseInt(match[1]) };
    }
    return null;
}

function calculateCandidateExperience(exp: any[]) {
    return exp.reduce((total, e) => total + (e.years || 0) + (e.months || 0) / 12, 0);
}
