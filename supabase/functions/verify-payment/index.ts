
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

    console.log('--- VERIFY PAYMENT (O1 MATCHING) ---');

    try {
        const body = await req.json();
        console.log('Verify Payment Raw Body:', JSON.stringify(body, null, 2));
        const { requestId, lowProfileCode } = body;
        console.log(`Input Parsed: requestId=${requestId}, lowProfileCode=${lowProfileCode}`);

        const supabaseAdmin = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        // 1. Transaction Lookup (Robust & Efficient)
        let existingTxn = null;

        // A. Match by indexed provider_transaction_id (FASTEST)
        if (lowProfileCode) {
            console.log(`Matching by provider_transaction_id: ${lowProfileCode}`);
            const { data } = await supabaseAdmin
                .from('Transaction')
                .select('*')
                .eq('provider_transaction_id', lowProfileCode)
                .maybeSingle();
            existingTxn = data;
        }

        // B. Match by database ID (primary key)
        if (!existingTxn && requestId) {
            console.log(`Matching by database id: ${requestId}`);
            const { data } = await supabaseAdmin
                .from('Transaction')
                .select('*')
                .eq('id', requestId)
                .maybeSingle();
            existingTxn = data;
        }

        // C. Fallback to metadata requestId
        if (!existingTxn && requestId) {
            console.log(`Falling back to metadata requestId: ${requestId}`);
            const { data } = await supabaseAdmin
                .from('Transaction')
                .select('*')
                .eq('metadata->>requestId', requestId)
                .maybeSingle();
            existingTxn = data;
        }

        if (!existingTxn) {
            console.error('Transaction record not found in system.');
            throw new Error('Transaction record not found. Verification impossible.');
        }

        if (existingTxn.status === 'completed') {
            console.log('Transaction already processed.');
            return new Response(JSON.stringify({ success: true, message: 'Already completed' }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

        const userId = existingTxn.user_id;
        const TERMINAL_NUMBER = Deno.env.get('CARDCOM_TERMINAL_NUMBER');
        const API_NAME = Deno.env.get('CARDCOM_API_NAME');
        const API_PASSWORD = Deno.env.get('CARDCOM_API_PASSWORD');

        let invoiceNumber = null;
        let invoiceUrl = null;

        // 2. Fetch Detailed Invoice from Cardcom
        const activeLowProfileCode = lowProfileCode || existingTxn?.provider_transaction_id;

        if (activeLowProfileCode) {
            try {
                console.log(`Syncing with Cardcom API using code: ${activeLowProfileCode}`);
                const response = await fetch(`https://secure.cardcom.solutions/api/v11/LowProfile/GetIndicator`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        TerminalNumber: parseInt(TERMINAL_NUMBER!),
                        ApiName: API_NAME,
                        Password: API_PASSWORD,
                        LowProfileCode: activeLowProfileCode
                    })
                });

                if (response.ok) {
                    const cd = await response.json();
                    console.log('Cardcom Indicator Full Data:', JSON.stringify(cd, null, 2));
                    if (cd.ResponseCode === 0) {
                        invoiceNumber = cd.InvoiceNumber || cd.DocNumber || cd.DocNumberToDisplay;
                        invoiceUrl = cd.DocumentURL || cd.DocUrl || cd.DocumentUrl;
                        console.log(`Cardcom Confirmation: Invoice #${invoiceNumber}`);
                    }
                }
            } catch (indicatorErr) {
                console.error('Indicator fetch warning:', indicatorErr.message);
            }
        }

        // 3. Grant Purchased Credits
        const quantity = parseInt(existingTxn.metadata?.quantity || "1");
        console.log(`Granting ${quantity} credits to user ${userId}`);

        const { data: profile, error: profileErr } = await supabaseAdmin
            .from('UserProfile')
            .select('job_credits')
            .eq('id', userId)
            .single();

        if (profileErr) throw profileErr;

        const newCredits = (profile.job_credits || 0) + quantity;

        const { error: updateErr } = await supabaseAdmin
            .from('UserProfile')
            .update({ job_credits: newCredits })
            .eq('id', userId);

        if (updateErr) throw updateErr;

        // 4. Finalize Transaction State
        await supabaseAdmin
            .from('Transaction')
            .update({
                status: 'completed',
                provider_transaction_id: lowProfileCode || existingTxn.provider_transaction_id,
                metadata: {
                    ...(existingTxn.metadata || {}),
                    invoice_number: invoiceNumber,
                    invoice_url: invoiceUrl,
                    credits_added: quantity,
                    verified_at: new Date().toISOString(),
                    is_pending: false
                }
            })
            .eq('id', existingTxn.id);

        return new Response(JSON.stringify({
            success: true,
            added: quantity,
            invoiceNumber,
            invoiceUrl
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })

    } catch (error) {
        console.error('Verify Payment Fatal Error:', error.message);
        return new Response(JSON.stringify({
            success: false,
            message: error.message,
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
        })
    }
})
