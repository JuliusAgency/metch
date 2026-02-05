import fs from 'fs';
import path from 'path';

// Mocking the calculate_match_score logic here to avoid complex imports
function parseJsonField(field) {
  if (!field) return [];
  if (Array.isArray(field)) return field;
  if (typeof field === 'string') {
    try {
      if (field.startsWith('\\x')) return []; // Handle binary-like strings
      const parsed = JSON.parse(field);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      return [];
    }
  }
  return [];
}

function calculate_match_score_sync(candidate_profile, job_posting) {
  // Phase 2: Simplified Weighted Scoring
  const specialization = scoreSpecialization(candidate_profile, job_posting);
  const experience = scoreExperience(candidate_profile, job_posting);
  const education = scoreEducation(candidate_profile, job_posting);
  const availability = scoreAvailability(candidate_profile, job_posting);

  // Top Part (Simplified)
  const topPartScore = (specialization/90 * 0.34) + (experience/100 * 0.22) + (education/70 * 0.11);
  // Bottom Part (Simplified)
  const bottomPartScore = (availability/100 * 0.125 * 0.25);

  const finalScore = (0.75 * topPartScore) + (0.25 * bottomPartScore);
  return finalScore;
}

function scoreSpecialization(candidate, job) {
  const cTitle = (candidate.specialization || candidate.profession || candidate.job_title || '').toLowerCase();
  const jTitle = (job.title || '').toLowerCase();
  const jCat = (job.category || '').toLowerCase();
  if (cTitle && (jTitle.includes(cTitle) || jCat.includes(cTitle))) return 90;
  return 0;
}

function scoreExperience(candidate, job) {
  return (candidate.experience && candidate.experience.length > 0) ? 100 : 0;
}

function scoreEducation(candidate, job) {
  return (candidate.education && candidate.education.length > 0) ? 70 : 0;
}

function scoreAvailability(candidate, job) {
  const cAvail = (candidate.availability || '').toLowerCase();
  if (cAvail === 'immediate' || cAvail === 'negotiable' || cAvail === 'flexible') return 100;
  return 0;
}

async function main() {
    const envPath = path.resolve(process.cwd(), '.env');
    const envContent = fs.readFileSync(envPath, 'utf8');
    const env = {};
    envContent.split('\n').forEach(line => {
        const [key, ...value] = line.split('=');
        if (key && value) {
            env[key.trim()] = value.join('=').trim().replace(/^["']|["']$/g, '');
        }
    });

    const url = env.VITE_SUPABASE_URL;
    const key = env.VITE_SUPABASE_ANON_KEY;

    async function fetchData(tableName, query = '') {
        const targetUrl = `${url}/rest/v1/${tableName}${query}`;
        const response = await fetch(targetUrl, {
            headers: { 'apikey': key, 'Authorization': `Bearer ${key}` }
        });
        return await response.json();
    }

    const candidateId = '0c55fcc4-e77b-4f92-8973-57c353e56b7e'; // רפאל לוי
    const jobId = '168475c0-f2b7-47e2-8d63-9615f986fb3f'; // מהנדס/ת אלקטרואופטיקה

    const candidates = await fetchData('UserProfile', `?id=eq.${candidateId}`);
    const jobs = await fetchData('Job', `?id=eq.${jobId}`);

    if (candidates.length === 0 || jobs.length === 0) return;

    const candidate = candidates[0];
    const job = jobs[0];

    console.log('--- SIMULATION ---');
    console.log('Candidate:', candidate.full_name, 'Profile completeness check...');
    console.log('Title/Spec:', candidate.specialization || candidate.profession || 'EMPTY');
    
    const score = calculate_match_score_sync(candidate, job);
    console.log('Estimated Score:', (score * 100).toFixed(1) + '%');
    
    if (score < 0.6) {
        console.log('\nRESULT: Score is below 60%. The job will not appear on the dashboard.');
        console.log('FIX: Candidate needs to fill out their profile (Specialization, Experience, etc.)');
    } else {
        console.log('\nRESULT: Score is above 60%. It should appear.');
    }
}

main().catch(console.error);
