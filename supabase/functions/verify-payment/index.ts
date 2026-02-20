
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    console.log('--- VERIFY PAYMENT (ROBUST MATCHING) ---');

    try {
        const { requestId, lowProfileCode } = await req.json()
        console.log(`Input: requestId=${requestId}, lowProfileCode=${lowProfileCode}`);

        const supabaseAdmin = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        // 1. Find Transaction (Try lowProfileCode first, then requestId)
        let existingTxn = null;

        if (lowProfileCode) {
            console.log(`Searching by lowProfileCode: ${lowProfileCode}`);
            const { data } = await supabaseAdmin
                .from('Transaction')
                .select('*')
                .eq('metadata->>lowProfileCode', lowProfileCode)
                .maybeSingle();
            existingTxn = data;
        }

        if (!existingTxn && requestId) {
            console.log(`Searching by requestId: ${requestId}`);
            const { data } = await supabaseAdmin
                .from('Transaction')
                .select('*')
                .eq('metadata->>requestId', requestId)
                .maybeSingle();
            existingTxn = data;
        }

        if (!existingTxn) {
            console.error('Transaction not found in DB');
            throw new Error('Transaction record not found.');
        }

        if (existingTxn.status === 'completed') {
            console.log('Transaction already completed.');
            return new Response(JSON.stringify({ success: true, already: true }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

        const userId = existingTxn.user_id;
        const TERMINAL_NUMBER = Deno.env.get('CARDCOM_TERMINAL_NUMBER');
        const API_NAME = Deno.env.get('CARDCOM_API_NAME');
        const API_PASSWORD = Deno.env.get('CARDCOM_API_PASSWORD');

        let invoiceNumber = null;
        let invoiceUrl = null;

        // 2. Fetch Real Invoice from Cardcom
        if (lowProfileCode) {
            try {
                const response = await fetch(`https://secure.cardcom.solutions/api/v11/LowProfile/GetIndicator`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        TerminalNumber: parseInt(TERMINAL_NUMBER!),
                        ApiName: API_NAME,
                        Password: API_PASSWORD,
                        LowProfileCode: lowProfileCode
                    })
                });
                if (response.ok) {
                    const cd = await response.json();
                    if (cd.ResponseCode === 0) {
                        invoiceNumber = cd.InvoiceNumber || cd.DocNumber || cd.DocNumberToDisplay;
                        invoiceUrl = cd.DocumentURL || cd.DocUrl || cd.DocumentUrl;
                    }
                }
            } catch (e) { console.error('Indicator fetch error:', e); }
        }

        // 3. Grant Credits
        const quantity = parseInt(existingTxn.metadata?.quantity || "1");
        const { data: profile } = await supabaseAdmin.from('UserProfile').select('job_credits').eq('id', userId).single();
        const newCredits = (profile?.job_credits || 0) + quantity;

        await supabaseAdmin.from('UserProfile').update({ job_credits: newCredits }).eq('id', userId);
        console.log(`Granted ${quantity} jobs to user ${userId}. New balance: ${newCredits}`);

        // 4. Finalize Transaction
        await supabaseAdmin.from('Transaction').update({
            status: 'completed',
            metadata: {
                ...(existingTxn.metadata || {}),
                lowProfileCode,
                invoice_number: invoiceNumber,
                invoice_url: invoiceUrl,
                credits_added: quantity,
                verified_at: new Date().toISOString(),
                is_pending: false
            }
        }).eq('id', existingTxn.id);

        return new Response(JSON.stringify({
            success: true,
            added: quantity,
            invoiceNumber,
            invoiceUrl
        }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    } catch (error) {
        console.error('Verify failure:', error.message);
        return new Response(JSON.stringify({ success: false, message: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400
        });
    }
})
