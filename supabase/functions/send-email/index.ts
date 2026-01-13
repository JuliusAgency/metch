import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    // Handle CORS
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const payload = await req.json()
        const { to, from, subject, html, text, attachments } = payload

        console.log(`Attempting to send email to: ${to}`)

        // Prioritize RESEND_API_KEY_TWO as requested, fallback to RESEND_API_KEY
        const resendApiKey = Deno.env.get('RESEND_API_KEY_TWO') || Deno.env.get('RESEND_API_KEY')

        console.log('Using Resend key starting with:', resendApiKey?.substring(0, 7) + '...')
        if (!resendApiKey) {
            console.error('RESEND_API_KEY is missing')
            return new Response(
                JSON.stringify({ error: 'Resend API key missing in Supabase' }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
            )
        }

        const response = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${resendApiKey}`
            },
            body: JSON.stringify({
                from: from || 'noreply@noreply.metch.co.il',
                to: Array.isArray(to) ? to : [to],
                reply_to: from,
                subject: subject || 'Resume from Metch',
                html: html || text,
                text: text || 'CV attached',
                ...(attachments && attachments.length ? { attachments } : {})
            })
        })

        const result = await response.json()
        console.log('Resend response:', JSON.stringify(result))

        if (!response.ok) {
            return new Response(
                JSON.stringify({ error: result.message || 'Resend error', details: result }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: response.status }
            )
        }

        return new Response(
            JSON.stringify(result),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        )
    } catch (error) {
        console.error('Function error:', error)
        return new Response(
            JSON.stringify({ error: error.message }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        )
    }
})
