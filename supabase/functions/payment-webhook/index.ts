
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

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
        console.log("Received Webhook Request");

        // Cardcom usually sends data as x-www-form-urlencoded
        const contentType = req.headers.get('content-type') || '';
        let data: any = {};

        if (contentType.includes('application/json')) {
            data = await req.json();
        } else if (contentType.includes('application/x-www-form-urlencoded')) {
            const formData = await req.formData();
            data = Object.fromEntries(formData.entries());
        } else {
            // Fallback text parsing if needed
            const text = await req.text();
            console.log("Unknown content type body:", text);
            // Try to parse query params from text if possible, but unlikely
        }

        console.log("Webhook Payload:", JSON.stringify(data));

        // Validate Key Parameters
        // ResponseCode: '0' means success
        // ReturnValue: This is our requestId
        // LowProfileCode: Cardcom's deal ID
        // TerminalNumber: Should match ours

        const responseCode = data.ResponseCode;
        const description = data.Description;
        const requestId = data.ReturnValue; // We sent this as ReturnValue
        const transactionId = data.LowProfileCode || data.DealID || data.ExternalId; // Check varied fields
        const amount = parseFloat(data.Amount || '0');
        const email = data.Email; // We hope Cardcom returns this
        const invoiceNumber = data.InvoiceNumber; // If an invoice was generated

        // If not success
        if (responseCode !== '0' && responseCode !== 0) {
            console.error(`Transaction Failed: ${description} (Code: ${responseCode})`);
            return new Response('OK', { status: 200 }); // Ack to stop retries
        }

        if (!requestId) {
            console.error("Missing ReturnValue (requestId)");
            return new Response('OK', { status: 200 });
        }

        // Initialize Admin Client
        const supabaseAdmin = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        // 1. Check Idempotency (Did we already process this?)
        const { data: existingTxn } = await supabaseAdmin
            .from('Transaction')
            .select('id')
            .eq('metadata->>requestId', requestId)
            .single();

        if (existingTxn) {
            console.log(`Transaction ${requestId} already processed.`);
            return new Response('OK', { status: 200 });
        }

        // 2. Find User
        // If Email is missing, we have a problem. 
        // fallback: If we can't find by email, maybe we can't credit.
        // But for now let's try to find by Email.
        let userId = null;

        if (email) {
            const { data: user } = await supabaseAdmin
                .from('UserProfile')
                .select('id, job_credits')
                .eq('email', email)
                .single();

            if (user) {
                userId = user.id;

                // 3. Update Credits
                // Calculate credits based on amount/product
                // Logic: 349 = 1 credit? 
                // Currently implementing simplified logic:
                // If amount ~ 349 => 1 credit
                // If amount ~ 1 => 5 credits (TEST)

                let creditsToAdd = 0;
                if (Math.abs(amount - 349) < 1) creditsToAdd = 1;
                else if (amount <= 5) creditsToAdd = 5; // Test mode

                if (creditsToAdd > 0) {
                    const { error: updateError } = await supabaseAdmin
                        .from('UserProfile')
                        .update({ job_credits: (user.job_credits || 0) + creditsToAdd })
                        .eq('id', userId);

                    if (updateError) console.error("Failed to update credits:", updateError);
                    else console.log(`Added ${creditsToAdd} credits to user ${email}`);
                }
            } else {
                console.error(`User not found for email: ${email}`);
            }
        } else {
            console.error("No Email returned from Cardcom, cannot link to user.");
        }

        // 4. Log Transaction
        // Even if user not found, we might want to log it? 
        // Schema requires user_id usually.
        if (userId) {
            const { error: txnError } = await supabaseAdmin
                .from('Transaction')
                .insert({
                    user_id: userId,
                    amount: amount,
                    currency: 'ILS',
                    description: data.ProductName || 'רכישת משרות',
                    provider_transaction_id: transactionId,
                    status: 'completed',
                    metadata: {
                        requestId: requestId,
                        invoice_number: invoiceNumber,
                        card_suffix: data.CardNum, // often just 4 digits
                        card_brand: data.Brand,
                        raw_response: data
                    }
                });

            if (txnError) console.error("Failed to insert transaction:", txnError);
        }

        return new Response('OK', { status: 200 });

    } catch (err) {
        console.error("Webhook Error:", err);
        return new Response('Internal Server Error', { status: 500 });
    }
})
