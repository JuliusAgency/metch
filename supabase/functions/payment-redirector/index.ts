
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

serve(async (req) => {
    const url = new URL(req.url);
    const search = url.search;

    // We want to redirect to the actual app's success page, 
    // but from the TOP window, breaking out of the Cardcom iframe.
    // We use app.metch.co.il as the default production target.
    const targetHost = "https://app.metch.co.il";
    const targetUrl = `${targetHost}/payment-success${search}`;

    console.log(`Redirector triggered. Target: ${targetUrl}`);

    const html = `
    <!DOCTYPE html>
    <html lang="he" dir="rtl">
      <head>
        <meta charset="utf-8">
        <title>מעביר אותך בחזרה...</title>
        <style>
          body { font-family: sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; background: #f0f7ff; color: #1e40af; }
          .loader { border: 4px solid #f3f3f3; border-top: 4px solid #3498db; border-radius: 50%; width: 30px; height: 30px; animation: spin 2s linear infinite; margin-bottom: 15px; }
          @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
          .container { text-align: center; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="loader"></div>
          <p>התשלום עבר בהצלחה!</p>
          <p>מעביר אותך בחזרה לאפליקציית Metch...</p>
          <p><a id="manualLink" href="${targetUrl}" target="_top">לחץ כאן אם לא הועברת אוטומטית</a></p>
        </div>
        <script>
          // The Magic: Break out of the iframe!
          setTimeout(() => {
            window.top.location.href = "${targetUrl}";
          }, 500);
        </script>
      </body>
    </html>
  `;

    return new Response(html, {
        headers: {
            "Content-Type": "text/html; charset=utf-8",
            "Access-Control-Allow-Origin": "*"
        },
    });
})
