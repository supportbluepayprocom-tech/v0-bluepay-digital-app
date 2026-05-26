# Daily Reminder Email System - Setup Guide

## Overview

This system automatically sends daily reminder emails to all registered BLUEPAY PRO V30 users at 8:00 AM every day using Supabase Edge Functions, Resend API, and pg_cron.

## Prerequisites

1. Supabase project with Edge Functions enabled
2. Resend account with API key (Free plan works!)

## Resend Free Plan Limitations

This setup is configured to work with Resend's **Free Plan**:

- **Sender email**: `onboarding@resend.dev` (the only allowed sender on free plan)
- **Daily limit**: 100 emails/day
- **Monthly limit**: 3,000 emails/month
- **No custom domain required**

If you have more than 100 users, consider upgrading to Resend's Pro plan ($20/month) which allows:
- Custom verified domains
- 50,000 emails/month
- Higher daily limits

---

## Step 1: Set Environment Variables in Supabase

Go to your Supabase Dashboard > Project Settings > Edge Functions and add:

```
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxx
```

Note: `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are automatically available in Edge Functions.

---

## Step 2: Deploy the Edge Function

### Option A: Using Supabase CLI

```bash
# Install Supabase CLI if not installed
npm install -g supabase

# Login to Supabase
supabase login

# Link your project
supabase link --project-ref your-project-ref

# Deploy the function
supabase functions deploy daily-reminder-email --no-verify-jwt
```

### Option B: Manual Deployment via Dashboard

1. Go to Supabase Dashboard > Edge Functions
2. Click "Create a new function"
3. Name it: `daily-reminder-email`
4. Copy the contents of `supabase/functions/daily-reminder-email/index.ts`
5. Deploy

---

## Step 3: Set Up Cron Job (pg_cron)

Run this SQL in the Supabase SQL Editor to schedule the daily reminder at 8:00 AM UTC:

```sql
-- Enable pg_cron extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Enable pg_net extension for HTTP requests (if not already enabled)
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Grant usage to postgres role
GRANT USAGE ON SCHEMA cron TO postgres;

-- Create the cron job to run at 8:00 AM UTC every day
SELECT cron.schedule(
  'daily-reminder-email-job',           -- Job name
  '0 8 * * *',                          -- Cron expression: 8:00 AM UTC daily
  $$
  SELECT
    net.http_post(
      url := 'https://your-project-ref.supabase.co/functions/v1/daily-reminder-email',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer YOUR_SUPABASE_SERVICE_ROLE_KEY'
      ),
      body := '{}'::jsonb
    ) AS request_id;
  $$
);
```

### Important: Replace placeholders
- Replace `your-project-ref` with your actual Supabase project reference
- Replace `YOUR_SUPABASE_SERVICE_ROLE_KEY` with your actual service role key

---

## Step 4: Verify Setup

### Check Cron Jobs

```sql
-- List all scheduled jobs
SELECT * FROM cron.job;

-- Check job execution history
SELECT * FROM cron.job_run_details 
ORDER BY start_time DESC 
LIMIT 10;
```

### Test the Function Manually

```bash
curl -X POST 'https://your-project-ref.supabase.co/functions/v1/daily-reminder-email' \
  -H 'Authorization: Bearer YOUR_SERVICE_ROLE_KEY' \
  -H 'Content-Type: application/json'
```

---

## Step 5: Resend Domain Configuration (Optional - For Paid Plan)

If you upgrade to Resend's paid plan, you can use a custom domain:

1. Go to Resend Dashboard > Domains
2. Add your domain (e.g., `bluepaypro.com`)
3. Add the required DNS records (SPF, DKIM, DMARC)
4. Update the `from` address in the Edge Function:
   ```typescript
   from: 'BLUEPAY PRO V30 <noreply@yourdomain.com>',
   ```

**For free plan users**: No action needed! The function is already configured to use `onboarding@resend.dev`.

---

## Modifying the Schedule

To change the time (e.g., 9:00 AM instead of 8:00 AM):

```sql
-- First, remove the existing job
SELECT cron.unschedule('daily-reminder-email-job');

-- Then create a new one with different time
SELECT cron.schedule(
  'daily-reminder-email-job',
  '0 9 * * *',   -- 9:00 AM UTC
  $$ ... $$      -- Same HTTP request
);
```

### Common Cron Expressions

| Schedule              | Cron Expression |
|-----------------------|-----------------|
| Every day at 8:00 AM  | `0 8 * * *`     |
| Every day at 9:00 AM  | `0 9 * * *`     |
| Every 12 hours        | `0 */12 * * *`  |
| Every Monday at 8 AM  | `0 8 * * 1`     |

---

## Stopping the Daily Emails

```sql
-- Remove the scheduled job
SELECT cron.unschedule('daily-reminder-email-job');
```

---

## Troubleshooting

### Check Edge Function Logs

```bash
supabase functions logs daily-reminder-email
```

### Common Issues

1. **No emails sent**: Check that users have confirmed emails (`email_confirmed_at` is not null)
2. **Resend errors**: Verify API key and domain verification status
3. **Cron not running**: Check pg_cron extension is enabled and job is scheduled

---

## Environment Variables Summary

| Variable                    | Location            | Description                    |
|-----------------------------|---------------------|--------------------------------|
| `RESEND_API_KEY`            | Supabase Edge Env   | Resend API key for sending     |
| `SUPABASE_URL`              | Auto-injected       | Your Supabase project URL      |
| `SUPABASE_SERVICE_ROLE_KEY` | Auto-injected       | Service role key for admin API |

---

## Security Notes

- The Edge Function uses the service role key to access all users via `auth.admin.listUsers()`
- Only users with confirmed emails receive reminders
- The function is deployed with `--no-verify-jwt` since it's called by the cron job, not authenticated users
- The cron job uses the service role key for authorization
