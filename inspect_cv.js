import { CV } from './src/api/entities.js';

async function inspectCV() {
    try {
        const cvs = await CV.filter({}, "-created_at", 1);
        if (cvs.length > 0) {
            console.log('CV Keys:', Object.keys(cvs[0]));
            console.log('CV Data:', cvs[0]);
        } else {
            console.log('No CVs found.');
        }
    } catch (error) {
        console.error('Error fetching CV:', error);
    }
}

inspectCV();
