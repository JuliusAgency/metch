
// Mock is_career_change
async function is_career_change() { return false; }

function isDateWithinMonth(dateString) {
  if (!dateString) return true;

  if (dateString === 'flexible') return true;
  if (dateString === 'immediate') return true;
  if (dateString === '1_2_weeks') return true;
  if (dateString === '1_2_months') return false; // Starts in > 1 month

  const date = new Date(dateString);
  if (isNaN(date.getTime())) return true; 

  const now = new Date();
  const oneMonthFromNow = new Date(now.getFullYear(), now.getMonth() + 1, now.getDate());

  return date <= oneMonthFromNow;
}

function scoreAvailability(candidate_profile, job_posting) {
  const candidateAvailability = candidate_profile.availability?.toLowerCase() || '';
  const jobStartDate = job_posting.start_date;

  console.log(`Debug: Candidate: "${candidateAvailability}", Job Start: "${jobStartDate}"`);

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
       console.log('-> Immediate candidate, Start Date within month (or invalid/flexible) -> 100');
      return 100; // Immediate and full match
    } else {
      console.log('-> Immediate candidate, Start Date > 1 month -> 70');
      return 70; // Available within 1 month
    }
  }

  // Check if candidate can start within 1 month
  const canStartWithinMonth = candidateAvailability.includes('חודש') ||
    candidateAvailability.includes('month');

  if (canStartWithinMonth) {
    if (!jobStartDate || isDateWithinMonth(jobStartDate)) {
       console.log('-> 1-Month candidate, Job is within month -> 70');
      return 70; // Available within 1 month
    }
    console.log('-> 1-Month candidate, Job > 1 month -> 0 (Mismatch?)');
  }

  return 0;
}

// Test Cases
const today = new Date();
const nextMonth = new Date(today); nextMonth.setDate(today.getDate() + 45); // 1.5 months
const twoMonths = new Date(today); twoMonths.setDate(today.getDate() + 65); // 2+ months

const isoNextMonth = nextMonth.toISOString().split('T')[0];
const isoTwoMonths = twoMonths.toISOString().split('T')[0];

console.log('--- Availability Test 1: Mismatch reported by user ---');
// User: "Daniel Darwish" (Likely Immediate) vs Job: "Month to two months" (Value: 1_2_months)
scoreAvailability({ availability: 'immediate' }, { start_date: '1_2_months' }); // Should return false/70 or 0
scoreAvailability({ availability: 'immediate' }, { start_date: '1_2_weeks' }); // Should return true/100

console.log('\n--- Availability Test 2: Date Objects ---');
scoreAvailability({ availability: 'immediate' }, { start_date: isoNextMonth });
scoreAvailability({ availability: 'immediate' }, { start_date: isoTwoMonths });

console.log('\n--- Availability Test 3: Candidate "Flexible" ---');
scoreAvailability({ availability: 'flexible' }, { start_date: isoTwoMonths });

console.log('\n--- Availability Test 4: Candidate "1 Month" ---');
scoreAvailability({ availability: 'one_month' }, { start_date: isoTwoMonths });
