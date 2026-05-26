# BLUEPAY PRO V30 - Daily Reminder Email Edge Function

## Summary

A fully automated daily email reminder system has been created for BLUEPAY PRO V30 using Supabase Edge Functions and Resend API. This backend-only solution sends daily reminders to all registered users to purchase their BPC CODE and activate full platform access.

## What's Included

### 1. Edge Function Implementation
- **Location**: `/supabase/functions/daily-reminder-email/index.ts`
- **Runtime**: Deno (TypeScript)
- **Size**: ~190 lines of code
- **Features**:
  - ✅ Fetches all users from Supabase Auth
  - ✅ Sends emails via Resend API
  - ✅ Individual error handling (one failure doesn't crash the function)
  - ✅ JSON-based email sending
  - ✅ Comprehensive logging with `[v0]` prefix
  - ✅ Detailed response statistics
  - ✅ Environment variable validation

### 2. Configuration
- **Location**: `/supabase/functions/daily-reminder-email/supabase.json`
- **Runtime**: Deno
- **Region**: us-east-1

### 3. Documentation
- **Function README**: Explains how the function works, what it returns, and error handling
- **Setup Guide**: Complete deployment instructions with troubleshooting
- **This File**: Overview and quick reference

## Key Features

### Fully Automated
- Runs on a cron schedule (8:00 AM UTC daily)
- No manual intervention required
- Processes all users sequentially

### Reliable
- Error handling: One failed email doesn't crash the function
- Validates all environment variables before running
- Logs all operations for debugging
- Detailed error information in responses

### Efficient
- Uses Resend API for reliable email delivery
- Bearer token authentication
- JSON payloads for clean API integration
- Sequential processing to avoid rate limits

### Comprehensive Reporting
Returns detailed statistics:
```json
{
  "totalUsers": 150,
  "emailsSent": 148,
  "emailsFailed": 2,
  "results": [
    { "email": "user@example.com", "sent": true },
    { "email": "failed@example.com", "sent": false, "error": "..." }
  ],
  "timestamp": "2024-05-26T08:00:00.000Z"
}
```

## Required Environment Variables

Configure these in Supabase Project Settings → Functions → Secrets:

```
SUPABASE_URL                  = https://xxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY     = eyJhbGc...
RESEND_API_KEY                = re_xxxxx
```

## Email Template

**From**: `BLUEPAY PRO V30 <onboarding@resend.dev>`
**Subject**: `Reminder from BLUEPAY PRO V30`
**Body**: Professional reminder to purchase BPC CODE and access the dashboard

## Scheduling

**Cron Expression**: `0 8 * * *` (Every day at 8:00 AM UTC)

## Quick Start

### 1. Deploy Function
```bash
supabase functions deploy daily-reminder-email
```

### 2. Set Secrets
Go to Supabase Dashboard → Project Settings → Functions → Secrets and add the 3 required variables:
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `RESEND_API_KEY`

### 3. Create Cron Job
- Go to Supabase Dashboard → Functions → Manage Cron
- Click "Create Cron Job"
- Select `daily-reminder-email`
- Enter cron: `0 8 * * *`
- Save

### 4. Test
```bash
supabase functions invoke daily-reminder-email
```

## File Structure

```
supabase/
├── functions/
│   └── daily-reminder-email/
│       ├── index.ts              # Main function code
│       ├── supabase.json         # Configuration
│       └── README.md             # Function documentation
EDGE_FUNCTION_SETUP.md            # Deployment guide
```

## Architecture Overview

```
┌─────────────────┐
│ Supabase Cron   │
│  Scheduler      │
│ (8:00 AM UTC)   │
└────────┬────────┘
         │
         ▼
┌─────────────────────────┐
│ Edge Function           │
│ daily-reminder-email    │
└────────┬────────────────┘
         │
         ├─→ Fetch users (Supabase Auth)
         │
         ├─→ For each user:
         │   ├─→ Prepare email
         │   ├─→ Send via Mailgun
         │   └─→ Record result
         │
         ▼
    Return JSON
    with statistics
```

## Response Examples

### Success Response (200)
```json
{
  "totalUsers": 150,
  "emailsSent": 148,
  "emailsFailed": 2,
  "results": [
    {"email": "user1@example.com", "sent": true},
    {"email": "user2@example.com", "sent": false, "error": "Invalid email"}
  ],
  "timestamp": "2024-05-26T08:00:00.000Z"
}
```

### Error Response (400/500)
```json
{
  "error": "Missing required environment variables",
  "totalUsers": 0,
  "emailsSent": 0,
  "emailsFailed": 0,
  "results": [],
  "timestamp": "2024-05-26T08:00:00.000Z"
}
```

## Monitoring

### View Logs
1. Go to Supabase Dashboard → Functions → daily-reminder-email → Logs
2. Look for `[v0]` prefix entries
3. Monitor for errors and email statistics

### Common Metrics to Monitor
- `totalUsers`: Should match your user count
- `emailsSent`: Should be close to totalUsers
- `emailsFailed`: Should be minimal (0 is ideal)
- Execution time: Usually 1-5 minutes for 100-1000 users

## Troubleshooting

### Function Not Running
- Check Supabase Dashboard for cron job status
- Verify function deployed successfully
- Check function logs for errors

### Emails Not Sending
- Verify Mailgun API key is correct (Private key, not Public)
- Confirm Mailgun domain is verified
- Check Mailgun Activity Log for rejections
- Review function logs for Mailgun error responses

### Missing Environment Variables Error
- Go to Project Settings → Functions → Secrets
- Verify all 4 secrets are present
- Re-deploy function after setting secrets

## Performance Notes

- **Processing Time**: ~1-2 seconds per user on average
- **Expected Duration**: 5-10 minutes for 1,000 users
- **Mailgun Limits**: Check your Mailgun plan for API rate limits
- **Supabase Limits**: Edge Functions timeout after 10 minutes (sufficient for up to ~3,000 users)

## Support & Documentation

- **README**: `/supabase/functions/daily-reminder-email/README.md` - Technical details
- **Setup Guide**: `/EDGE_FUNCTION_SETUP.md` - Deployment instructions
- **Logs**: Supabase Dashboard → Functions → Logs

## Future Enhancements

Potential improvements:
- Batch processing for very large user bases (>10,000)
- A/B testing of email subjects/content
- User preference tracking (opt-in/opt-out)
- Analytics dashboard for email metrics
- Integration with other communication channels (SMS, push notifications)
