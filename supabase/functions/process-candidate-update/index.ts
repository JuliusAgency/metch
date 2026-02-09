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
        const profile = payload.record // The updated user profile

        // Skip if not a job seeker
        if (profile.user_type !== 'job_seeker') {
            return new Response(JSON.stringify({ message: 'Not a job seeker' }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200,
            })
        }

        console.log(`Processing updates for candidate: ${profile.email}`)

        // 1. Fetch all ACTIVE jobs
        const { data: jobs, error: jobError } = await supabaseClient
            .from('Job')
            .select('*')
            .eq('status', 'active')

        if (jobError) throw jobError

        // 2. Fetch existing applications for this candidate
        const { data: applications, error: appError } = await supabaseClient
            .from('JobApplication')
            .select('job_id')
            .eq('applicant_id', profile.id)

        if (appError) throw appError

        const appliedJobIds = new Set((applications || []).map(app => app.job_id))

        console.log(`Found ${jobs.length} active jobs. Candidate has applied to ${appliedJobIds.size}.`)

        for (const job of jobs) {
            // 3. Skip if already applied
            if (appliedJobIds.has(job.id)) continue

            // 4. Fast heuristic check
            const candSpec = (profile.specialization || '').toLowerCase()
            const jobCat = (job.category || '').toLowerCase()

            if (candSpec && jobCat && !jobCat.includes(candSpec) && !candSpec.includes(jobCat)) {
                continue
            }

            // 5. Calculate score
            const score = await calculate_match_score(profile, job)

            if (score && score >= 0.9) {
                console.log(`New high match found for ${profile.email} -> ${job.title}: ${Math.round(score * 100)}%`)

                // 6. Check if notification already sent RECENTLY (optional, preventing spam)
                const { data: existingNotifs } = await supabaseClient
                    .from('Notification')
                    .select('id')
                    .eq('user_id', profile.id)
                    .eq('type', 'high_match_alert')
                    .contains('data', { job_id: job.id })
                    .limit(1)

                if (existingNotifs && existingNotifs.length > 0) {
                    continue // Already notified about this job
                }

                // 7. Create notification
                await supabaseClient.from('Notification').insert({
                    email: profile.email,
                    user_id: profile.id,
                    type: 'high_match_alert',
                    message: `נמצאה התאמה חדשה עבורך! המשרה ${job.title} ב-${job.company} מתאימה לך ב-${Math.round(score * 100)}%.`,
                    is_read: false,
                    data: { job_id: job.id, score: Math.round(score * 100) }
                })

                // 8. Send WhatsApp
                if (profile.is_phone_verified && profile.phone) {
                    const message = `היי ${profile.full_name || ''}, עדכנת פרטים ומצאנו לך התאמה חדשה! 🚀\n${job.title} ב-${job.company} (${Math.round(score * 100)}%).\nלצפייה: https://metch.link/JobDetails?id=${job.id}`

                    await supabaseClient.functions.invoke('send-whatsapp', {
                        body: { phoneNumber: profile.phone, message }
                    })
                }
            }
        }

        return new Response(JSON.stringify({ success: true }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        })
    } catch (error) {
        console.error('Error processing candidate update:', error.message)
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
        })
    }
})
