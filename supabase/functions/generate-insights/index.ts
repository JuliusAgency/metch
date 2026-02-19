import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import OpenAI from "https://esm.sh/openai@4.24.1";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req: Request) => {
    // Handle CORS preflight requests
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const { cv_text, preferences_json, matches_summary } = await req.json();
        const apiKey = Deno.env.get('OPENAI_API_KEY');

        if (!apiKey) {
            throw new Error('OPENAI_API_KEY is not set in environment variables');
        }

        const openai = new OpenAI({
            apiKey: apiKey,
        });

        console.log("[generate-insights] Generating insights with Prompt v7...");
        console.log(`[generate-insights] Inputs - CV Length: ${cv_text?.length}, Prefs Length: ${preferences_json?.length}, Matches Length: ${matches_summary?.length}`);

        // --- Custom Logic for 'openai.responses.create' ---
        // Assuming this might be a custom method or handled by a specific proxy,
        // we will try to invoke it, but fallback to a standard chat completion if fails (though we lack the prompt text).

        let completion;
        const openaiAny = openai as any;

        if (openaiAny.responses && typeof openaiAny.responses.create === 'function') {
            try {
                completion = await openaiAny.responses.create({
                    prompt: {
                        "id": "pmpt_6995ed7a0f0481979ef6935cfddbdcd70efb6517bb1a6f23", // Prompt ID from user
                        "version": "7",
                        "variables": {
                            "cv_text": cv_text || "",
                            "preferences_json": preferences_json || "",
                            "matches_summary": matches_summary || ""
                        }
                    }
                });
            } catch (customErr) {
                console.error("[generate-insights] Custom method 'responses.create' failed:", customErr);
                throw customErr;
            }
        } else {
            console.warn("[generate-insights] 'openai.responses.create' not found in standard SDK.");
            // Fallback: This is CRITICAL if the user didn't provide text. We can try to guess or use the ID in a 'model'? No.
            // We will attempt to use 'chat.completions.create' IF we assume the prompt logic is just a wrapper for a standard chat request.
            // However, without the prompt TEXT, we can't replicate the behavior.

            // To be helpful, I'll log this clearly:
            // "The provided code snippet uses a non-standard method. Please provide the prompt text or check SDK."

            throw new Error("OpenAI SDK does not support 'responses.create'. Please provide the prompt text or check the SDK version/provider.");
        }

        const responseContent = completion.choices?.[0]?.message?.content || JSON.stringify(completion);

        return new Response(
            JSON.stringify({ content: responseContent }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

    } catch (error) {
        console.error('[generate-insights] Error:', (error as Error).message);
        return new Response(
            JSON.stringify({ error: (error as Error).message }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } } // 400 Bad Request
        );
    }
});
