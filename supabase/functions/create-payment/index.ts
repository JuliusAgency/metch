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
            Amount,
            CardNumber,
            CardExpirationMMYY,
            CVV2,
            CardOwnerName,
            CardOwnerEmail,
            CardOwnerIdentityNumber
        } = await req.json()

        // Retrieve credentials from environment variables
        const TERMINAL_NUMBER = Deno.env.get('CARDCOM_TERMINAL_NUMBER') || '182161';
        const API_USERNAME = Deno.env.get('CARDCOM_API_USERNAME') || 'fjIcB8aXqC84wxbBtRYz';
        const API_PASSWORD = Deno.env.get('CARDCOM_API_PASSWORD'); // Optional

        // Cardcom API Endpoint (Direct2 interface for server-to-server with raw card data)
        // Note: Typically requires PCI compliance or special terminal configuration.
        // If using Low Profile token, endpoint would be different. assuming Direct2 based on data provided.
        const CARDCOM_API_URL = 'https://secure.cardcom.solutions/Interface/Direct2.aspx';

        // Sanitize Card Number
        const sanitizedCardNumber = CardNumber.replace(/\D/g, '');

        // Construct request body (x-www-form-urlencoded format for Direct2)
        const params = new URLSearchParams();
        params.append('TerminalNumber', TERMINAL_NUMBER);
        params.append('UserName', API_USERNAME);
        if (API_PASSWORD) params.append('UserPassword', API_PASSWORD);

        params.append('SumToBill', Amount);
        params.append('CardNumber', sanitizedCardNumber);
        params.append('CardValidityMonth', CardExpirationMMYY.substring(0, 2));
        params.append('CardValidityYear', CardExpirationMMYY.substring(2, 4));
        params.append('CVV2', CVV2);

        if (CardOwnerName) params.append('CardOwnerName', CardOwnerName);
        if (CardOwnerEmail) params.append('CardOwnerEmail', CardOwnerEmail);
        if (CardOwnerIdentityNumber) params.append('CardOwnerIdentityNumber', CardOwnerIdentityNumber);

        // Call Cardcom
        console.log(`Sending payment request to Cardcom: Amount=${Amount}, Card ending in ${sanitizedCardNumber.slice(-4)}`);

        const response = await fetch(CARDCOM_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: params.toString()
        });

        const responseText = await response.text();
        console.log('Cardcom Response:', responseText);

        // Parse Cardcom Direct2 Response (Format: ResponseCode;Description;TransactionId;...)
        const parts = responseText.split(';');
        const responseCode = parts[0];
        const description = parts[1];

        // Check for success (0 or 000)
        if (responseCode === '0' || responseCode === '000') {
            // Success
            return new Response(JSON.stringify({
                success: true,
                message: 'Transaction successful',
                data: {
                    responseCode,
                    description,
                    raw: responseText
                }
            }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200,
            })
        } else {
            // Failure - Return 200 with success: false to allow client to read error
            console.error('Cardcom Failed:', responseText);
            return new Response(JSON.stringify({
                success: false,
                message: description || 'Transaction failed',
                code: responseCode,
                raw: responseText
            }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200, // Changed from 400 to 200
            })
        }

    } catch (error) {
        console.error('Processing Error:', error)
        // Return 200 even for internal errors to pass message to client
        return new Response(JSON.stringify({
            success: false,
            message: `Internal Error: ${error.message}`,
            error: error.message
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200, // Changed from 500 to 200
        })
    }
})
