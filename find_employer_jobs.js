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

    // Job IDs Rafael applied to
    const jobIds = [
        '5edf7262-4b63-4c42-8749-69cb49e51ae3',
        'b6c1787a-8b74-4650-87cd-76ea950c6b5e',
        '7522074d-170b-4b1f-8707-d9214ac4727e'
    ];

    const jobs = await fetchData('Job', `?id=in.(${jobIds.join(',')})&select=id,employer_id,title`);
    const employerId = jobs[0]?.employer_id;

    if (!employerId) {
        console.error('Employer not found');
        return;
    }

    console.log(`Employer ID: ${employerId}`);
    
    console.log('--- ALL JOBS BY THIS EMPLOYER ---');
    const employerJobs = await fetchData('Job', `?employer_id=eq.${employerId}&select=id,title,status,created_date,description`);
    console.log(JSON.stringify(employerJobs, null, 2));
}

main().catch(console.error);
