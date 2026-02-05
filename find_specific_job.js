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

    console.log('--- SEARCHING FOR JOBS RELATED TO RAFAEL/DANIEL ---');
    const allJobs = await fetchData('Job', '?select=id,title,status,description,created_date');
    
    const keywords = ['רפאל', 'דניאל', 'rafael', 'daniel'];
    const matchingJobs = allJobs.filter(job => {
        const text = `${job.title} ${job.description}`.toLowerCase();
        return keywords.some(k => text.includes(k));
    });

    console.log(`Found ${matchingJobs.length} potential jobs:`);
    console.log(JSON.stringify(matchingJobs, null, 2));
}

main().catch(console.error);
