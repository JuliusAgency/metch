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
        try {
            const targetUrl = `${url}/rest/v1/${tableName}${query}`;
            const response = await fetch(targetUrl, {
                headers: {
                    'apikey': key,
                    'Authorization': `Bearer ${key}`,
                    'Content-Type': 'application/json'
                }
            });
            if (!response.ok) return { error: `HTTP ${response.status}`, details: await response.text() };
            return await response.json();
        } catch (e) {
            return { error: e.message };
        }
    }

    console.log('--- LISTING ALL USER PROFILES (First 100) ---');
    const users = await fetchData('UserProfile', '?select=id,full_name,email,preferred_location,availability,preferred_job_types&limit=100');
    console.log('Total Users:', users.length);
    console.log(JSON.stringify(users, null, 2));

    console.log('\n--- FETCHING ALL ACTIVE JOBS ---');
    const activeJobs = await fetchData('Job', '?status=eq.active&order=created_date.desc');
    console.log('Active Jobs Found:', activeJobs.length);
    if (activeJobs.length > 0) {
        // Keep it concise but show key fields
        const displayJobs = activeJobs.map(j => ({
            id: j.id,
            title: j.title || 'NO TITLE',
            location: j.location,
            category: j.category,
            status: j.status,
            structured_requirements: j.structured_requirements
        }));
        console.log(JSON.stringify(displayJobs, null, 2));
    }
}

main().catch(console.error);
