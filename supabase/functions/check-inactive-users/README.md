# Inactive User Re-engagement - Deployment Instructions

## Overview
This Edge Function sends WhatsApp notifications to job seekers who haven't logged in for exactly 14 days, encouraging them to check their dashboard for potential job matches and employer messages.

## Features
- ✅ Queries users with exactly 14 days of inactivity
- ✅ Time validation (only 08:00-22:00, Sunday-Thursday)
- ✅ Personalized messages with user's name
- ✅ Prevents duplicate notifications using UserAction tracking
- ✅ Comprehensive logging and error handling

## Deployment Steps

### 1. Deploy the Edge Function

```bash
# Navigate to your project directory
cd "c:\Users\nagos\OneDrive\שולחן העבודה\new project - metch29-12\metch"

# Deploy the function to Supabase
npx supabase functions deploy check-inactive-users
```

### 2. Set Up Cron Job (Scheduled Execution)

You need to configure this function to run automatically every day. There are two options:

#### Option A: Supabase Cron (Recommended if available)
If your Supabase plan supports pg_cron:

```sql
-- Run daily at 10:00 AM Israel time (08:00 UTC)
SELECT cron.schedule(
  'check-inactive-users-daily',
  '0 8 * * *',
  $$
  SELECT net.http_post(
    url := 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/check-inactive-users',
    headers := '{"Authorization": "Bearer YOUR_ANON_KEY"}'::jsonb
  );
  $$
);
```

#### Option B: External Cron Service
Use a service like:
- **Cron-job.org** (free)
- **EasyCron**
- **GitHub Actions**

Example GitHub Actions workflow (`.github/workflows/check-inactive-users.yml`):

```yaml
name: Check Inactive Users
on:
  schedule:
    - cron: '0 8 * * *'  # 08:00 UTC daily
  workflow_dispatch:  # Allow manual trigger

jobs:
  check-inactive-users:
    runs-on: ubuntu-latest
    steps:
      - name: Call Supabase Function
        run: |
          curl -X POST \
            https://YOUR_PROJECT_REF.supabase.co/functions/v1/check-inactive-users \
            -H "Authorization: Bearer ${{ secrets.SUPABASE_ANON_KEY }}"
```

### 3. Test the Function

```bash
# Test manually via curl
curl -X POST \
  https://YOUR_PROJECT_REF.supabase.co/functions/v1/check-inactive-users \
  -H "Authorization: Bearer YOUR_ANON_KEY"
```

### 4. Monitor Logs

```bash
# View function logs
npx supabase functions logs check-inactive-users --tail
```

## Database Requirements

Ensure your `UserProfile` table has:
- `last_login_date` (timestamp) - Updated on each user login
- `user_type` (text) - To filter job seekers
- `phone` (text) - For WhatsApp notifications

The `UserAction` table should support:
- `action_type` = 'inactive_user_reminder_sent'

## Time Validation Logic

The function automatically skips execution if:
- Current day is Friday or Saturday (Shabbat)
- Current hour is before 08:00 or after 22:00 (Israel time)

## Notification Tracking

Each sent notification is logged in `UserAction` to prevent:
- Duplicate messages to the same user
- Spam if the function runs multiple times

## Expected Behavior

1. Function runs daily at scheduled time
2. Checks if current time is valid (not Shabbat, not night hours)
3. Queries for users with `last_login_date` between 14-15 days ago
4. For each user:
   - Checks if notification was already sent
   - Sends personalized WhatsApp message
   - Logs action in database
5. Returns summary of processed users

## Troubleshooting

**Issue**: No users found
- Check if `last_login_date` is being updated on user login
- Verify the date calculation logic

**Issue**: WhatsApp not sending
- Verify Green API credentials in Supabase secrets
- Check `send-whatsapp` function is deployed and working

**Issue**: Function runs during Shabbat
- Check server timezone configuration
- Verify the time validation logic

## Next Steps

After deployment, you should:
1. ✅ Deploy the function
2. ✅ Set up the cron schedule
3. ✅ Test with a dummy user (set their `last_login_date` to 14 days ago)
4. ✅ Monitor logs for the first few days
5. ✅ Verify `UserAction` records are being created
