
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

        console.log("--- WEBHOOK RECEIVED ---");
        console.log("Payload:", JSON.stringify(data));

        const responseCode = data.ResponseCode;
        const requestId = data.ReturnValue;
        const lowProfileCode = data.LowProfileCode;

        // Only process successful payments
        if (responseCode !== '0' && responseCode !== 0) {
            console.log(`Payment failed or pending (Code: ${responseCode}). Ignoring webhook.`);
            return new Response('OK', { status: 200 });
        }

        const supabaseAdmin = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        // 1. Robust Transaction Lookup
        let existingTxn = null;

        // Try primary key match (if it was an exact DealID, but here we use lowProfileCode as provider_id)
        if (lowProfileCode) {
            const { data } = await supabaseAdmin
                .from('Transaction')
                .select('*')
                .eq('provider_transaction_id', lowProfileCode)
                .maybeSingle();
            existingTxn = data;
        }

        // Fallback to requestId
        if (!existingTxn && requestId) {
            const { data } = await supabaseAdmin
                .from('Transaction')
                .select('*')
                .eq('metadata->>requestId', requestId)
                .maybeSingle();
            existingTxn = data;
        }

        if (!existingTxn) {
            console.error('Webhook: Transaction not found in DB');
            return new Response('OK', { status: 200 }); // We return 200 so Cardcom doesn't retry infinitely
        }

        if (existingTxn.status === 'completed') {
            console.log('Webhook: Transaction already completed. Skipping.');
            return new Response('OK', { status: 200 });
        }

        const userId = existingTxn.user_id;

        // 2. Grant Purchased Credits
        const quantity = parseInt(existingTxn.metadata?.quantity || "1");
        const { data: profile } = await supabaseAdmin.from('UserProfile').select('job_credits').eq('id', userId).single();
        const newCredits = (profile?.job_credits || 0) + quantity;

        await supabaseAdmin.from('UserProfile').update({ job_credits: newCredits }).eq('id', userId);
        console.log(`Webhook: Granted ${quantity} jobs to user ${userId}.`);

        // 3. Update Transaction Record
        await supabaseAdmin.from('Transaction').update({
            status: 'completed',
            provider_transaction_id: lowProfileCode || existingTxn.provider_transaction_id,
            metadata: {
                ...(existingTxn.metadata || {}),
                invoice_number: data.InvoiceNumber || data.DocNumber,
                invoice_url: data.DocumentURL || data.DocUrl,
                credits_added: quantity,
                webhook_processed_at: new Date().toISOString(),
                is_pending: false
            }
        }).eq('id', existingTxn.id);

        return new Response('OK', { status: 200 });

    } catch (err) {
        console.error("Webhook Internal Error:", err.message);
        return new Response('Error', { status: 500 });
    }
})
