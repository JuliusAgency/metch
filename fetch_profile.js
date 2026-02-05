import fs from 'fs';
import path from 'path';

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

    console.log('--- FETCHING PROFILE FOR soozmas@gmail.com ---');
    const profiles = await fetchData('UserProfile', '?email=eq.soozmas@gmail.com');
    console.log(JSON.stringify(profiles, null, 2));
}

main().catch(console.error);
