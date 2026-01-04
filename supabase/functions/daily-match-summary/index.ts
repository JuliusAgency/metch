import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { calculate_match_score } from '../_shared/match-engine.ts'

serve(async (req) => {
    try {
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        // 1. Fetch all job seekers
        const { data: profiles, error: profileError } = await supabaseClient
            .from('UserProfile')
            .select('*')
            .eq('user_type', 'job_seeker')

        if (profileError) throw profileError

        // 2. Fetch jobs from the last 24 hours
        const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
        const { data: recentJobs, error: jobError } = await supabaseClient
            .from('Job')
            .select('*')
            .eq('status', 'active')
            .gt('created_at', yesterday)

        if (jobError) throw jobError

        console.log(`Checking ${recentJobs.length} new jobs for ${profiles.length} profiles`)

        if (recentJobs.length === 0) {
            return new Response(JSON.stringify({ message: "No new jobs found today" }), { status: 200 })
        }

        for (const profile of profiles) {
            let matchCount = 0

            for (const job of recentJobs) {
                // Fast heuristic check
                const candSpec = (profile.specialization || '').toLowerCase()
                const jobCat = (job.category || '').toLowerCase()
                if (candSpec && jobCat && !jobCat.includes(candSpec) && !candSpec.includes(jobCat)) continue

                const score = await calculate_match_score(profile, job)
                if (score && score >= 0.7) {
                    matchCount++
                }
            }

            if (matchCount > 0) {
                // 1. WhatsApp Notification
                if (profile.is_phone_verified && profile.company_phone) {
                    const message = `היי ${profile.full_name || ''}, היום מצאנו לך ${matchCount} משרות חדשות שמתאימות לך ב-Metch! 🎯\nכנס עכשיו כדי לראות אותן: https://metch.link/Dashboard`

                    await supabaseClient.functions.invoke('send-whatsapp', {
                        body: { phoneNumber: profile.company_phone, message }
                    })
                }

                // 2. In-app Notification
                await supabaseClient.from('Notification').insert({
                    email: profile.email,
                    user_id: profile.id,
                    type: 'daily_match_summary',
                    message: `מצאנו לך היום ${matchCount} משרות חדשות שמתאימות לך!`,
                    is_read: false,
                    data: { match_count: matchCount }
                })
            }
        }

        return new Response(JSON.stringify({ success: true }), { status: 200 })
    } catch (error) {
        console.error('Daily summary error:', error.message)
        return new Response(JSON.stringify({ error: error.message }), { status: 400 })
    }
})
