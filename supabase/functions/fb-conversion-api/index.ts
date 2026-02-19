import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { crypto } from "https://deno.land/std@0.177.0/crypto/mod.ts";

const PIXEL_ID = "4084317741711176";
const ACCESS_TOKEN = "EAASP9BCS4yABQoLZAxN1ZCjjv90zZA1J3vwlk4WAZAZAq1MZBQSEVR95uozo66c9bY8auE1MvM8rQaAriCOYDApJKMQ9PtOjgZAJ73YydRvMu78sP5gyHTPcGa8WGT1cUmG42pZAKc4wcCQ3RUYwbCZBOZCmLerd4Ize4YOZC6ZBhJNUeMgQIxFCuXVxAci5j4BjvNoLFAZDZD";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function sha256(message: string) {
    const msgUint8 = new TextEncoder().encode(message);
    const hashBuffer = await crypto.subtle.digest("SHA-256", msgUint8);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
    return hashHex;
}

// Normalization helper
function normalize(value: string | undefined): string {
    if (!value) return "";
    return value.trim().toLowerCase();
}

// Phone normalization (Simple output of E.164-like format keeping only digits)
function normalizePhone(phone: string | undefined): string {
    if (!phone) return "";
    return phone.replace(/[^0-9]/g, "");
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const {
            event_name,
            event_time,
            event_source_url,
            event_id,
            user_data,
            custom_data,
            action_source = "website"
        } = await req.json();

        if (!event_name || !user_data) {
            throw new Error("Missing required fields: event_name or user_data");
        }

        // Hash user data
        const hashedUserData: any = {
            client_user_agent: user_data.client_user_agent
        };

        if (user_data.em) {
            hashedUserData.em = await sha256(normalize(user_data.em));
        }

        if (user_data.fn) {
            hashedUserData.fn = await sha256(normalize(user_data.fn));
        }

        if (user_data.ph) {
            hashedUserData.ph = await sha256(normalizePhone(user_data.ph));
        }

        // Add IP if available (usually passed differently or can be extracted from req headers if reliable)
        // For now we rely on client_user_agent and hashed PII

        const payload = {
            data: [
                {
                    event_name,
                    event_time: event_time || Math.floor(Date.now() / 1000),
                    event_source_url,
                    action_source,
                    event_id,
                    user_data: hashedUserData,
                    custom_data
                }
            ],
            access_token: ACCESS_TOKEN
        };

        console.log(`[CAPI] Sending event ${event_name} to Facebook...`);

        const fbResponse = await fetch(`https://graph.facebook.com/v21.0/${PIXEL_ID}/events`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload)
        });

        const result = await fbResponse.json();
        console.log("[CAPI] FB Response:", result);

        if (!fbResponse.ok) {
            console.error("[CAPI] FB Error:", result);
            return new Response(JSON.stringify({ error: result }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 400
            });
        }

        return new Response(JSON.stringify(result), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        });

    } catch (error) {
        console.error("[CAPI] Error:", error.message);
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
        });
    }
});
