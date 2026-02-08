import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    // Handle CORS preflight requests
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const { assistantId, prompt } = await req.json()
        const apiKey = Deno.env.get('OPENAI_API_KEY')

        if (!apiKey) {
            throw new Error('OPENAI_API_KEY is not set in environment variables')
        }

        if (!assistantId || !prompt) {
            throw new Error('Missing assistantId or prompt')
        }

        const headers = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
            'OpenAI-Beta': 'assistants=v2'
        };

        console.log(`[invoke-assistant] Starting run for assistant: ${assistantId}`);

        // 1. Create Thread with Message
        const threadResponse = await fetch('https://api.openai.com/v1/threads', {
            method: 'POST',
            headers,
            body: JSON.stringify({
                messages: [{ role: 'user', content: prompt }]
            })
        });

        if (!threadResponse.ok) {
            const err = await threadResponse.json();
            console.error("[invoke-assistant] Thread Error:", err);
            throw new Error(`Failed to create thread: ${JSON.stringify(err)}`);
        }
        const thread = await threadResponse.json();
        console.log("[invoke-assistant] Thread created:", thread.id);

        // 2. Run Assistant
        const runResponse = await fetch(`https://api.openai.com/v1/threads/${thread.id}/runs`, {
            method: 'POST',
            headers,
            body: JSON.stringify({ assistant_id: assistantId })
        });

        if (!runResponse.ok) {
            const err = await runResponse.json();
            console.error("[invoke-assistant] Run Error:", err);
            throw new Error(`Failed to create run: ${JSON.stringify(err)}`);
        }
        const run = await runResponse.json();
        console.log("[invoke-assistant] Run started:", run.id);

        // 3. Poll for completion
        let runStatus = run.status;
        let attempts = 0;
        const maxAttempts = 60; // 60 seconds timeout

        while (['queued', 'in_progress'].includes(runStatus) && attempts < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, 1000));
            attempts++;

            const statusResponse = await fetch(`https://api.openai.com/v1/threads/${thread.id}/runs/${run.id}`, {
                headers
            });
            const statusData = await statusResponse.json();
            runStatus = statusData.status;

            if (['failed', 'cancelled', 'expired'].includes(runStatus)) {
                console.error("[invoke-assistant] Run Failed:", statusData.last_error);
                throw new Error(`Assistant run failed: ${runStatus} - ${JSON.stringify(statusData.last_error)}`);
            }
        }

        if (attempts >= maxAttempts) {
            throw new Error('Assistant run timed out');
        }

        // 4. Get Messages
        const messagesResponse = await fetch(`https://api.openai.com/v1/threads/${thread.id}/messages`, {
            headers
        });
        const messagesData = await messagesResponse.json();
        const lastMessage = messagesData.data.find((m: any) => m.role === 'assistant');

        if (!lastMessage) {
            throw new Error('No response from assistant');
        }

        const content = lastMessage.content[0].text.value;

        return new Response(
            JSON.stringify({ content, threadId: thread.id }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

    } catch (error) {
        console.error('[invoke-assistant] Error:', error.message)
        return new Response(
            JSON.stringify({ error: error.message }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }
})
