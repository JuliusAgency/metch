import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { calculate_match_score } from '../_shared/match-engine.ts'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        const payload = await req.json()
        const job = payload.record // The new job record from the webhook

        // 1. Fetch existing applications for this job
        const { data: applications, error: appError } = await supabaseClient
            .from('JobApplication')
            .select('applicant_id')
            .eq('job_id', job.id)

        if (appError) throw appError

        const applicantIds = new Set((applications || []).map(app => app.applicant_id))

        // 2. Fetch all job seekers
        const { data: profiles, error: profileError } = await supabaseClient
            .from('UserProfile')
            .select('*')
            .eq('user_type', 'job_seeker')

        if (profileError) throw profileError

        console.log(`Processing ${profiles.length} profiles for job: ${job.title}. Exclude ${applicantIds.size} existing applicants.`)

        for (const profile of profiles) {
            // 3. Skip if already applied
            if (applicantIds.has(profile.id)) continue

            // 4. Fast heuristic check before full calculation
            const candSpec = (profile.specialization || '').toLowerCase()
            const jobCat = (job.category || '').toLowerCase()

            // Skip if completely unrelated (very basic check)
            if (candSpec && jobCat && !jobCat.includes(candSpec) && !candSpec.includes(jobCat)) {
                continue
            }

            // 3. Calculate score
            const score = await calculate_match_score(profile, job)

            if (score && score >= 0.9) {
                console.log(`High match found for ${profile.email}: ${Math.round(score * 100)}%`)

                // 4. Create in-app notification
                await supabaseClient.from('Notification').insert({
                    email: profile.email,
                    user_id: profile.id,
                    type: 'high_match_alert',
                    message: `מצאנו לך משרה עם התאמה של ${Math.round(score * 100)}%: ${job.title} ב-${job.company}!`,
                    is_read: false,
                    data: { job_id: job.id, score: Math.round(score * 100) }
                })

                // 5. Send WhatsApp if phone is verified
                if (profile.is_phone_verified && profile.company_phone) {
                    const message = `היי ${profile.full_name || ''}, מצאנו לך משרה מושלמת ב-Metch! 🚀\n${job.title} ב-${job.company} עם התאמה של ${Math.round(score * 100)}%.\nלצפייה במשרה: https://metch.link/JobDetails?id=${job.id}`

                    await supabaseClient.functions.invoke('send-whatsapp', {
                        body: { phoneNumber: profile.company_phone, message }
                    })
                }
            }
        }

        return new Response(JSON.stringify({ success: true }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        })
    } catch (error) {
        console.error('Error processing matches:', error.message)
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
        })
    }
})
