
// Mocks
async function is_career_change(candidate_profile, job_posting) {
  return false;
}

// ==================== COPIED FROM matchScore.js ====================

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
      // console.warn('Failed to parse JSON field:', e);
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
async function calculate_match_score(candidate_profile, job_posting, user_settings = {}) {
  // Phase 1: Disqualification Checks
  const disqualificationResult = await checkDisqualification(candidate_profile, job_posting, user_settings);
  if (disqualificationResult.disqualified) {
    return null; // or 0.0, depending on requirements
  }

  // Phase 2: Weighted Scoring
  const topPartScore = calculateTopPartScore(candidate_profile, job_posting);
  const bottomPartScore = calculateBottomPartScore(candidate_profile, job_posting);

  // Final Score Formula: Final_Match_Score = (0.80 * Score_Top_Part) + (0.20 * Score_Bottom_Part)
  let finalScore = (0.80 * topPartScore) + (0.20 * bottomPartScore);

  // Phase 1 Adjustments: Apply Soft Penalties from "Hard Filters"
  if (disqualificationResult.penalty > 0) {
    console.log(`Applying filter penalty: -${disqualificationResult.penalty}`);
    finalScore -= disqualificationResult.penalty;
  }

  // Ensure score is between 0.0 and 1.0
  return Math.max(0.0, Math.min(1.0, finalScore));
}

/**
 * Calculate match score breakdown for AI analysis
 * Returns detailed scores for each component
 */
async function calculate_match_breakdown(candidate_profile, job_posting, user_settings = {}) {
  // Phase 1: Disqualification Checks
  
  // NOTE: Pass user_settings correctly
  const disqualificationResult = await checkDisqualification(candidate_profile, job_posting, user_settings);
  
  // Phase 2: Weighted Scoring
  const topPartScore = calculateTopPartScore(candidate_profile, job_posting);
  const bottomPartScore = calculateBottomPartScore(candidate_profile, job_posting);
  console.log('Top Part:', topPartScore);
  console.log('Bottom Part:', bottomPartScore);

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

  // Final Score Formula
  let finalScore = (0.80 * topPartScore) + (0.20 * bottomPartScore);

  if (disqualificationResult.penalty > 0) {
    finalScore -= disqualificationResult.penalty;
  }

  // Phase 3: "Dealbreaker" Penalties (Location & Job Type)
  if (rawScores.location === 0) {
      console.log('Applying Location Dealbreaker Penalty: -0.15');
      finalScore -= 0.15;
  }
  if (rawScores.jobType === 0) {
      console.log('Applying Job Type Dealbreaker Penalty: -0.10');
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
  const requiredCertifications = structuredCertifications.filter(
    cert => cert.type === 'required' && cert.value
  );
  if (requiredCertifications.length > 0) {
    const candidateCertifications = candidate_profile.certifications || [];
    const hasRequiredCert = checkCertificationsMatch(candidateCertifications, requiredCertifications);
    if (!hasRequiredCert) {
      console.log('Soft Penalty: Missing Required Certification (-10%)');
      penalty += 0.10;
    }
  }

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

  // Specialization (תחום ההתמחות) - Weight: 0.340909, Max: 90
  scores.specialization = scoreSpecialization(candidate_profile, job_posting) / 90 * 0.340909;

  // Experience (ניסיון) - Weight: 0.227273, Max: 100
  scores.experience = scoreExperience(candidate_profile, job_posting) / 100 * 0.227273;

  // Education (השכלה) - Weight: 0.113636, Max: 70
  scores.education = scoreEducation(candidate_profile, job_posting) / 70 * 0.113636;

  // Skills (מיומנויות) - Weight: 0.090909, Max: 100
  scores.skills = scoreSkills(candidate_profile, job_posting) / 100 * 0.090909;

  // Character Traits (תכונות אופי) - Weight: 0.056818, Max: 100
  scores.characterTraits = scoreCharacterTraits(candidate_profile, job_posting) / 100 * 0.056818;

  // Job Description (תיאור תפקיד) - Weight: 0.170455, Max: 90
  scores.jobDescription = scoreJobDescription(candidate_profile, job_posting) / 90 * 0.170455;

  // Sum all weighted scores
  const totalScore = Object.values(scores).reduce((sum, score) => sum + score, 0);
  return Math.min(1.0, totalScore / 0.95);
}

/**
 * Phase 2: Calculate Bottom Part Score (25% weight)
 */
function calculateBottomPartScore(candidate_profile, job_posting) {
  const scores = {};

  // Profession (מקצוע) - Weight: 50.0%, Max: 100
  scores.profession = scoreProfession(candidate_profile, job_posting) / 100 * (50.0 / 100);

  // Location (מיקום) - Weight: 25.0%, Max: 100
  scores.location = scoreLocation(candidate_profile, job_posting) / 100 * (25.0 / 100);

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

//   console.log('--- scoreSpecialization Debug ---');
//   console.log('Full Candidate Profile Fields:', {
//     specialization: candidate_profile.specialization,
//     profession: candidate_profile.profession,
//     job_title: candidate_profile.job_title,
//     title: candidate_profile.title,
//     bio: candidate_profile.bio
//   });
//   console.log('Job Target:', { title: jobTitle, category: jobCategory });

  // Use Best Match strategy to check all candidate title fields against job title/category
  const bestTitleMatch = getBestTitleMatch(candidate_profile, [jobCategory, jobTitle]);
//   console.log('Best Title Match Score:', bestTitleMatch);
  
  if (bestTitleMatch >= 80) {
    // console.log('Returning 100 (Best Match)');
    return 100;
  }
  
  // Also check description for strict/fuzzy match if needed, but usually title/category is enough for high score.
  // If we want to check description too:
  const descriptionMatch = getBestTitleMatch(candidate_profile, [jobDescription]);
  if (descriptionMatch >= 80) {
    //  console.log('Returning 100 (Description Match)');
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
          return 65; // Assign partial score based on Title match implication
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

  if (jobEducation.length === 0) {
    return 100; // No specific education required -> Full match
  }

  if (candidateEducation.length === 0) {
    return 0; // Education required but candidate has none
  }

  // Check if candidate has any relevant education
  const hasRelevantEducation = candidateEducation.some(candidateEdu => {
    const candidateField = (candidateEdu.field || candidateEdu.degree || '').toLowerCase();
    return jobEducation.some(jobEdu => {
      const jobField = (jobEdu.value || '').toLowerCase();
      return candidateField.includes(jobField) || jobField.includes(candidateField);
    });
  });

  return hasRelevantEducation ? 70 : 0;
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

  if (overlapRatio >= 0.3) {
    return 90; // High overlap
  } else if (overlapRatio >= 0.15) {
    return 60; // Medium overlap
  } else if (overlapRatio > 0) {
    return 40; // Increased from 20 for softer matching
  }

  return 0;
}

// ==================== BOTTOM PART SCORING FUNCTIONS ====================

/**
 * Score Profession (מקצוע)
 * 100: Identical profession, 70: Similar profession, 0: Different field
 */
function scoreProfession(candidate_profile, job_posting) {
  const candidateProfession = (candidate_profile.profession || candidate_profile.specialization || candidate_profile.job_title || '').toLowerCase();
  const jobTitle = (job_posting.title || '').toLowerCase();
  const jobCategory = (job_posting.category || '').toLowerCase();

  // Use Best Match strategy
  const bestMatch = getBestTitleMatch(candidate_profile, [jobTitle, jobCategory]);
  
  if (bestMatch >= 80) return 100;
  if (bestMatch >= 50) return 70;

  // Check for similar professions
  const similarProfessions = getSimilarProfessions(candidateProfession);
  const isSimilar = similarProfessions.some(similar =>
    jobTitle.includes(similar) || jobCategory.includes(similar)
  );

  return isSimilar ? 70 : 0;
}

/**
 * Score Location (מיקום)
 * 100: Full match, 75: Nearby area, 0: Significant distance
 */
function scoreLocation(candidate_profile, job_posting) {
  const candidateLocation = (candidate_profile.preferred_location || '').toLowerCase();
  const jobLocation = (job_posting.location || '').toLowerCase();

  if (!candidateLocation || !jobLocation) {
    return 0;
  }

  // Full match
  if (candidateLocation === jobLocation ||
    candidateLocation.includes(jobLocation) ||
    jobLocation.includes(candidateLocation)) {
    return 100;
  }

  // Check for nearby areas (e.g., Tel Aviv -> Ramat Gan)
  const nearbyAreas = getNearbyAreas(candidateLocation);
  const isNearby = nearbyAreas.some(area =>
    jobLocation.includes(area) || area.includes(jobLocation)
  );

  return isNearby ? 100 : 0;
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

  if (isImmediate) {
    if (!jobStartDate || isDateWithinMonth(jobStartDate)) {
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
    // If jobStartDate is beyond a month, but candidate is available within a month, it's still a partial match
    // This logic might need refinement based on exact business rules. For now, if jobStartDate is too far, it's 0.
  }

  return 0;
}

/**
 * Score Job Type (סוג המשרה)
 * 100: Full match, 60: Partial match, 0: Irrelevant
 */
function scoreJobType(candidate_profile, job_posting) {
  const candidateJobTypes = (candidate_profile.preferred_job_types || []).map(t => t.toLowerCase());
  const jobType = (job_posting.employment_type || '').toLowerCase();

  if (candidateJobTypes.length === 0) {
    return 100; // No preference, consider it a match
  }

  // Full match
  if (candidateJobTypes.includes(jobType)) {
    return 100;
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

function checkCertificationsMatch(candidateCertifications, requiredCertifications) {
  const candidateCerts = (candidateCertifications || []).map(c => (c.name || c || '').toLowerCase());

  return requiredCertifications.every(requiredCert => {
    const requiredValue = (requiredCert.value || '').toLowerCase();
    return candidateCerts.some(candidateCert =>
      candidateCert.includes(requiredValue) || requiredValue.includes(candidateCert)
    );
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

  const date = new Date(dateString);
  if (isNaN(date.getTime())) return true; // Invalid date (like 'flexible') -> Treat as within month

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

// ==================== TEST EXECUTION ====================

// Mock Data based on the screenshots/context
const mockCandidate = {
  id: 'user-123',
  preferred_location: 'Center', // Corresponds to candidate_profile.preferred_location (singular string in DB)
  preferred_job_types: ['full_time'],
  availability: 'immediate',
  specialization: 'Information Security',
  profession: 'Information Security Specialist',
  job_title: 'Information Security Specialist',
  
  // CV fields
  experience: [
    { title: 'Information Security Specialist', description: 'CISSP certified, 5 years exp', type: 'full_time', years: 5 }
  ],
  skills: ['Cyber Security', 'Network Security', 'CISSP'],
  education: [{ degree: 'B.Sc Computer Science' }],
  certifications: [{ name: 'CISSP' }],
  character_traits: ['leadership', 'teamwork', 'creativity']
};

const mockJob = {
  id: 'job-123',
  title: 'מומחה/ית אבטחת מידע', // Information Security Specialist
  category: 'Information Security',
  description: 'דרוש מומחה אבטחת מידע עם ניסיון. ידע ב-CISSP, leadership, teamwork.', // Keywords present
  location: 'אבנת', // Not in Center map
  employment_type: 'full_time',
  start_date: 'immediate',
  structured_requirements: JSON.stringify([{ value: 'CISSP' }, { value: 'Cyber Security' }]),
  structured_education: JSON.stringify([]),
  structured_certifications: JSON.stringify([])
};

console.log('--- Starting Match Score Debug (V3) ---');
  
calculate_match_breakdown(mockCandidate, mockJob).then(result => {
  console.log('Total Score:', result.total_score);
  console.log('Breakdown:', JSON.stringify(result.breakdown, null, 2));
  console.log('Top Part:', result.top_part_score);
  console.log('Bottom Part:', result.bottom_part_score);
  
}).catch(err => console.error(err));
