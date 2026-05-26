# Daily Reminder Email Edge Function - Deployment & Setup Guide

## Prerequisites

1. Supabase project set up and running
2. Resend account (https://resend.com)
3. Supabase CLI installed (`brew install supabase` or `npm install -g @supabase/cli`)
4. Deno installed (comes with Supabase CLI)

## Step 1: Gather Required Information

### Supabase
- `SUPABASE_URL`: From Project Settings → API → Project URL
- `SUPABASE_SERVICE_ROLE_KEY`: From Project Settings → API → Service Role (secret)

### Resend
- `RESEND_API_KEY`: From Resend Dashboard → API Keys → Copy your API key

## Step 2: Deploy the Edge Function

### Option A: Using Supabase CLI

```bash
# Navigate to project directory
cd /path/to/bluepay-v30-project

# Login to Supabase
supabase login

# Link to your Supabase project
supabase link --project-ref your-project-ref

# Deploy the function
supabase functions deploy daily-reminder-email
```

### Option B: Using GitHub Actions (CI/CD)

Add to your GitHub workflow:
```yaml
- name: Deploy Edge Functions
  run: supabase functions deploy daily-reminder-email
```

## Step 3: Configure Secrets

### Via Supabase Dashboard

1. Go to **Project Settings** → **Functions** → **Secrets**
2. Click **New Secret** and add:

```
SUPABASE_URL = https://xxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY = eyJhbGc...
RESEND_API_KEY = re_xxxxx
```

### Via Supabase CLI

```bash
supabase secrets set SUPABASE_URL="https://xxxxx.supabase.co"
supabase secrets set SUPABASE_SERVICE_ROLE_KEY="eyJhbGc..."
supabase secrets set RESEND_API_KEY="re_xxxxx"
```

## Step 4: Test the Function

### Test via Supabase Dashboard

1. Go to **Functions** → **daily-reminder-email**
2. Click **Test Function** button
3. Click **Execute** (no request body needed)
4. View response with email statistics

### Test via CLI

```bash
supabase functions invoke daily-reminder-email
```

### Test via cURL

```bash
curl -X POST https://<project-id>.supabase.co/functions/v1/daily-reminder-email \
  -H "Authorization: Bearer $(supabase access-token)" \
  -H "Content-Type: application/json"
```

## Step 5: Set Up Scheduling (Cron Job)

### Via Supabase Dashboard

1. Go to **Functions** → **Manage Cron**
2. Click **Create Cron Job**
3. Configure:
   - **Function**: `daily-reminder-email`
   - **Cron Expression**: `0 8 * * *`
   - **Timezone**: UTC
4. Click **Save**

### Cron Expression Format

`0 8 * * *` breaks down as:
- `0` - Minute (0)
- `8` - Hour (8:00 AM UTC)
- `*` - Day of month (every day)
- `*` - Month (every month)
- `*` - Day of week (every day)

### Alternative Cron Expressions

- Every day at 8:00 AM UTC: `0 8 * * *`
- Every day at 12:00 PM UTC: `0 12 * * *`
- Every Monday at 8:00 AM UTC: `0 8 * * 1`
- Every 6 hours: `0 */6 * * *`

## Step 6: Monitor Execution

### View Logs

1. Go to **Functions** → **daily-reminder-email** → **Logs**
2. Look for entries with `[v0]` prefix
3. Monitor for errors or failures

### Set Up Alerts (Optional)

Configure Supabase alerts for function failures:
1. Project Settings → **Notifications**
2. Set up email alerts for function errors

## Troubleshooting

### Function Not Triggering

- Check cron expression in Supabase Dashboard
- Verify function was successfully deployed
- Check Supabase status page for outages

### Emails Not Sending

1. Verify `RESEND_API_KEY` is correct and active
2. Check Resend dashboard for rate limits
3. Check function logs for Resend error responses
4. Ensure API key has permission to send emails
5. Verify recipient emails are valid email addresses

### "Missing environment variables" Error

- Go to Project Settings → Functions → Secrets
- Verify all 4 secrets are set: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `MAILGUN_API_KEY`, `MAILGUN_DOMAIN`
- Re-deploy the function after setting secrets

### Authentication Failed Error

- Verify `SUPABASE_SERVICE_ROLE_KEY` is correct (not the anon key)
- Check the key hasn't been rotated recently
- Ensure project URL matches `SUPABASE_URL`

### Mailgun 401 Error

- Verify `MAILGUN_API_KEY` is the **Private** API key (not Public)
- Check key format: should start with `key-`
- Ensure API key is active and not revoked

## Monitoring & Maintenance

### Weekly Checklist

- [ ] Check function logs for errors
- [ ] Verify emails were sent to sample users
- [ ] Monitor Mailgun dashboard for bounce/spam reports
- [ ] Check Supabase function execution times

### Monthly Tasks

- [ ] Review email delivery metrics
- [ ] Update email template if needed (redeploy function)
- [ ] Verify cron job is still scheduled
- [ ] Check for API key expiration dates

## Production Best Practices

1. **Monitor Costs**: Mailgun charges per email sent. Monitor usage.
2. **Error Handling**: Review failed emails and adjust Mailgun configuration.
3. **Scaling**: For > 10,000 users, consider batch processing.
4. **Compliance**: Ensure GDPR/privacy compliance for email sending.
5. **Backups**: Keep a record of the function code in version control.

## Support

For issues:
1. Check Supabase Function Logs
2. Review Mailgun Activity Log
3. Test function manually to diagnose
4. Refer to README.md for technical details

## Undeployment

To remove the function:

```bash
supabase functions delete daily-reminder-email
```

This will:
- Remove the function from Supabase
- Remove associated cron jobs
- Keep the code in your repository for redeploy if needed
