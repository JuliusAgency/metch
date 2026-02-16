
import { calculate_match_breakdown } from './src/utils/matchScore.js';

// Mock Data based on the screenshots/context
// Candidate Profile (Simulating what is passed from JobDetailsSeeker)
const mockCandidate = {
  id: 'user-123',
  // Profile fields (from UserProfile)
  // Note: matchScore.js uses 'preferred_job_types' not 'job_types' for Bottom Part scoring
  // And uses 'preferred_location' (singular) for location scoring? Let's check source.
  // Code says: const candidateLocation = (candidate_profile.preferred_location || '').toLowerCase();
  
  preferred_location: 'Center', // Single string expected? Or array joined?
  preferred_job_types: ['full_time'], // Array expected?
  availability: 'immediate',
  
  // Also pass arrays just in case logic uses them differently
  job_titles: ['Information Security Specialist'], 
  preferred_locations: ['Center', 'Tel Aviv'], 
  
  // CV Data fields
  specialization: 'Information Security',
  experience: [
    { title: 'Information Security Specialist', description: 'CISSP certified, 5 years exp' }
  ],
  skills: ['Cyber Security', 'Network Security', 'CISSP'],
  education: [{ degree: 'B.Sc Computer Science' }],
  certifications: [{ name: 'CISSP' }]
};

// Job Data
const mockJob = {
  id: 'job-123',
  title: 'מומחה/ית אבטחת מידע', // Information Security Specialist
  category: 'Information Security',
  description: 'דרוש מומחה אבטחת מידע עם ניסיון...',
  location: 'אבנת', 
  employment_type: 'full_time',
  start_date: 'immediate',
  structured_requirements: JSON.stringify([{ value: 'CISSP' }, { value: 'Cyber Security' }]),
  structured_education: JSON.stringify([]),
  structured_certifications: JSON.stringify([])
};

console.log('--- Starting Match Score Debug (MJS) ---');
  
calculate_match_breakdown(mockCandidate, mockJob).then(result => {
  console.log('Total Score:', result.total_score);
  console.log('Breakdown:', JSON.stringify(result.breakdown, null, 2));
  console.log('Top Part:', result.top_part_score);
  console.log('Bottom Part:', result.bottom_part_score);
  
  console.log('\n--- Preference Analysis ---');
  console.log('Candidate Location (Input):', mockCandidate.preferred_location);
  console.log('Job Location:', mockJob.location);
  console.log('Location Score:', result.breakdown.location);
  
  console.log('Candidate Job Types (Input):', mockCandidate.preferred_job_types);
  console.log('Job Type:', mockJob.employment_type);
  console.log('Job Type Score:', result.breakdown.jobType);

  console.log('Candidate Availability (Input):', mockCandidate.availability);
  console.log('Job Start Date:', mockJob.start_date);
  console.log('Availability Score:', result.breakdown.availability);
}).catch(err => console.error(err));
