
import { calculate_match_breakdown } from './temp_matchScore.js';

const job = {
    title: "מומחה/ית אבטחת מידע (עותק) (עותק) (עותק) (עותק)",
    description: "תיאור משרה כללי בתחום אבטחת מידע. דרוש ניסיון וכו'.",
    location: "אבו חמרה",
    category: "אבטחת מידע",
    start_date: "flexible",
    requirements: null,
    structured_requirements: "[]",
    structured_education: "[]",
    structured_certifications: "[]",
    company_perks: "[]",
    employment_type: "full_time"
};

const candidate = {
    first_name: "Netanel",
    last_name: "Nagosa",
    specialization: "אבטחת מידע",
    job_titles: ["מומחה אבטחת מידע"],
    preferred_locations: ["מרכז", "תל אביב"],
    job_types: ["full_time"],
    availability: "מיידית",
    experience: [
        { title: "מומחה אבטחת מידע", description: "ניסיון באבטחת מידע", years: 3 }
    ],
    education: [
        { degree: "תואר ראשון", field: "מדעי המחשב" }
    ],
    skills: ["Cyber", "Security"],
    character_traits: []
};

async function run() {
    const breakdown = await calculate_match_breakdown(candidate, job);
    console.log("Total Score:", breakdown.total_score);
    console.log("Breakdown:", JSON.stringify(breakdown.breakdown, null, 2));
    console.log("Top Part:", breakdown.top_part_score);
    console.log("Bottom Part:", breakdown.bottom_part_score);
}

run();
