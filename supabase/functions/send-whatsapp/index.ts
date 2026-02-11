import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const { phoneNumber, message } = await req.json()

        const instanceId = Deno.env.get('GREEN_API_INSTANCE_ID')
        const apiToken = Deno.env.get('GREEN_API_TOKEN')

        if (!instanceId || !apiToken) {
            return new Response(
                JSON.stringify({ error: 'Green API credentials not configured in Supabase Secrets' }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
            )
        }

        // Clean and format phone number
        const cleanPhone = phoneNumber.replace(/\D/g, '')
        const formattedPhone = cleanPhone.startsWith('972')
            ? cleanPhone
            : `972${cleanPhone.startsWith('0') ? cleanPhone.substring(1) : cleanPhone}`

        const url = `https://7105.api.greenapi.com/waInstance${instanceId}/sendMessage/${apiToken}`

        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chatId: `${formattedPhone}@c.us`,
                message: message
            })
        })

        const result = await response.json()

        return new Response(
            JSON.stringify(result),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        )
    } catch (error) {
        return new Response(
            JSON.stringify({ error: error.message }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        )
    }
})
