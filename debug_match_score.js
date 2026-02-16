
import { calculate_match_breakdown } from './src/utils/matchScore.js';

// Mock Data based on the screenshots/context
// Candidate Profile (Simulating what is passed from JobDetailsSeeker)
const mockCandidate = {
  id: 'user-123',
  // Profile fields (from UserProfile)
  job_titles: ['Information Security Specialist', 'Cyber Security'], // Role preference
  preferred_locations: ['Center', 'Tel Aviv'], 
  job_types: ['full_time'],
  availability: 'immediate',
  
  // CV Data fields (merged in JobDetailsSeeker)
  specialization: 'Information Security',
  experience: [
    { title: 'Information Security Specialist', description: 'CISSP certified, 5 years exp' }
  ],
  skills: ['Cyber Security', 'Network Security', 'CISSP'],
  education: [{ degree: 'B.Sc Computer Science' }],
  certifications: [{ name: 'CISSP' }]
};

// Job Data (Simulating the job in the screenshot)
const mockJob = {
  id: 'job-123',
  title: 'מומחה/ית אבטחת מידע', // Information Security Specialist
  category: 'Information Security',
  description: 'דרוש מומחה אבטחת מידע עם ניסיון...',
  location: 'אבנת', // Avnat? Or is it "Avnet"? Screenshot says "אבנת".
  employment_type: 'full_time', // "משרה מלאה"
  start_date: 'immediate', // "מיידי"
  structured_requirements: JSON.stringify([{ value: 'CISSP' }, { value: 'Cyber Security' }]),
  structured_education: JSON.stringify([]),
  structured_certifications: JSON.stringify([])
};


async function runDebug() {
  console.log('--- Starting Match Score Debug ---');
  
  // 1. Run Calculation
  const result = await calculate_match_breakdown(mockCandidate, mockJob);
  
  console.log('Total Score:', result.total_score);
  console.log('Breakdown:', JSON.stringify(result.breakdown, null, 2));
  console.log('Top Part:', result.top_part_score);
  console.log('Bottom Part:', result.bottom_part_score);
  
  // 2. Analyze specific preference fields
  console.log('\n--- Preference Analysis ---');
  console.log('Candidate Locations:', mockCandidate.preferred_locations);
  console.log('Job Location:', mockJob.location);
  console.log('Location Score:', result.breakdown.location);
  
  console.log('Candidate Job Types:', mockCandidate.job_types);
  console.log('Job Type:', mockJob.employment_type);
  console.log('Job Type Score:', result.breakdown.jobType);

  console.log('Candidate Availability:', mockCandidate.availability);
  console.log('Job Start Date:', mockJob.start_date);
  console.log('Availability Score:', result.breakdown.availability);
}

runDebug();
