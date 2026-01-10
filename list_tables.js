import fs from 'fs';

async function main() {
  console.log('Reading .env file...');
  let env;
  try {
    env = fs.readFileSync('.env', 'utf8');
  } catch (e) {
    console.error('Could not read .env file.');
    return;
  }

  const urlMatch = env.match(/VITE_SUPABASE_URL=(.*)/);
  const keyMatch = env.match(/VITE_SUPABASE_ANON_KEY=(.*)/);

  if (!urlMatch || !keyMatch) {
    console.error('Could not find Supabase URL or Key in .env');
    return;
  }

  const url = urlMatch[1].trim();
  const key = keyMatch[1].trim();

  // We can't easily query information_schema via REST, but we can try to "guess" or see if there's a way.
  // Actually, a better approach is to just try to access known potential tables or look at the "definitions" if we had the openapi spec.
  // Since we don't have that, I'll update the script to check a much larger list of potential tables found in the codebase.
  
  const potentialTables = [
    'Conversation', 'Message', 'Job', 'JobApplication', 'UserProfile', 
    'UserStats', 'UserAction', 'Notification', 'CV', 'QuestionnaireResponse',
    'JobView', 'CandidateView', 'SavedJob', 'Company', 'Review', 'SupportTicket',
    'Subscription', 'Payment', 'Invoice' 
  ];

  console.log('Checking existence of tables...');
  
  for (const table of potentialTables) {
    try {
      const response = await fetch(`${url}/rest/v1/${table}?limit=1`, {
        headers: {
          'apikey': key,
          'Authorization': `Bearer ${key}`
        }
      });
      
      if (response.ok) {
        console.log(`[EXISTS] ${table}`);
      } else if (response.status === 404) {
         // Table likely doesn't exist
      } else {
        console.log(`[ERROR] ${table}: ${response.status}`);
      }
    } catch (e) {
      console.log(`[ERROR] ${table}: ${e.message}`);
    }
  }
}

main().catch(console.error);
