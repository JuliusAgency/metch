import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

serve(async (req) => {
    const url = new URL(req.url);
    const params = url.searchParams;
    const pathParts = url.pathname.split('/').filter(Boolean);

    let status = 'success';
    let requestId: string | null = null;
    let targetHost = "https://app.metch.co.il"; // Default

    // 1. Path-based parsing
    const successIndex = pathParts.indexOf('success');
    const errorIndex = pathParts.indexOf('error');
    if (successIndex !== -1) { status = 'success'; requestId = pathParts[successIndex + 1]; }
    else if (errorIndex !== -1) { status = 'error'; requestId = pathParts[errorIndex + 1]; }

    // 2. Query param fallback
    if (!requestId) requestId = params.get('ref') || params.get('ReturnValue') || params.get('lowprofilecode');
    if (params.has('status')) status = params.get('status')!;

    console.log(`REDIRECTOR: requestId=${requestId}, status=${status}`);

    // 3. Dynamic Origin Lookup
    if (requestId) {
        try {
            const supabaseAdmin = createClient(
                Deno.env.get('SUPABASE_URL') ?? '',
                Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
            );
            const { data: txn } = await supabaseAdmin
                .from('Transaction')
                .select('metadata')
                .eq('metadata->>requestId', requestId)
                .maybeSingle();

            if (txn?.metadata?.origin) {
                targetHost = txn.metadata.origin;
                console.log(`Detected Dynamic Origin: ${targetHost}`);
            }
        } catch (e) {
            console.error("Origin lookup failed", e);
        }
    }

    // 4. Pass through ALL incoming search params from Cardcom
    const finalParams = new URLSearchParams(params);
    if (requestId && !finalParams.has('ref')) {
        finalParams.set('ref', requestId);
    }

    const targetUrl = `${targetHost}/payment-${status}?${finalParams.toString()}`;
    console.log(`REDIRECTOR: Final Redirect to ${targetUrl}`);

    return new Response(null, {
        status: 302,
        headers: {
            "Location": targetUrl,
            "Cache-Control": "no-cache, no-store, must-revalidate"
        },
    });
})
