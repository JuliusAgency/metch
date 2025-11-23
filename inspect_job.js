
import { Job } from './src/api/entities.js';

async function inspectJob() {
    try {
        const jobs = await Job.filter({}, "-created_date", 1);
        if (jobs.length > 0) {
            console.log("Job structure:", JSON.stringify(jobs[0], null, 2));
        } else {
            console.log("No jobs found.");
        }
    } catch (error) {
        console.error("Error fetching job:", error);
    }
}

inspectJob();
