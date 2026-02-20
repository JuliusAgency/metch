
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

        // Get user from auth session (if available)
        const { data: { user: authUser } } = await supabaseClient.auth.getUser()

        const {
            amount,
            productName,
            customerName,
            customerEmail,
            origin: passedOrigin,
            userId: passedUserId,
            metadata: passedMetadata
        } = await req.json()

        // Use passed userId as fallback (crucial for iframe safety)
        const activeUserId = authUser?.id || passedUserId;

        if (!activeUserId) {
            throw new Error('No user identified for this payment');
        }

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
        const { data: txn, error: insertError } = await supabaseAdmin
            .from('Transaction')
            .insert({
                user_id: activeUserId,
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
            throw new Error(`Failed to create transaction record: ${insertError.message}`);
        }

        const transactionId = txn.id;
        let baseUrl = passedOrigin || req.headers.get('origin') || 'https://app.metch.co.il';
        // Force HTTPS for production redirects to avoid connection issues in iframes
        if (baseUrl.includes('app.metch.co.il') && !baseUrl.startsWith('https://')) {
            baseUrl = baseUrl.replace('http://', 'https://');
            if (!baseUrl.startsWith('https://')) baseUrl = 'https://' + baseUrl;
        }

        const successUrl = `${baseUrl.replace(/\/$/, '')}/payment-success?ref=${requestId}`;
        const errorUrl = `${baseUrl.replace(/\/$/, '')}/payment-error?ref=${requestId}`;

        // 2. Fetch Invoice Details
        let invoiceDetails = { company_name: customerName || 'Guest', vat_id: '', phone: '' };
        const { data: profile } = await supabaseAdmin.from('UserProfile').select('invoice_company_name, invoice_vat_id, invoice_phone').eq('id', activeUserId).single();
        if (profile) {
            invoiceDetails.company_name = profile.invoice_company_name || invoiceDetails.company_name;
            invoiceDetails.vat_id = profile.invoice_vat_id || '';
            invoiceDetails.phone = profile.invoice_phone || '';
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
                Operation: 3, // 3 = Invoice/Receipt (חשבונית מס קבלה)
                ExtDocumentId: requestId,
                ExtInvoiceId: requestId
            },
            Custom1: activeUserId
        };

        const response = await fetch(CARDCOM_API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody)
        });

        const data = await response.json();
        if (data.ResponseCode !== 0) throw new Error(data.Description);

        const lowProfileCode = data.LowProfileCode || data.lowProfileCode || data.LowProfileId;

        // 3. Update Transaction with lowProfileCode in provider_transaction_id column
        const { error: updateError } = await supabaseAdmin
            .from('Transaction')
            .update({
                provider_transaction_id: lowProfileCode, // For O(1) matching
                metadata: {
                    ...txn.metadata,
                    lowProfileCode
                }
            })
            .eq('id', transactionId);

        if (updateError) console.error('Provider ID Update Error:', updateError);

        const iframeUrl = `https://secure.cardcom.solutions/External/lowProfileClearing/${TERMINAL_NUMBER}.aspx?lowprofilecode=${lowProfileCode}&Lang=he`;

        return new Response(JSON.stringify({ success: true, url: iframeUrl, lowProfileCode, requestId }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        })
    } catch (error) {
        console.error('Create Payment Fatal Error:', error.message);
        return new Response(JSON.stringify({ success: false, message: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        })
    }
})
