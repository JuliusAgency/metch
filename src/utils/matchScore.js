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
  // Phase 1: Disqualification Checks
  const disqualificationResult = await checkDisqualification(candidate_profile, job_posting, user_settings);
  if (disqualificationResult.disqualified) {
    return null; // or 0.0, depending on requirements
  }

  // Phase 2: Weighted Scoring
  const topPartScore = calculateTopPartScore(candidate_profile, job_posting);
  const bottomPartScore = calculateBottomPartScore(candidate_profile, job_posting);

  // Final Score Formula: Final_Match_Score = (0.75 * Score_Top_Part) + (0.25 * Score_Bottom_Part)
  const finalScore = (0.75 * topPartScore) + (0.25 * bottomPartScore);

  // Ensure score is between 0.0 and 1.0
  return Math.max(0.0, Math.min(1.0, finalScore));
}

/**
 * Phase 1: Check for disqualification conditions
 */
async function checkDisqualification(candidate_profile, job_posting, user_settings) {
  // 1.1 Hard Filters

  // Parse JSON fields from database
  const structuredEducation = parseJsonField(job_posting.structured_education);
  const structuredRequirements = parseJsonField(job_posting.structured_requirements);
  const structuredCertifications = parseJsonField(job_posting.structured_certifications);

  // Required Education Check
  const requiredEducation = structuredEducation.filter(
    edu => edu.type === 'required' && edu.value
  );
  if (requiredEducation.length > 0) {
    const candidateEducation = candidate_profile.education || [];
    const hasRequiredEducation = checkEducationMatch(candidateEducation, requiredEducation);
    if (!hasRequiredEducation) {
      return { disqualified: true, reason: 'השכלת חובה לא מספיק' };
    }
  }

  // Required Experience Check
  const requiredExperience = extractExperienceRequirements(structuredRequirements);
  if (requiredExperience) {
    const candidateExperience = calculateCandidateExperience(candidate_profile.experience || []);
    if (candidateExperience < requiredExperience.years) {
      return { disqualified: true, reason: 'ניסון חובה לא מספיק' };
    }
  }

  // Required Certification/License Check
  const requiredCertifications = structuredCertifications.filter(
    cert => cert.type === 'required' && cert.value
  );
  if (requiredCertifications.length > 0) {
    const candidateCertifications = candidate_profile.certifications || [];
    const hasRequiredCert = checkCertificationsMatch(candidateCertifications, requiredCertifications);
    if (!hasRequiredCert) {
      return { disqualified: true, reason: 'הסמכה/רישיון חובה לא קיימת' };
    }
  }

  // Required Language Check
  const requiredLanguages = extractLanguageRequirements(structuredRequirements);
  if (requiredLanguages.length > 0) {
    const candidateLanguages = candidate_profile.languages || [];
    const hasRequiredLanguage = checkLanguagesMatch(candidateLanguages, requiredLanguages);
    if (!hasRequiredLanguage) {
      return { disqualified: true, reason: 'שפה' };
    }
  }

  // 1.2 Soft Filter: Career Change Preference
  if (user_settings.prefers_no_career_change === true) {
    const isCareerChange = await is_career_change(candidate_profile, job_posting);
    if (isCareerChange) {
      return { disqualified: true, reason: 'Career change detected' };
    }
  }

  return { disqualified: false };
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
  return totalScore;
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
 * 90: Full match, 60: Close skills, 0: Irrelevant
 */
function scoreSpecialization(candidate_profile, job_posting) {
  const candidateSpecialization = candidate_profile.specialization?.toLowerCase() || '';
  const jobCategory = job_posting.category?.toLowerCase() || '';
  const jobTitle = job_posting.title?.toLowerCase() || '';
  const jobDescription = (job_posting.description || '').toLowerCase();

  // Full match
  if (candidateSpecialization && 
      (candidateSpecialization === jobCategory || 
       jobTitle.includes(candidateSpecialization) ||
       jobDescription.includes(candidateSpecialization))) {
    return 90;
  }

  // Close skills - check for related terms
  const relatedTerms = getRelatedSpecializationTerms(candidateSpecialization);
  const hasRelatedTerm = relatedTerms.some(term => 
    jobCategory.includes(term) || 
    jobTitle.includes(term) || 
    jobDescription.includes(term)
  );

  if (hasRelatedTerm) {
    return 60;
  }

  return 0;
}

/**
 * Score Experience (ניסיון)
 * 100: Full match, 70: Similar, 0: No relevant experience
 */
function scoreExperience(candidate_profile, job_posting) {
  const candidateExperience = candidate_profile.experience || [];
  const jobRequirements = parseJsonField(job_posting.structured_requirements);
  const jobDescription = (job_posting.description || '').toLowerCase();

  if (candidateExperience.length === 0) {
    return 0;
  }

  // Extract key experience terms from job
  const jobExperienceTerms = extractExperienceTerms(jobRequirements, jobDescription);
  
  // Check candidate experience
  let fullMatches = 0;
  let similarMatches = 0;

  candidateExperience.forEach(exp => {
    const expText = (exp.title || exp.role || exp.description || '').toLowerCase();
    const expType = (exp.type || '').toLowerCase();

    jobExperienceTerms.forEach(jobTerm => {
      if (expText.includes(jobTerm.term) || expType === jobTerm.type) {
        if (jobTerm.isExact) {
          fullMatches++;
        } else {
          similarMatches++;
        }
      }
    });
  });

  if (fullMatches > 0) {
    return 100;
  } else if (similarMatches > 0) {
    return 70;
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

  if (candidateEducation.length === 0) {
    return 0;
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
  const candidateBio = (candidate_profile.bio || '').toLowerCase();
  const candidateExperience = (candidate_profile.experience || [])
    .map(exp => (exp.description || exp.title || '').toLowerCase())
    .join(' ');
  const candidateSkills = (candidate_profile.skills || []).join(' ').toLowerCase();

  const candidateText = `${candidateBio} ${candidateExperience} ${candidateSkills}`;

  // Simple keyword overlap calculation
  const jobWords = extractKeywords(jobDescription);
  const candidateWords = extractKeywords(candidateText);

  const commonWords = jobWords.filter(word => candidateWords.includes(word));
  const overlapRatio = jobWords.length > 0 ? commonWords.length / jobWords.length : 0;

  if (overlapRatio >= 0.3) {
    return 90; // High overlap
  } else if (overlapRatio >= 0.15) {
    return 60; // Medium overlap
  } else if (overlapRatio > 0) {
    return 20; // Low overlap
  }

  return 0;
}

// ==================== BOTTOM PART SCORING FUNCTIONS ====================

/**
 * Score Profession (מקצוע)
 * 100: Identical profession, 70: Similar profession, 0: Different field
 */
function scoreProfession(candidate_profile, job_posting) {
  const candidateProfession = (candidate_profile.profession || candidate_profile.specialization || '').toLowerCase();
  const jobTitle = (job_posting.title || '').toLowerCase();
  const jobCategory = (job_posting.category || '').toLowerCase();

  if (!candidateProfession) {
    return 0;
  }

  // Check for identical match
  if (jobTitle.includes(candidateProfession) || jobCategory === candidateProfession) {
    return 100;
  }

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

  return isNearby ? 75 : 0;
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
  const isImmediate = candidateAvailability.includes('מיידי') || 
                      candidateAvailability.includes('immediate') ||
                      candidateAvailability.includes('מיד');

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

function extractExperienceTerms(requirements, description) {
  const terms = [];
  const commonRoles = ['מנהל', 'מפתח', 'מכירות', 'manager', 'developer', 'sales'];
  
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
    // Add more mappings
  };

  return professionMap[profession] || [];
}

function getNearbyAreas(location) {
  const areaMap = {
    'תל אביב': ['רמת גן', 'גבעתיים', 'חולון', 'ramat gan', 'givatayim'],
    'ירושלים': ['בית שמש', 'מודיעין', 'jerusalem'],
    // Add more mappings
  };

  return areaMap[location] || [];
}

function isDateWithinMonth(dateString) {
  if (!dateString) return true;
  
  const date = new Date(dateString);
  const now = new Date();
  const oneMonthFromNow = new Date(now.getFullYear(), now.getMonth() + 1, now.getDate());
  
  return date <= oneMonthFromNow;
}

