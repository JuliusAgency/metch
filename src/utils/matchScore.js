import { is_career_change } from './careerChangeDetection';

/**
 * Helper function to parse JSON string fields from database
 * These fields are stored as text in the database but contain JSON arrays
 */
function parseJsonField(field) {
  if (!field) return [];
  if (Array.isArray(field)) return field;
  if (typeof field === 'string') {
    try {
      const parsed = JSON.parse(field);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      console.warn('Failed to parse JSON field:', e);
      return [];
    }
  }
  return [];
}

/**
 * Main function to calculate match score between candidate and job
 * @param {Object} candidate_profile - Candidate profile data
 * @param {Object} job_posting - Job posting data
 * @param {Object} user_settings - User settings/preferences
 * @returns {Promise<number|null>} Match score between 0.0 and 1.0, or null if disqualified
 */
export async function calculate_match_score(candidate_profile, job_posting, user_settings = {}) {
  const logGroupId = `Match Calculation: ${candidate_profile.full_name || 'Candidate'} <-> ${job_posting.title} (${job_posting.id})`;
  console.groupCollapsed(logGroupId);
  console.log("=== 1. Inputs ===");
  console.log("Candidate Profile:", {
      name: candidate_profile.full_name,
      title: candidate_profile.title || candidate_profile.job_title,
      specialization: candidate_profile.specialization,
      experience: candidate_profile.experience?.length || 0,
      skills: candidate_profile.skills,
      location: candidate_profile.preferred_location || candidate_profile.preferred_locations
  });
  console.log("Job Posting:", {
      id: job_posting.id,
      title: job_posting.title,
      category: job_posting.category,
      location: job_posting.location,
      requirements: parseJsonField(job_posting.structured_requirements),
      education: parseJsonField(job_posting.structured_education)
  });

  // Phase 1: Disqualification Checks
  const disqualificationResult = await checkDisqualification(candidate_profile, job_posting, user_settings);
  if (disqualificationResult.disqualified) {
    console.log(`❌ Disqualified: ${disqualificationResult.reason}`);
    console.groupEnd();
    return null; // or 0.0, depending on requirements
  }

  // Phase 2: Weighted Scoring
  const topPartScore = calculateTopPartScore(candidate_profile, job_posting);
  const bottomPartScore = calculateBottomPartScore(candidate_profile, job_posting);

  // Final Score Formula: Final_Match_Score = (0.75 * Score_Top_Part) + (0.25 * Score_Bottom_Part)
  let finalScore = (0.75 * topPartScore) + (0.25 * bottomPartScore);

  // Phase 1 Adjustments: Apply Soft Penalties from "Hard Filters"
  if (disqualificationResult.penalty > 0) {
    console.log(`🔻 Applying Soft Pattern Penalty: -${disqualificationResult.penalty.toFixed(2)}`);
    finalScore -= disqualificationResult.penalty;
  }

  // Phase 3: "Dealbreaker" Penalties (Location & Job Type)
  // Even if weighted score is high, a complete mismatch here should reduce the score significantly.
  const locPenalty = scoreLocation(candidate_profile, job_posting) === 0 ? 0.15 : 0;
  if (locPenalty > 0) {
      console.log('🔻 Applying Location Dealbreaker Penalty: -0.15 (No location match)');
      finalScore -= locPenalty;
  }

  const typePenalty = scoreJobType(candidate_profile, job_posting) === 0 ? 0.10 : 0;
  if (typePenalty > 0) {
      console.log('🔻 Applying Job Type Dealbreaker Penalty: -0.10 (No job type match)');
      finalScore -= typePenalty;
  }

  const finalResult = Math.max(0.0, Math.min(1.0, finalScore));

  // --- Construct Detailed AI JSON Log ---
  const getMatchLevel = (score) => {
    if (score >= 90) return "FULL";
    if (score >= 70) return "HIGH";
    if (score >= 40) return "MEDIUM";
    return "NONE";
  };

  // Recalculate component raw scores (0-100) for logging
  // Note: calculateTopPartScore / calculateBottomPartScore return weighted sums. We need raw.
  const raw = {
    specialization: scoreSpecialization(candidate_profile, job_posting),
    experience: scoreExperience(candidate_profile, job_posting),
    education: scoreEducation(candidate_profile, job_posting),
    skills: scoreSkills(candidate_profile, job_posting),
    traits: scoreCharacterTraits(candidate_profile, job_posting),
    jobDesc: scoreJobDescription(candidate_profile, job_posting),
    profession: scoreProfession(candidate_profile, job_posting),
    location: scoreLocation(candidate_profile, job_posting),
    availability: scoreAvailability(candidate_profile, job_posting),
    jobType: scoreJobType(candidate_profile, job_posting)
  };

  const weights = {
    prof: { spec: 300, exp: 200, edu: 100, skills: 80, traits: 50, jobDesc: 150 }, // Sum 880
    pref: { prof: 160, loc: 440, avail: 100, type: 100 } // Sum 800
  };

  const profActual = 
    (raw.specialization / 100 * weights.prof.spec) +
    (raw.experience / 100 * weights.prof.exp) +
    (raw.education / 100 * weights.prof.edu) +
    (raw.skills / 100 * weights.prof.skills) +
    (raw.traits / 100 * weights.prof.traits) +
    (raw.jobDesc / 100 * weights.prof.jobDesc);

  const prefActual = 
    (raw.profession / 100 * weights.pref.prof) +
    (raw.location / 100 * weights.pref.loc) +
    (raw.availability / 100 * weights.pref.avail) +
    (raw.jobType / 100 * weights.pref.type);

  const logObject = {
      "schema_name": "match_analysis_result",
      "parameters": {
        "Professional": {
          "Area of Expertise": { "match_level": getMatchLevel(raw.specialization), "weight": weights.prof.spec, "score": raw.specialization / 100 * weights.prof.spec },
          "Experience": { "match_level": getMatchLevel(raw.experience), "weight": weights.prof.exp, "score": raw.experience / 100 * weights.prof.exp },
          "Education": { "match_level": getMatchLevel(raw.education), "weight": weights.prof.edu, "score": raw.education / 100 * weights.prof.edu },
          "Skills": { "match_level": getMatchLevel(raw.skills), "weight": weights.prof.skills, "score": raw.skills / 100 * weights.prof.skills },
          "Character Traits": { "match_level": getMatchLevel(raw.traits), "weight": weights.prof.traits, "score": raw.traits / 100 * weights.prof.traits },
          "Job Description": { "match_level": getMatchLevel(raw.jobDesc), "weight": weights.prof.jobDesc, "score": raw.jobDesc / 100 * weights.prof.jobDesc }
        },
        "Preference": {
          "Profession": { "match_level": getMatchLevel(raw.profession), "weight": weights.pref.prof, "score": raw.profession / 100 * weights.pref.prof },
          "Location": { "match_level": getMatchLevel(raw.location), "weight": weights.pref.loc, "score": raw.location / 100 * weights.pref.loc },
          "Availability": { "match_level": getMatchLevel(raw.availability), "weight": weights.pref.avail, "score": raw.availability / 100 * weights.pref.avail },
          "Job Type": { "match_level": getMatchLevel(raw.jobType), "weight": weights.pref.type, "score": raw.jobType / 100 * weights.pref.type }
        }
      },
      "calculation": {
        "Professional": {
          "actual_score": Math.round(profActual),
          "max_score": 880,
          "percent": (profActual / 880 * 100).toFixed(2),
          "formula": "(actual_score / max_score) × 100"
        },
        "Preference": {
          "actual_score": Math.round(prefActual),
          "max_score": 800,
          "percent": (prefActual / 800 * 100).toFixed(2),
          "formula": "(actual_score / max_score) × 100"
        }
      },
      "weighting": {
        "Professional_weight": 0.75,
        "Preference_weight": 0.25,
        "final_score_percent": (finalResult * 100).toFixed(2),
        "formula": "(Professional_percent × 0.75) + (Preference_percent × 0.25)"
      }
  };

  console.log(JSON.stringify(logObject, null, 2));
  console.groupEnd();
  
  return finalResult;
}

/**
 * Calculate match score breakdown for AI analysis
 * Returns detailed scores for each component
 */
export async function calculate_match_breakdown(candidate_profile, job_posting, user_settings = {}) {
  // Phase 1: Disqualification Checks
  const disqualificationResult = await checkDisqualification(candidate_profile, job_posting, user_settings);
  
  // Phase 2: Weighted Scoring
  const topPartScore = calculateTopPartScore(candidate_profile, job_posting);
  const bottomPartScore = calculateBottomPartScore(candidate_profile, job_posting);

  // Individual Component Scores (Unweighted raw scores 0-100 or similar)
  // We re-calculate them here to return the raw values for the AI
  const rawScores = {
      specialization: scoreSpecialization(candidate_profile, job_posting), 
      experience: scoreExperience(candidate_profile, job_posting),
      education: scoreEducation(candidate_profile, job_posting),
      skills: scoreSkills(candidate_profile, job_posting),
      characterTraits: scoreCharacterTraits(candidate_profile, job_posting),
      jobDescription: scoreJobDescription(candidate_profile, job_posting),
      profession: scoreProfession(candidate_profile, job_posting),
      location: scoreLocation(candidate_profile, job_posting),
      availability: scoreAvailability(candidate_profile, job_posting),
      jobType: scoreJobType(candidate_profile, job_posting)
  };

  // Final Score Formula (Aligned with 75/25 Split)
  let finalScore = (0.75 * topPartScore) + (0.25 * bottomPartScore);

  // Phase 1 Adjustments: Apply Soft Penalties from "Hard Filters"
  if (disqualificationResult.penalty > 0) {
    finalScore -= disqualificationResult.penalty;
  }

  // Phase 3: "Dealbreaker" Penalties (Location & Job Type)
  // Use raw scores check (0 means no match)
  if (rawScores.location === 0) {
      finalScore -= 0.15;
  }
  if (rawScores.jobType === 0) {
      finalScore -= 0.10;
  }
  
  const totalScore = Math.max(0.0, Math.min(1.0, finalScore)) * 100; // Return as 0-100

  return {
      total_score: Math.round(totalScore),
      disqualified: disqualificationResult.disqualified,
      penalty: disqualificationResult.penalty,
      breakdown: rawScores,
      top_part_score: topPartScore,
      bottom_part_score: bottomPartScore
  };
}

/**
 * Phase 1: Check for disqualification conditions
 */
async function checkDisqualification(candidate_profile, job_posting, user_settings) {
  let penalty = 0;

  // 1.1 Hard Filters -> Soft Penalties

  // Parse JSON fields from database
  const structuredEducation = parseJsonField(job_posting.structured_education);
  const structuredRequirements = parseJsonField(job_posting.structured_requirements);
  const structuredCertifications = parseJsonField(job_posting.structured_certifications);

  // Required Education - Handled by Phase 2 Scoring (returns 0 if no match)
  // No explicit penalty needed here, as losing the weighted score is sufficient.

  // Required Experience - Handled by Phase 2 Scoring (returns 0 if no match)
  // No explicit penalty needed here.

  // Required Certification/License Check
  // NOT handled in Phase 2, so we add a specific penalty.
  // Penalty removed by user request
  // if (requiredCertifications.length > 0) { ... }

  // Required Language Check
  // NOT handled in Phase 2, so we add a specific penalty.
  const requiredLanguages = extractLanguageRequirements(structuredRequirements);
  if (requiredLanguages.length > 0) {
    const candidateLanguages = candidate_profile.languages || [];
    const hasRequiredLanguage = checkLanguagesMatch(candidateLanguages, requiredLanguages);
    if (!hasRequiredLanguage) {
      console.log('Soft Penalty: Missing Required Language (-5%)');
      penalty += 0.05;
    }
  }

  // 1.2 Soft Filter: Career Change Preference (Keep Strict)
  if (user_settings.prefers_no_career_change === true) {
    const isCareerChange = await is_career_change(candidate_profile, job_posting);
    if (isCareerChange) {
      return { disqualified: true, reason: 'Career change detected' };
    }
  }

  return { disqualified: false, penalty };
}

/**
 * Phase 2: Calculate Top Part Score (75% weight)
 */
function calculateTopPartScore(candidate_profile, job_posting) {
  const scores = {};

  // Specialization (תחום ההתמחות) - Weight: 0.340909 (300/880)
  scores.specialization = scoreSpecialization(candidate_profile, job_posting) / 100 * 0.340909;

  // Experience (ניסיון) - Weight: 0.227273 (200/880)
  scores.experience = scoreExperience(candidate_profile, job_posting) / 100 * 0.227273;

  // Education (השכלה) - Weight: 0.113636 (100/880)
  scores.education = scoreEducation(candidate_profile, job_posting) / 100 * 0.113636;

  // Skills (מיומנויות) - Weight: 0.090909 (80/880)
  scores.skills = scoreSkills(candidate_profile, job_posting) / 100 * 0.090909;

  // Character Traits (תכונות אופי) - Weight: 0.056818 (50/880)
  scores.characterTraits = scoreCharacterTraits(candidate_profile, job_posting) / 100 * 0.056818;

  // Job Description (תיאור תפקיד) - Weight: 0.170455 (150/880)
  scores.jobDescription = scoreJobDescription(candidate_profile, job_posting) / 100 * 0.170455;

  // Sum all weighted scores
  const totalScore = Object.values(scores).reduce((sum, score) => sum + score, 0);

  return Math.min(1.0, totalScore);
}

/**
 * Phase 2: Calculate Bottom Part Score (25% weight)
 */
function calculateBottomPartScore(candidate_profile, job_posting) {
  const scores = {};

  // Profession (מקצוע) - Weight: 20.0%, Max: 100
  scores.profession = scoreProfession(candidate_profile, job_posting) / 100 * (20.0 / 100);

  // Location (מיקום) - Weight: 55.0%, Max: 100
  scores.location = scoreLocation(candidate_profile, job_posting) / 100 * (55.0 / 100);

  // Availability (זמינות) - Weight: 12.5%, Max: 100
  scores.availability = scoreAvailability(candidate_profile, job_posting) / 100 * (12.5 / 100);

  // Job Type (סוג המשרה) - Weight: 12.5%, Max: 100
  scores.jobType = scoreJobType(candidate_profile, job_posting) / 100 * (12.5 / 100);

  // Sum all weighted scores
  const totalScore = Object.values(scores).reduce((sum, score) => sum + score, 0);

  return totalScore;
}

// ==================== TOP PART SCORING FUNCTIONS ====================

/**
 * Score Specialization (תחום ההתמחות)
 * 90: Full match, 75: Close skills, 0: Irrelevant
 */
function scoreSpecialization(candidate_profile, job_posting) {
  const candidateSpecialization = (candidate_profile.specialization || candidate_profile.profession || candidate_profile.job_title || candidate_profile.title || '').toLowerCase();
  const jobCategory = job_posting.category?.toLowerCase() || '';
  const jobTitle = job_posting.title?.toLowerCase() || '';
  const jobDescription = (job_posting.description || '').toLowerCase();



  // Use Best Match strategy to check all candidate title fields against job title/category
  const bestTitleMatch = getBestTitleMatch(candidate_profile, [jobCategory, jobTitle]);

  
  if (bestTitleMatch >= 80) {
    return 100;
  }
  
  // Also check description for strict/fuzzy match if needed, but usually title/category is enough for high score.
  // If we want to check description too:
  const descriptionMatch = getBestTitleMatch(candidate_profile, [jobDescription]);
  if (descriptionMatch >= 80) {
     return 100;
  }

  // Fallback to strict substring for description if fuzzy failed but strict exists (covered by getBestTitleMatch logic mostly)


  // Close skills - check for related terms
  const relatedTerms = getRelatedSpecializationTerms(candidateSpecialization);
  const hasRelatedTerm = relatedTerms.some(term =>
    jobCategory.includes(term) ||
    jobTitle.includes(term) ||
    jobDescription.includes(term)
  );

  if (hasRelatedTerm) {
    return 75; // Increased from 60 for softer matching
  }

  return 0;
}

/**
 * Score Experience (ניסיון)
 * 100: Full match, 85: Similar, 0: No relevant experience
 */
function scoreExperience(candidate_profile, job_posting) {
  const candidateExperience = candidate_profile.experience || [];
  const jobRequirements = parseJsonField(job_posting.structured_requirements);
  const jobDescription = (job_posting.description || '').toLowerCase();
  const jobTitle = (job_posting.title || '').toLowerCase();

  // Extract key experience terms from job (Now includes Job Title words!)
  const jobExperienceTerms = extractExperienceTerms(jobRequirements, jobDescription, jobTitle);

  let fullMatches = 0;
  let similarMatches = 0;

  if (candidateExperience.length > 0) {
    candidateExperience.forEach(exp => {
      const expText = (exp.title || exp.role || exp.description || '').toLowerCase();
      const expType = (exp.type || '').toLowerCase();

      jobExperienceTerms.forEach(jobTerm => {
        // Check for exact phrase or tokens
        if (expText.includes(jobTerm.term) || expType === jobTerm.type) {
          if (jobTerm.isExact) {
            fullMatches++;
          } else {
            similarMatches++;
          }
        }
      });
    });
  }

  if (fullMatches > 0) {
    return 100;
  } else if (similarMatches > 0) {
    return 85; 
  }

  // Fallback: If no experience array match, but Candidate Title/Profession matches Job Terms
  // (Handling case where experience parsing failed but user IS that thing)
  const candidateTitle = (candidate_profile.job_title || candidate_profile.profession || candidate_profile.specialization || '').toLowerCase();
  if (candidateTitle) {
      const titleMatch = jobExperienceTerms.some(t => candidateTitle.includes(t.term) || t.term.includes(candidateTitle));
      if (titleMatch) {
      if (titleMatch) {
          return 100; // Updated to 100 to match AI "FULL" score
      }
      }
  }

  return 0;
}

/**
 * Score Education (השכלה)
 * 70: Relevant education exists, 0: No relevant education
 */
function scoreEducation(candidate_profile, job_posting) {
  const candidateEducation = candidate_profile.education || [];
  const jobEducation = parseJsonField(job_posting.structured_education);

  // 1. If Job has specific requirements
  if (jobEducation.length > 0) {
    if (candidateEducation.length === 0) return 0;

    // Check if matches requirements
    const hasRelevantEducation = candidateEducation.some(candidateEdu => {
      const candidateField = (candidateEdu.field || candidateEdu.degree || '').toLowerCase();
      return jobEducation.some(jobEdu => {
        const jobField = (jobEdu.value || '').toLowerCase();
        return candidateField.includes(jobField) || jobField.includes(candidateField);
      });
    });

    return hasRelevantEducation ? 100 : 0;
  }

  // 2. If Job has NO specific requirements (Implied "General" or "High School" usually)
  // AI Logic: "No academic requirement... but no additional degree -> HIGH (70)"
  // Heuristic: If Candidate has Academic Degree -> 100. If only High School/Cert -> 70.
  if (candidateEducation.length === 0) return 50; // Neutral/Medium if unknown

  const hasDegree = candidateEducation.some(e => {
      const text = (e.degree || e.field || e.institution || '').toLowerCase();
      return text.includes('תואר') || text.includes('degree') ||
             text.includes('bachelor') || text.includes('master') ||
             text.includes('phd') || text.includes('engineer') || 
             text.includes('הנדסאי') || text.includes('מהנדס') || text.includes('university') || text.includes('אוניברסיטה') || text.includes('מכללה');
  });

  return hasDegree ? 100 : 70; 
}

/**
 * Score Skills (מיומנויות)
 * 100: Full match, 60: Partial match, 0: No match
 */
function scoreSkills(candidate_profile, job_posting) {
  const candidateSkills = (candidate_profile.skills || []).map(s => s.toLowerCase());
  const jobRequirements = parseJsonField(job_posting.structured_requirements);
  const jobDescription = (job_posting.description || '').toLowerCase();

  // Extract skills from job requirements and description
  const jobSkills = extractSkillsFromJob(jobRequirements, jobDescription);

  if (jobSkills.length === 0) {
    return 100; // No skills required, consider it a match
  }

  // Count matches
  const matchedSkills = jobSkills.filter(jobSkill =>
    candidateSkills.some(candidateSkill =>
      candidateSkill.includes(jobSkill) || jobSkill.includes(candidateSkill)
    )
  );

  const matchRatio = matchedSkills.length / jobSkills.length;

  if (matchRatio === 1.0) {
    return 100; // Full match
  } else if (matchRatio >= 0.5) {
    return 60; // Partial match
  } else if (matchRatio > 0) {
    return 30; // New: Give some points for any match instead of 0
  }

  return 0; // No match
}

/**
 * Score Character Traits (תכונות אופי)
 * 100: 3/3 match, 80: 2/3 match, 50: 1/3 match, 0: 0 matches
 */
function scoreCharacterTraits(candidate_profile, job_posting) {
  const candidateTraits = (candidate_profile.character_traits || []).map(t => t.toLowerCase());
  const jobDescription = (job_posting.description || '').toLowerCase();
  const jobRequirements = parseJsonField(job_posting.structured_requirements);

  if (candidateTraits.length === 0) {
    return 0;
  }

  // Extract trait-related keywords from job
  const traitKeywords = extractTraitKeywords(jobDescription, jobRequirements);

  if (traitKeywords.length === 0) {
     return 100; // No specific traits required -> Full match
  }

  // Count matches
  let matches = 0;
  candidateTraits.forEach(trait => {
    if (traitKeywords.some(keyword => keyword.includes(trait) || trait.includes(keyword))) {
      matches++;
    }
  });

  if (matches === 3) {
    return 100;
  } else if (matches === 2) {
    return 80;
  } else if (matches === 1) {
    return 50;
  }

  return 0;
}

/**
 * Score Job Description (תיאור תפקיד)
 * 90: High textual overlap, 60: Medium overlap, 20: Low overlap
 */
function scoreJobDescription(candidate_profile, job_posting) {
  const jobDescription = (job_posting.description || '').toLowerCase();
  const jobTitle = (job_posting.title || '').toLowerCase(); // Include job title in text
  const candidateBio = (candidate_profile.bio || '').toLowerCase();
  const candidateExperience = (candidate_profile.experience || [])
    .map(exp => (exp.description || exp.title || '').toLowerCase())
    .join(' ');
  const candidateSkills = (candidate_profile.skills || []).join(' ').toLowerCase();
  const candidateTitle = (candidate_profile.job_title || candidate_profile.profession || '').toLowerCase(); // Include candidate title

  const candidateText = `${candidateBio} ${candidateExperience} ${candidateSkills} ${candidateTitle}`;
  const jobText = `${jobDescription} ${jobTitle}`;

  // Simple keyword overlap calculation
  const jobWords = extractKeywords(jobText);
  const candidateWords = extractKeywords(candidateText);

  const commonWords = jobWords.filter(word => candidateWords.includes(word));
  const overlapRatio = jobWords.length > 0 ? commonWords.length / jobWords.length : 0;

  // If specializaton/title is a full match, the description is likely relevant even if keywords differ slightly.
  const specializationScore = scoreSpecialization(candidate_profile, job_posting);
  if (specializationScore >= 90) {
      return 100; // Force high score if title matches
  }

  if (overlapRatio >= 0.20) { 
    return 100; // Updated to 100 for High Overlap to match AI "FULL"
  } else if (overlapRatio >= 0.10) {
    return 60; // Medium overlap
  } else if (overlapRatio > 0) {
    return 40; // Soft matching
  }

  return 0;
}

// ==================== BOTTOM PART SCORING FUNCTIONS ====================

// ==================== BOTTOM PART SCORING FUNCTIONS ====================

/**
 * Score Profession (מקצוע)
 * 100: Identical profession, 70: Similar profession, 0: Different field
 */
function scoreProfession(candidate_profile, job_posting) {
  // Normalize candidate profession/title from various possible fields
  const candidateTitles = [];
  if (candidate_profile.profession) candidateTitles.push(candidate_profile.profession);
  if (candidate_profile.specialization) candidateTitles.push(candidate_profile.specialization);
  if (candidate_profile.job_title) candidateTitles.push(candidate_profile.job_title);
  if (candidate_profile.title) candidateTitles.push(candidate_profile.title);
  if (Array.isArray(candidate_profile.job_titles)) candidateTitles.push(...candidate_profile.job_titles);
  
  const jobTitle = (job_posting.title || '').toLowerCase();
  const jobCategory = (job_posting.category || '').toLowerCase();

  // Check best match across all candidate titles
  let bestScore = 0;
  
  for (const title of candidateTitles) {
      if (!title) continue;
      const candidateVal = title.toLowerCase();
      
      // Use helper to check this specific title against job
      // We mock a profile with just this title to reuse getBestTitleMatch
      const mockProfile = { ...candidate_profile,  specialization: candidateVal };
      const score = getBestTitleMatch(mockProfile, [jobTitle, jobCategory]);
      if (score > bestScore) bestScore = score;
      
      // Check similar professions manually if getBestTitleMatch didn't max out
      if (score < 100) {
          // If the candidate's title is contained in the job title or vice versa, treat as full match for this specific field
          if (jobTitle.includes(candidateVal) || candidateVal.includes(jobTitle)) {
             bestScore = 100;
          } else {
             const similarProfessions = getSimilarProfessions(candidateVal);
             const isSimilar = similarProfessions.some(similar =>
               jobTitle.includes(similar) || jobCategory.includes(similar)
             );
             if (isSimilar && 70 > bestScore) bestScore = 70;
          }
      }
  }

  return bestScore;
}

/**
 * Score Location (מיקום)
 * 100: Full match, 75: Nearby area, 0: Significant distance
 */
function scoreLocation(candidate_profile, job_posting) {
  // Handle both singular (string) and plural (array) location fields
  let candidateLocations = [];
  if (Array.isArray(candidate_profile.preferred_locations)) {
      candidateLocations = candidate_profile.preferred_locations;
  } else if (candidate_profile.preferred_location) {
      candidateLocations = [candidate_profile.preferred_location];
  } else if (typeof candidate_profile.preferred_locations === 'string') {
      // Handle stringified array or comma-separated string
      candidateLocations = [candidate_profile.preferred_locations]; 
  }

  const jobLocation = (job_posting.location || '').toLowerCase();

  if (candidateLocations.length === 0 || !jobLocation) {
    return 0;
  }

  // Check each candidate location preference
  for (const loc of candidateLocations) {
      const candidateLocation = (loc || '').toLowerCase();
      
      // Full match
      if (candidateLocation === jobLocation ||
        candidateLocation.includes(jobLocation) ||
        jobLocation.includes(candidateLocation)) {
        return 100;
      }

      // Check for nearby areas
      const nearbyAreas = getNearbyAreas(candidateLocation);
      const isNearby = nearbyAreas.some(area =>
        jobLocation.includes(area) || area.includes(jobLocation)
      );
      
      if (isNearby) return 100;
  }

  return 0;
}

/**
 * Score Availability (זמינות)
 * 100: Immediate and full match, 70: Available within 1 month, 0: Availability does not match
 */
function scoreAvailability(candidate_profile, job_posting) {
  const candidateAvailability = candidate_profile.availability?.toLowerCase() || '';
  const jobStartDate = job_posting.start_date;

  if (!candidateAvailability) {
    return 0;
  }

  // Parse availability
  const isImmediate = candidateAvailability.includes('מיידית') ||
    candidateAvailability.includes('immediate') ||
    candidateAvailability.includes('מיד') ||
    candidateAvailability.includes('negotiable') ||
    candidateAvailability.includes('flexible');

  // Check if job specifices start date text that implies delay
  const jobStartText = (job_posting.start_date || '').toLowerCase();
  const jobRequiresWait = jobStartText.includes('month') || jobStartText.includes('חודש');

  if (isImmediate) {
    if (jobRequiresWait) {
        // Candidate is immediate, Job says "Month+" -> High Match (70), not Full
        return 70;
    }
    if (!job_posting.start_date || isDateWithinMonth(job_posting.start_date)) {
      return 100; // Immediate and full match
    } else {
      return 70; // Available within 1 month
    }
  }

  // Check if candidate can start within 1 month
  const canStartWithinMonth = candidateAvailability.includes('חודש') ||
    candidateAvailability.includes('month');

  if (canStartWithinMonth) {
    if (!jobStartDate || isDateWithinMonth(jobStartDate)) {
      return 70; // Available within 1 month
    }
  }

  return 0;
}

/**
 * Score Job Type (סוג המשרה)
 * 100: Full match, 60: Partial match, 0: Irrelevant
 */
function scoreJobType(candidate_profile, job_posting) {
  // Handle both fields: preferred_job_types and job_types
  let candidateJobTypes = [];
  if (Array.isArray(candidate_profile.preferred_job_types)) {
      candidateJobTypes = candidate_profile.preferred_job_types;
  } else if (Array.isArray(candidate_profile.job_types)) {
      candidateJobTypes = candidate_profile.job_types;
  }

  candidateJobTypes = candidateJobTypes.map(t => t.toLowerCase());
  const jobType = (job_posting.employment_type || '').toLowerCase();

  if (candidateJobTypes.length === 0) {
    return 100; // No preference, consider it a match
  }

  // Exact match
  if (candidateJobTypes.some(t => jobType.includes(t) || t.includes(jobType))) {
      return 100;
  }

  // Partial match: "Shifts" vs "Full Time"
  const isJobShifts = jobType.includes('shifts') || jobType.includes('משמרות');
  // Check if candidate explicitly DOES NOT have shifts but has Full Time
  if (isJobShifts) {
      if (candidateJobTypes.includes('full_time') || candidateJobTypes.includes('משרה מלאה')) {
          // If they didn't match 'shifts' above (in exact match), but have full_time, return 40
          return 40; 
      }
  }

  // Partial match - check if candidate is open to both full-time and part-time
  const isOpenToBoth = candidateJobTypes.includes('full_time') && candidateJobTypes.includes('part_time');
  if (isOpenToBoth && (jobType === 'full_time' || jobType === 'part_time')) {
    return 60;
  }

  return 0;
}

// ==================== HELPER FUNCTIONS ====================

function checkEducationMatch(candidateEducation, requiredEducation) {
  return requiredEducation.every(requiredEdu => {
    const requiredValue = (requiredEdu.value || '').toLowerCase();
    return candidateEducation.some(candidateEdu => {
      const candidateValue = (candidateEdu.field || candidateEdu.degree || candidateEdu.value || '').toLowerCase();
      return candidateValue.includes(requiredValue) || requiredValue.includes(candidateValue);
    });
  });
}

function extractExperienceRequirements(requirements) {
  for (const req of requirements) {
    const value = (req.value || '').toLowerCase();
    // Look for patterns like "minimum 3 years", "3+ years", etc.
    const match = value.match(/(\d+)\s*(?:year|years|שנה|שנים)/);
    if (match) {
      return { years: parseInt(match[1]) };
    }
  }
  return null;
}

function calculateCandidateExperience(experience) {
  if (!Array.isArray(experience) || experience.length === 0) {
    return 0;
  }

  let totalYears = 0;
  experience.forEach(exp => {
    const years = exp.years || 0;
    const months = (exp.months || 0) / 12;
    totalYears += years + months;
  });

  return Math.floor(totalYears);
}

function checkCertificationsMatch(candidateCertifications, requiredCertifications, candidateProfile = {}) {
  const candidateCerts = (candidateCertifications || []).map(c => (c.name || c || '').toLowerCase());
  
  // Also check bio and experience description for certification keywords
  const bio = (candidateProfile.bio || '').toLowerCase();
  const experienceText = (candidateProfile.experience || []).map(e => (e.description || '').toLowerCase()).join(' ');
  const fullTextContext = `${bio} ${experienceText}`;

  return requiredCertifications.every(requiredCert => {
    const requiredValue = (requiredCert.value || '').toLowerCase();
    
    // Check in explicit certifications list
    const foundInList = candidateCerts.some(candidateCert =>
      candidateCert.includes(requiredValue) || requiredValue.includes(candidateCert)
    );
    if (foundInList) return true;

    // Check in text context
    const foundInText = fullTextContext.includes(requiredValue);

    console.log(`Checking Cert: "${requiredValue}"`);
    console.log(`- Found in List: ${foundInList}`);
    console.log(`- Found in Text: ${foundInText}`);
    console.log(`- Text Context (first 100 chars): ${fullTextContext.substring(0, 100)}...`);

    return foundInText;
  });
}

function extractLanguageRequirements(requirements) {
  const languages = [];
  const languageKeywords = ['עברית', 'אנגלית', 'ערבית', 'hebrew', 'english', 'arabic', 'רוסית', 'russian'];

  requirements.forEach(req => {
    const value = (req.value || '').toLowerCase();
    languageKeywords.forEach(keyword => {
      if (value.includes(keyword)) {
        languages.push(keyword);
      }
    });
  });

  return languages;
}

function checkLanguagesMatch(candidateLanguages, requiredLanguages) {
  const candidateLangs = (candidateLanguages || []).map(l => (l.name || l || '').toLowerCase());

  return requiredLanguages.every(requiredLang => {
    return candidateLangs.some(candidateLang =>
      candidateLang.includes(requiredLang) || requiredLang.includes(candidateLang)
    );
  });
}

function getRelatedSpecializationTerms(specialization) {
  // Simple mapping - could be enhanced with AI or a knowledge base
  const termMap = {
    'תכנות': ['פיתוח', 'מתכנת', 'developer', 'programming'],
    'שיווק': ['מכירות', 'sales', 'marketing'],
    'כספים': ['פיננסים', 'חשבונאות', 'finance', 'accounting'],
    // Add more mappings as needed
  };

  return termMap[specialization] || [];
}



function extractExperienceTerms(requirements, description, jobTitle = '') {
  const terms = [];
  const commonRoles = ['מנהל', 'מפתח', 'מכירות', 'manager', 'developer', 'sales'];

  // Add Job Title tokens as high-value terms
  const titleTokens = jobTitle.split(/[\s\-\/]+/).filter(w => w.length > 2);
  titleTokens.forEach(token => {
      terms.push({ term: token, isExact: true });
  });

  [...requirements, { value: description }].forEach(item => {
    const value = (item.value || '').toLowerCase();
    commonRoles.forEach(role => {
      if (value.includes(role)) {
        terms.push({ term: role, isExact: true });
      }
    });
  });

  return terms;
}

function extractSkillsFromJob(requirements, description) {
  const skills = [];
  const commonSkills = ['excel', 'word', 'sap', 'מחשב', 'office', 'powerpoint'];

  [...requirements.map(r => r.value || ''), description].forEach(text => {
    const lowerText = text.toLowerCase();
    commonSkills.forEach(skill => {
      if (lowerText.includes(skill)) {
        skills.push(skill);
      }
    });
  });

  return [...new Set(skills)]; // Remove duplicates
}

function extractTraitKeywords(description, requirements) {
  const keywords = [];
  const traitTerms = ['מנהיגות', 'leadership', 'עבודת צוות', 'teamwork', 'יצירתיות', 'creativity'];

  [...requirements.map(r => r.value || ''), description].forEach(text => {
    const lowerText = text.toLowerCase();
    traitTerms.forEach(term => {
      if (lowerText.includes(term)) {
        keywords.push(term);
      }
    });
  });

  return keywords;
}

function extractKeywords(text) {
  // Simple keyword extraction - remove common words
  const stopWords = ['את', 'של', 'על', 'או', 'the', 'a', 'an', 'and', 'or', 'is', 'are'];
  const words = text.toLowerCase().split(/\s+/).filter(word =>
    word.length > 2 && !stopWords.includes(word)
  );
  return [...new Set(words)];
}

function getSimilarProfessions(profession) {
  const professionMap = {
    'מכירות': ['שיווק', 'sales', 'marketing'],
    'ביטוח': ['נדלן', 'real estate', 'insurance'],
    'מלקט': ['מחסן', 'לוגיסטיקה', 'סדרן', 'picker', 'warehouse', 'logistics'],
    'מחסן': ['מלקט', 'לוגיסטיקה', 'סדרן', 'warehouse', 'logistics', 'picker'],
    'נהג': ['הפצה', 'שליח', 'driver', 'delivery'],
  };

  return professionMap[profession] || [];
}

function getNearbyAreas(location) {
  const areaMap = {
    'תל אביב': ['רמת גן', 'גבעתיים', 'חולון', 'בת ים', 'בני ברק', 'ramat gan', 'givatayim', 'holon'],
    'ירושלים': ['בית שמש', 'מודיעין', 'מבשרת ציון', 'jerusalem'],
    'רמלה': ['לוד', 'צריפין', 'באר יעקב', 'נס ציונה', 'רחובות', 'ramla', 'lod', 'tzrifin'],
    'לוד': ['רמלה', 'צריפין', 'באר יעקב', 'שוהם', 'lod', 'ramla'],
    'צריפין': ['רמלה', 'לוד', 'באר יעקב', 'ראשון לציון', 'tzrifin', 'ramla', 'lod'],
    'ראשון לציון': ['צריפין', 'חולון', 'בת ים', 'נס ציונה', 'rishon lezion', 'rishon'],
    'פתח תקווה': ['בני ברק', 'ראש העין', 'גבעת שמואל', 'אלעד', 'petah tikva'],
  };

  return areaMap[location] || [];
}

function isDateWithinMonth(dateString) {
  if (!dateString) return true;

  if (dateString === 'flexible') return true;
  if (dateString === 'immediate') return true;
  if (dateString === '1_2_weeks') return true;
  if (dateString === '1_2_months') return false; // Starts in > 1 month

  const date = new Date(dateString);
  // If not a valid date, we default to TRUE to be safe (unless it's a known long-term enum),
  // but for "month_to_two_months" type strings we should be careful.
  // Given the known enums, we covered the long-term one.
  if (isNaN(date.getTime())) return true; 

  const now = new Date();
  const oneMonthFromNow = new Date(now.getFullYear(), now.getMonth() + 1, now.getDate());

  return date <= oneMonthFromNow;
}

function calculateFuzzyMatch(str1, str2) {
  if (!str1 || !str2) return 0;
  
  // Normalize and tokenize by spaces, dashes, slashes
  const normalizeTokens = (str) => {
    return str.toLowerCase()
      .replace(/[\/\-,]/g, ' ') // Replace chars with space
      .split(/\s+/)
      .filter(w => w.length > 1); // Ignore single chars
  };

  const tokens1 = normalizeTokens(str1);
  const tokens2 = normalizeTokens(str2);

  if (tokens1.length === 0 || tokens2.length === 0) return 0;

  // Calculate overlap
  let matches = 0;
  tokens1.forEach(t1 => {
    if (tokens2.some(t2 => t2.includes(t1) || t1.includes(t2))) {
      matches++;
    }
  });

  return (matches / tokens1.length) * 100;
}

function getBestTitleMatch(candidate_profile, targets) {
  const candidateFields = ['specialization', 'profession', 'job_title', 'title'];
  let maxScore = 0;

  for (const field of candidateFields) {
    const val = (candidate_profile[field] || '').toLowerCase();
    if (!val) continue;

    for (const target of targets) {
      if (!target) continue;
      const t = target.toLowerCase();
      
      // Strict Check
      if (val === t || t.includes(val) || val.includes(t)) {
        maxScore = 100; // Max possible for strict match
        break; 
      }
      
      // Fuzzy Check
      const score = calculateFuzzyMatch(val, t);
      if (score > maxScore) maxScore = score;
    }
    if (maxScore === 100) break;
  }
  return maxScore;
}

