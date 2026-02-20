
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

    try {
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_ANON_KEY') ?? '',
            { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
        )

        const { data: { user: authUser } } = await supabaseClient.auth.getUser()

        const {
            amount,
            productName,
            customerName,
            customerEmail,
            origin: passedOrigin,
            metadata: passedMetadata
        } = await req.json()

        const quantity = parseInt(passedMetadata?.quantity || "1");
        const totalAmount = parseFloat(amount);
        const pricePerUnit = totalAmount / quantity;

        const TERMINAL_NUMBER = Deno.env.get('CARDCOM_TERMINAL_NUMBER');
        const API_NAME = Deno.env.get('CARDCOM_API_NAME');
        const API_PASSWORD = Deno.env.get('CARDCOM_API_PASSWORD');

        const CARDCOM_API_URL = `https://secure.cardcom.solutions/api/v11/LowProfile/Create`;
        const requestId = crypto.randomUUID();

        const supabaseAdmin = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        // 1. Create Pending Transaction
        let transactionId = null;
        if (authUser?.id) {
            const { data: txn, error: insertError } = await supabaseAdmin
                .from('Transaction')
                .insert({
                    user_id: authUser.id,
                    amount: totalAmount,
                    currency: 'ILS',
                    description: productName,
                    product_name: productName,
                    status: 'pending',
                    metadata: {
                        requestId: requestId,
                        productName: productName,
                        quantity: quantity,
                        is_pending: true
                    }
                })
                .select()
                .single();

            if (insertError) {
                console.error('Insert Error:', insertError);
            } else {
                transactionId = txn?.id;
                console.log('Created Transaction ID:', transactionId);
            }
        }

        const baseUrl = passedOrigin || req.headers.get('origin') || 'https://app.metch.co.il';
        const successUrl = `${baseUrl}/payment-success?ref=${requestId}`;
        const errorUrl = `${baseUrl}/payment-error?ref=${requestId}`;

        // 2. Fetch Invoice Details
        let invoiceDetails = { company_name: customerName || 'Guest', vat_id: '', phone: '' };
        if (authUser?.id) {
            const { data: profile } = await supabaseAdmin.from('UserProfile').select('invoice_company_name, invoice_vat_id, invoice_phone').eq('id', authUser.id).single();
            if (profile) {
                invoiceDetails.company_name = profile.invoice_company_name || invoiceDetails.company_name;
                invoiceDetails.vat_id = profile.invoice_vat_id || '';
                invoiceDetails.phone = profile.invoice_phone || '';
            }
        }

        const requestBody = {
            TerminalNumber: parseInt(TERMINAL_NUMBER!),
            ApiName: API_NAME,
            Password: API_PASSWORD,
            ReturnValue: requestId,
            Amount: totalAmount,
            Name: customerName || 'Guest',
            Email: customerEmail,
            KodPeula: 1,
            Language: 'he',
            CoinId: 1,
            Items: [{
                Description: productName,
                Price: pricePerUnit,
                Quantity: quantity,
                ItemCode: 'ITEM-001'
            }],
            SuccessRedirectUrl: successUrl,
            FailedRedirectUrl: errorUrl,
            InvoiceHead: {
                CustName: invoiceDetails.company_name,
                CompId: invoiceDetails.vat_id,
                Email: customerEmail,
                Mobile: invoiceDetails.phone,
                SendByEmail: true,
                Language: 'he',
                IsVatFree: false,
                Operation: 1 // 1 = Invoice/Receipt
            },
            Custom1: authUser?.id || 'guest'
        };

        const response = await fetch(CARDCOM_API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody)
        });

        const data = await response.json();
        if (data.ResponseCode !== 0) throw new Error(data.Description);

        const lowProfileCode = data.LowProfileCode || data.lowProfileCode || data.LowProfileId;
        console.log('Received lowProfileCode from Cardcom:', lowProfileCode);

        // 3. Update Transaction with lowProfileCode IMMEDIATELY and AWAIT it
        if (transactionId && lowProfileCode) {
            console.log(`Updating Transaction ${transactionId} with LP Code ${lowProfileCode}`);
            const { error: updateError } = await supabaseAdmin
                .from('Transaction')
                .update({
                    metadata: {
                        requestId,
                        productName,
                        quantity,
                        is_pending: true,
                        lowProfileCode // Ensure this is saved
                    }
                })
                .eq('id', transactionId);

            if (updateError) {
                console.error('Metadata Update Error:', updateError);
            } else {
                console.log('Successfully updated metadata with lowProfileCode');
            }
        }

        const iframeUrl = `https://secure.cardcom.solutions/External/lowProfileClearing/${TERMINAL_NUMBER}.aspx?lowprofilecode=${lowProfileCode}&Lang=he`;

        return new Response(JSON.stringify({ success: true, url: iframeUrl, lowProfileCode, requestId }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        })
    } catch (error) {
        console.error('Create Payment Error:', error.message);
        return new Response(JSON.stringify({ success: false, message: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        })
    }
})
