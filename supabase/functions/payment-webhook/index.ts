
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

    try {
        const contentType = req.headers.get('content-type') || '';
        let data: any = {};
        if (contentType.includes('application/json')) {
            data = await req.json();
        } else if (contentType.includes('application/x-www-form-urlencoded')) {
            const formData = await req.formData();
            data = Object.fromEntries(formData.entries());
        }

        console.log("Webhook Received:", JSON.stringify(data));

        const responseCode = data.ResponseCode;
        const requestId = data.ReturnValue;
        const lowProfileCode = data.LowProfileCode;
        const amount = parseFloat(data.Amount || '0');

        if (responseCode !== '0' && responseCode !== 0) return new Response('OK', { status: 200 });

        const supabaseAdmin = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        // Find Transaction (Robust matching)
        let existingTxn = null;
        if (lowProfileCode) {
            const { data } = await supabaseAdmin.from('Transaction').select('*').eq('metadata->>lowProfileCode', lowProfileCode).maybeSingle();
            existingTxn = data;
        }
        if (!existingTxn && requestId) {
            const { data } = await supabaseAdmin.from('Transaction').select('*').eq('metadata->>requestId', requestId).maybeSingle();
            existingTxn = data;
        }

        if (!existingTxn || existingTxn.status === 'completed') return new Response('OK', { status: 200 });

        const userId = existingTxn.user_id;

        // Grant Credits
        const quantity = parseInt(existingTxn.metadata?.quantity || "1");
        const { data: profile } = await supabaseAdmin.from('UserProfile').select('job_credits').eq('id', userId).single();
        const newCredits = (profile?.job_credits || 0) + quantity;

        await supabaseAdmin.from('UserProfile').update({ job_credits: newCredits }).eq('id', userId);

        // Update Transaction
        await supabaseAdmin.from('Transaction').update({
            status: 'completed',
            metadata: {
                ...(existingTxn.metadata || {}),
                lowProfileCode,
                invoice_number: data.InvoiceNumber,
                invoice_url: data.DocumentURL || data.DocUrl,
                credits_added: quantity,
                processed_at: new Date().toISOString(),
                is_pending: false
            }
        }).eq('id', existingTxn.id);

        return new Response('OK', { status: 200 });
    } catch (err) {
        console.error("Webhook Error:", err);
        return new Response('Error', { status: 500 });
    }
})
