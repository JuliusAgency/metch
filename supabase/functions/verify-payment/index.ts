
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

    console.log('--- VERIFY PAYMENT (EXACT DOCS MATCH) ---');

    try {
        const body = await req.json();
        const { requestId, lowProfileCode, cardcomParams: rawParams } = body;

        const params: any = {};
        if (rawParams) {
            for (const key in rawParams) {
                params[key.toLowerCase()] = rawParams[key];
            }
        }

        const supabaseAdmin = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        const TERMINAL_NUMBER = Deno.env.get('CARDCOM_TERMINAL_NUMBER');
        const API_NAME = Deno.env.get('CARDCOM_API_NAME');
        const API_PASSWORD = Deno.env.get('CARDCOM_API_PASSWORD');

        // 1. Find Transaction or Create from Cardcom Data
        const activeLowProfileCode = lowProfileCode || params.lowprofilecode;
        let { data: txn } = await supabaseAdmin.from('Transaction').select('*')
            .or(`provider_transaction_id.eq."${activeLowProfileCode}",id.eq."${requestId}",metadata->>requestId.eq."${requestId}"`)
            .maybeSingle();

        // If not found in DB, it might be a new flow where we haven't created it yet
        if (!txn && activeLowProfileCode) {
            console.log(`Transaction not found in DB. Fetching from Cardcom using LowProfileCode: ${activeLowProfileCode}`);
            try {
                // Fetch LowProfile info to get Custom fields (User ID, Quantity, etc)
                const lpResp = await fetch(`https://secure.cardcom.solutions/api/v11/LowProfile/GetLowProfileByKey`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        TerminalNumber: parseInt(TERMINAL_NUMBER!),
                        ApiName: API_NAME,
                        UserPassword: API_PASSWORD,
                        LowProfileId: activeLowProfileCode
                    })
                });

                if (lpResp.ok) {
                    const lpData = await lpResp.json();
                    if (lpData.ResponseCode === 0 && lpData.LowProfile) {
                        const lp = lpData.LowProfile;
                        const userId = lp.Custom1;
                        const quantity = parseInt(lp.Custom2 || "1");
                        const productName = lp.Custom3 || "Metch Product";
                        const amount = lp.Amount;

                        console.log(`Creating new transaction record for User: ${userId}, Amount: ${amount}`);

                        const { data: newTxn, error: createError } = await supabaseAdmin.from('Transaction').insert({
                            user_id: userId,
                            amount: amount,
                            currency: 'ILS',
                            description: productName,
                            product_name: productName,
                            status: 'pending', // Will be completed below after verification
                            provider_transaction_id: activeLowProfileCode,
                            metadata: {
                                quantity: quantity.toString(),
                                requestId: requestId || lp.ReturnValue,
                                created_on_verify: true
                            }
                        }).select().single();

                        if (createError) throw new Error(`Failed to create transaction: ${createError.message}`);
                        txn = newTxn;
                    }
                }
            } catch (e) {
                console.error('Failed to reconstruct transaction from Cardcom:', e.message);
            }
        }

        if (!txn) throw new Error(`Transaction not found and could not be reconstructed (Ref: ${requestId || activeLowProfileCode})`);

        // 2. Grant Credits (Immediate Support)
        if (txn.status !== 'completed') {
            const quantity = parseInt(txn.metadata?.quantity || "1");
            const { data: profile } = await supabaseAdmin.from('UserProfile').select('id, job_credits').eq('id', txn.user_id).single();
            if (profile) {
                await supabaseAdmin.from('UserProfile').update({ job_credits: (profile.job_credits || 0) + quantity }).eq('id', profile.id);
            }
        }

        // 3. THE HUNTER (Strict Document Fields)
        let invoiceUrl = null;
        let invoiceNumber = null;
        const dealId = params.internaldealnumber || params.transactionid || params.tranzactionid || params.dealid;

        // Path A: GetTransactionInfoById (DOCS: Image 4)
        if (dealId) {
            console.log(`Calling GetTransactionInfoById for ID: ${dealId}`);
            try {
                const getResp = await fetch(`https://secure.cardcom.solutions/api/v11/Transactions/GetTransactionInfoById`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        TerminalNumber: parseInt(TERMINAL_NUMBER!),
                        UserName: API_NAME,          // AS PER SCREENSHOT 4
                        UserPassword: API_PASSWORD,  // AS PER SCREENSHOT 4
                        InternalDealNumber: parseInt(dealId) // AS PER SCREENSHOT 4
                    })
                });
                if (getResp.ok) {
                    const data = await getResp.json();
                    if (data.ResponseCode === 0 && data.TranzactionInfo) {
                        invoiceUrl = data.TranzactionInfo.DocumentUrl || data.TranzactionInfo.DocumentURL;
                        invoiceNumber = data.TranzactionInfo.DocumentNumber;
                        console.log('Success via GetTransactionInfoById');
                    }
                }
            } catch (e) { console.error('GetInfo error:', e.message); }
        }

        // Path B: ListTransactions (DOCS: Image 3)
        if (!invoiceUrl) {
            console.log('Falling back to ListTransactions...');
            try {
                const date = new Date().toLocaleDateString('en-GB').split('/').join('');
                const listReq = {
                    ApiName: API_NAME,           // AS PER SCREENSHOT 3
                    ApiPassword: API_PASSWORD,   // AS PER SCREENSHOT 3
                    FromDate: date,
                    ToDate: date,
                    TranStatus: "Success",
                    Page: 1,
                    Page_size: 100,
                    LimitForTerminal: parseInt(TERMINAL_NUMBER!)
                };

                const listResp = await fetch(`https://secure.cardcom.solutions/api/v11/Transactions/ListTransactions`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(listReq)
                });

                if (listResp.ok) {
                    const data = await listResp.json();
                    const match = (data.Tranzactions || []).find((t: any) =>
                        String(t.TranzactionId) === String(dealId) || (activeLowProfileCode && t.Token === activeLowProfileCode)
                    );
                    if (match) {
                        invoiceUrl = match.DocumentUrl || match.DocumentURL;
                        invoiceNumber = match.DocumentNumber;
                    }
                }
            } catch (e) { console.error('List error:', e.message); }
        }

        // 4. Update Database
        const finalMetadata = {
            ...(txn.metadata || {}),
            invoice_number: invoiceNumber || txn.metadata?.invoice_number,
            invoice_url: invoiceUrl || txn.metadata?.invoice_url,
            verified_at: new Date().toISOString(),
            is_pending: false,
            sync_source: invoiceUrl ? 'docs_match_sync' : 'credits_only'
        };

        await supabaseAdmin.from('Transaction').update({
            status: 'completed',
            provider_transaction_id: activeLowProfileCode || txn.provider_transaction_id,
            metadata: finalMetadata
        }).eq('id', txn.id);

        return new Response(JSON.stringify({ success: true, invoiceUrl }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

    } catch (error) {
        console.error('Fatal:', error.message);
        return new Response(JSON.stringify({ success: false, message: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
        });
    }
});
