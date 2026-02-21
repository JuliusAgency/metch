
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

        const activeLowProfileCode = lowProfileCode || existingTxn?.provider_transaction_id;

        if (activeLowProfileCode) {
            console.log(`Syncing with Cardcom API using code: ${activeLowProfileCode}`);

            // Wait function for retries
            const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

            for (let attempt = 1; attempt <= 3; attempt++) {
                try {
                    console.log(`Cardcom sync attempt ${attempt}...`);
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

                    console.log(`Attempt ${attempt} HTTP Status: ${response.status} ${response.statusText}`);

                    if (response.ok) {
                        const cd = await response.json();
                        console.log(`Attempt ${attempt} Data Keys:`, Object.keys(cd).join(', '));
                        console.log(`Attempt ${attempt} ResponseCode:`, cd.ResponseCode, 'Description:', cd.Description);

                        if (cd.ResponseCode === 0) {
                            // Exhaustive field check for invoice data
                            invoiceNumber = cd.InvoiceNumber || cd.DocNumber || cd.DocNumberToDisplay || cd.DocumentNumber || cd.docNumber;
                            invoiceUrl = cd.DocumentURL || cd.DocUrl || cd.DocumentUrl || cd.DocURL || cd.docUrl;

                            if (invoiceUrl) {
                                console.log(`SUCCESS: Found Invoice URL on attempt ${attempt}: ${invoiceUrl}`);
                                break;
                            } else {
                                console.log(`Attempt ${attempt}: ResponseCode 0 but NO DocumentURL. cd keys with 'url':`,
                                    Object.keys(cd).filter(k => k.toLowerCase().includes('url')));
                            }
                        }
                    } else {
                        const errText = await response.text();
                        console.error(`Attempt ${attempt} Error Body:`, errText);
                    }
                } catch (indicatorErr) {
                    console.error(`Indicator fetch attempt ${attempt} failed:`, indicatorErr.message);
                }

                if (attempt < 3) {
                    console.log('Waiting 2 seconds for document generation...');
                    await sleep(2000); // Wait 2 seconds between retries
                }
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
        console.log(`FINALIZING: Updating transaction ${existingTxn.id} with status completed and invoice info...`);
        const finalMetadata = {
            ...(existingTxn.metadata || {}),
            invoice_number: invoiceNumber,
            invoice_url: invoiceUrl,
            credits_added: quantity,
            verified_at: new Date().toISOString(),
            is_pending: false
        };
        console.log('FINAL METADATA TO SAVE:', JSON.stringify(finalMetadata, null, 2));

        const { error: finalUpdateErr } = await supabaseAdmin
            .from('Transaction')
            .update({
                status: 'completed',
                provider_transaction_id: lowProfileCode || existingTxn.provider_transaction_id,
                metadata: finalMetadata
            })
            .eq('id', existingTxn.id);

        if (finalUpdateErr) {
            console.error('FINAL UPDATE ERROR:', finalUpdateErr);
            throw finalUpdateErr;
        }

        console.log('--- VERIFY PAYMENT COMPLETED SUCCESSFULLY ---');

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
