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

    console.log('--- SEARCHING FOR APPLICATIONS FROM RAFAEL/DANIEL ---');
    // Using IDs from previous UserProfile run
    const candidateIds = [
        'c9a9fb21-84e1-43bb-bb8f-06aeb3d4d111', 
        '0c55fcc4-e77b-4f92-8973-57c353e56b7e',
        '559d1942-02f5-46f4-8d45-54ed27f7b929',
        'dc423e2f-e5cd-4e98-a086-690bd79041ee',
        '3addfb7e-cfab-417a-88e4-1815126e04ed' // Daniel
    ];

    for (const id of candidateIds) {
        const apps = await fetchData('JobApplication', `?applicant_id=eq.${id}&select=*,Job(title)`);
        if (apps.length > 0) {
            console.log(`Applications for ID ${id}:`);
            console.log(JSON.stringify(apps, null, 2));
        }
    }
}

main().catch(console.error);
