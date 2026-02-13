import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
        const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        // 1. Check if current time is valid for sending (Israel timezone)
        const now = new Date();
        const israelTime = new Intl.DateTimeFormat('en-US', {
            timeZone: 'Asia/Jerusalem',
            hour: 'numeric',
            hour12: false,
            weekday: 'short',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        });

        const parts = israelTime.formatToParts(now);
        const hour = parseInt(parts.find(p => p.type === 'hour')?.value || '0');
        const weekday = parts.find(p => p.type === 'weekday')?.value;

        // Check if Friday or Saturday (Shabbat)
        if (weekday === 'Fri' || weekday === 'Sat') {
            console.log('Skipping: Shabbat (Friday/Saturday)');
            return new Response(
                JSON.stringify({ message: 'Skipped: Shabbat' }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
            );
        }

        // Check if between 8 AM and 10 PM
        if (hour < 8 || hour >= 22) {
            console.log(`Skipping: Outside allowed hours (current hour: ${hour})`);
            return new Response(
                JSON.stringify({ message: `Skipped: Outside allowed hours (${hour}:00)` }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
            );
        }

        // 2. Calculate the date 14 days ago
        const fourteenDaysAgo = new Date();
        fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);
        fourteenDaysAgo.setHours(0, 0, 0, 0);

        const fifteenDaysAgo = new Date();
        fifteenDaysAgo.setDate(fifteenDaysAgo.getDate() - 15);
        fifteenDaysAgo.setHours(0, 0, 0, 0);

        // 3. Query for job seekers who last logged in exactly 14 days ago
        const { data: inactiveUsers, error: queryError } = await supabase
            .from('UserProfile')
            .select('id, email, full_name, phone, last_login_date')
            .eq('user_type', 'job_seeker')
            .gte('last_login_date', fifteenDaysAgo.toISOString())
            .lt('last_login_date', fourteenDaysAgo.toISOString())
            .not('phone', 'is', null);

        if (queryError) {
            throw new Error(`Query error: ${queryError.message}`);
        }

        console.log(`Found ${inactiveUsers?.length || 0} inactive users`);

        const results = [];

        // 4. For each inactive user, check if we've already sent this notification
        for (const user of inactiveUsers || []) {
            try {
                // Check if notification was already sent in the last 14 days
                const { data: existingActions } = await supabase
                    .from('UserAction')
                    .select('created_date')
                    .eq('user_id', user.id)
                    .eq('action_type', 'inactive_user_reminder_sent')
                    .gte('created_date', fifteenDaysAgo.toISOString())
                    .limit(1);

                if (existingActions && existingActions.length > 0) {
                    console.log(`Skipping user ${user.email}: notification already sent recently`);
                    results.push({ user: user.email, status: 'skipped', reason: 'already_sent' });
                    continue;
                }

                // 5. Send WhatsApp message
                const userName = user.full_name || 'משתמש יקר';
                const message = `היי ${userName}, 

שמנו לב שלא התחברת לחשבון שלך ב-Metch בזמן האחרון, במהלך התקופה הזו ייתכן שקיבלת התאמות למשרות ופניות ממעסיקים.
כניסה קצרה לדשבורד מאפשרת לעבור על הפניות, להגיב בזמן ולקדם את תהליך הגיוס שלכם.`;

                // Call the send-whatsapp function
                const { data: whatsappResult, error: whatsappError } = await supabase.functions.invoke('send-whatsapp', {
                    body: {
                        phoneNumber: user.phone,
                        message: message
                    }
                });

                if (whatsappError) {
                    console.error(`WhatsApp error for ${user.email}:`, whatsappError);
                    results.push({ user: user.email, status: 'failed', error: whatsappError.message });
                    continue;
                }

                // 6. Log the action
                await supabase.from('UserAction').insert({
                    user_id: user.id,
                    user_email: user.email,
                    action_type: 'inactive_user_reminder_sent',
                    created_date: new Date().toISOString(),
                    additional_data: {
                        last_login_date: user.last_login_date,
                        days_inactive: 14
                    }
                });

                console.log(`Successfully sent reminder to ${user.email}`);
                results.push({ user: user.email, status: 'sent' });

            } catch (userError) {
                console.error(`Error processing user ${user.email}:`, userError);
                results.push({ user: user.email, status: 'error', error: userError.message });
            }
        }

        return new Response(
            JSON.stringify({
                success: true,
                processed: results.length,
                results: results
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        );

    } catch (error) {
        console.error('Function error:', error);
        return new Response(
            JSON.stringify({ error: error.message }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        );
    }
});
