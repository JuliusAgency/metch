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

  async function fetchTable(tableName) {
    try {
      const targetUrl = `${url}/rest/v1/${tableName}?limit=1`;
      const response = await fetch(targetUrl, {
        headers: {
          'apikey': key,
          'Authorization': `Bearer ${key}`
        }
      });
      if (!response.ok) return { error: `HTTP ${response.status}`, details: await response.text() };
      return await response.json();
    } catch (e) {
      return { error: e.message };
    }
  }

  const tables = ['Message', 'Notification', 'UserStats', 'UserProfile', 'JobView', 'CandidateView'];
  
  for (const table of tables) {
    console.log(`\nFetching sample from ${table}...`);
    const data = await fetchTable(table);
    console.log(`${table}:`, JSON.stringify(data, null, 2));
  }
}

main().catch(console.error);
