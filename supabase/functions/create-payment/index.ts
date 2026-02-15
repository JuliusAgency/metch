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
        const {
            amount,
            productName,
            customerName,
            customerEmail,
            metadata
        } = await req.json()

        // Retrieve credentials from environment variables
        const TERMINAL_NUMBER = Deno.env.get('CARDCOM_TERMINAL_NUMBER');
        const API_NAME = Deno.env.get('CARDCOM_API_NAME');
        const API_PASSWORD = Deno.env.get('CARDCOM_API_PASSWORD');

        if (!TERMINAL_NUMBER || !API_NAME || !API_PASSWORD) {
            throw new Error('Missing Cardcom server configurations');
        }

        // Cardcom Low Profile Create Endpoint
        const CARDCOM_API_URL = `https://secure.cardcom.solutions/api/v11/LowProfile/Create`;

        // Unique Request ID
        const requestId = crypto.randomUUID();

        // Success/Error Redirect URLs (Frontend routes)
        // Adjust these based on your actual frontend URL (can be passed from client or env)
        // Use origin or referer, or fallback to production domain
        let origin = req.headers.get('origin');
        if (!origin) {
            const referer = req.headers.get('referer');
            if (referer) {
                try {
                    const url = new URL(referer);
                    origin = url.origin;
                } catch (e) {
                    // ignore invalid referer
                }
            }
        }

        // Default to production if all else fails (or localhost for safety if needed, but production is safer for redirect)
        // Ensure NO trailing slash

        // FIX: If origin is localhost, browser blocks redirect from public (Cardcom) to private (localhost).
        // Force production URL in this case to allow flow completion.
        if (origin && origin.includes('localhost')) {
            console.log('Localhost detected, forcing production URL for redirects');
            origin = 'https://app.metch.co.il';
        }

        const baseUrl = origin || 'https://app.metch.co.il';

        const successUrl = `${baseUrl}/payment-success?ref=${requestId}`;
        const errorUrl = `${baseUrl}/payment-error?ref=${requestId}`;
        const indicatorUrl = `${baseUrl}/api/payment-callback`;

        const requestBody = {
            TerminalNumber: parseInt(TERMINAL_NUMBER),
            ApiName: API_NAME,
            Password: API_PASSWORD, // This might be "PassWord" in some docs, but "Password" is standard for JSON API
            ReturnValue: requestId,
            Amount: parseFloat(amount),
            Name: customerName || 'Guest',
            Email: customerEmail,
            KodPeula: 1,
            Language: 'he',
            CoinId: 1,
            Items: [
                {
                    Description: productName,
                    Price: parseFloat(amount),
                    Quantity: 1,
                    ItemCode: 'ITEM-001'
                }
            ],
            SuccessRedirectUrl: successUrl,
            FailedRedirectUrl: errorUrl, // Changed from ErrorRedirectUrl based on docs
            WebHookUrl: indicatorUrl // Changed from IndicatorUrl based on docs
        };

        console.log(`Creating Low Profile transaction for ${amount} ILS. Terminal: ${TERMINAL_NUMBER}`);

        const response = await fetch(CARDCOM_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Cardcom API Error:', errorText);
            return new Response(JSON.stringify({
                success: false,
                message: `Cardcom API Error: ${response.status}`,
                debug: errorText
            }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200,
            });
        }

        const data = await response.json();


        if (data.ResponseCode !== 0) {
            console.error('Cardcom Logic Error:', data.Description);
            // Return 200
            return new Response(JSON.stringify({
                success: false,
                message: `Cardcom Error: ${data.Description}`,
                code: data.ResponseCode
            }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200,
            });
        }

        // data.LowProfileCode is the key we need. Check if it exists.
        // API returns "LowProfileId" in this version
        const lowProfileCode = data.LowProfileCode || data.lowProfileCode || data.LowProfileId;

        if (!lowProfileCode) {
            console.error('Missing LowProfileCode/Id in response:', data);
            return new Response(JSON.stringify({
                success: false,
                message: `Cardcom Error: Missing LowProfileCode`,
                debug: data,
                requestBody: { ...requestBody, Password: '***' },
            }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200,
            });
        }

        // Construct the Iframe URL
        // URL Format: https://secure.cardcom.solutions/External/lowProfileClearing/{TerminalNumber}.aspx?lowprofilecode={Code}&Lang=he
        const iframeUrl = `https://secure.cardcom.solutions/External/lowProfileClearing/${TERMINAL_NUMBER}.aspx?lowprofilecode=${lowProfileCode}&Lang=he`;

        return new Response(JSON.stringify({
            success: true,
            url: iframeUrl,
            lowProfileCode: lowProfileCode,
            requestId: requestId
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        })

    } catch (error) {
        console.error('Processing Error:', error)
        return new Response(JSON.stringify({
            success: false,
            message: error.message,
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200, // Changed from 400 to 200 to ensure client receives the JSON body
        })
    }
})
