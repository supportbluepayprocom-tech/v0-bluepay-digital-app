# Daily Reminder Email Edge Function

## Overview
This Supabase Edge Function sends automated daily reminder emails to all registered users in the BLUEPAY PRO V30 platform using Resend as the email service provider.

## Function Details

### Endpoint
- **Name**: `daily-reminder-email`
- **Runtime**: Deno (TypeScript)
- **HTTP Method**: POST (triggered by Supabase Scheduler)

### Environment Variables Required
The following environment variables must be configured in Supabase Secrets:

```
SUPABASE_URL              - Your Supabase project URL
SUPABASE_SERVICE_ROLE_KEY - Service role key for admin access
RESEND_API_KEY            - Resend API key for authentication
```

### How It Works

1. **Authenticate with Supabase**: Uses the service role key to initialize an admin client
2. **Fetch All Users**: Retrieves all registered users from Supabase Auth using `listUsers()`
3. **Send Emails**: For each user with an email:
   - Prepares the reminder email content
   - Sends via Resend API using JSON payload
   - Handles errors individually without crashing
4. **Return Statistics**: Returns a JSON response with:
   - Total users processed
   - Number of emails sent successfully
   - Number of emails failed
   - Detailed results for each email attempt
   - Timestamp of execution

### Email Template

**From**: `BLUEPAY PRO V30 <onboarding@resend.dev>`
**Subject**: `Reminder from BLUEPAY PRO V30`
**Body**:
```
Hello from BLUEPAY PRO V30.

This is your daily reminder to purchase your BPC CODE and activate full platform access.

Login to your dashboard to continue.

Best regards,
BLUEPAY PRO V30 Support Team
```

### Authentication

- **Supabase**: Uses service role key for admin API access
- **Resend**: Uses Bearer token authentication with the Resend API key

### Error Handling

- ✅ Validates all required environment variables at startup
- ✅ Catches errors for individual email sends to prevent function crash
- ✅ Logs all operations and errors for debugging
- ✅ Returns detailed error information in the response
- ✅ Each failed email is recorded in results but doesn't stop processing other emails

### Response Format

Success (200):
```json
{
  "totalUsers": 150,
  "emailsSent": 148,
  "emailsFailed": 2,
  "results": [
    {
      "email": "user@example.com",
      "sent": true
    },
    {
      "email": "invalid@example.com",
      "sent": false,
      "error": "HTTP 400: Bad Request"
    }
  ],
  "timestamp": "2024-05-26T08:00:00.000Z"
}
```

Error (400/500):
```json
{
  "error": "Error message",
  "totalUsers": 0,
  "emailsSent": 0,
  "emailsFailed": 0,
  "results": [],
  "timestamp": "2024-05-26T08:00:00.000Z"
}
```

## Scheduling

This function is designed to be run via Supabase Scheduler with a cron expression:

**Cron Expression**: `0 8 * * *`
**Description**: Run every day at 8:00 AM UTC

### Setup Instructions

1. Navigate to Supabase Dashboard
2. Go to Functions → Manage Cron
3. Create a new scheduled job:
   - **Function**: Select `daily-reminder-email`
   - **Cron Expression**: `0 8 * * *`
   - **Time Zone**: UTC

## Deployment

1. Deploy the function to Supabase:
```bash
supabase functions deploy daily-reminder-email
```

2. Set environment variables in Supabase:
   - Go to Project Settings → Functions → Secrets
   - Add: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `RESEND_API_KEY`

3. Set up the cron scheduler (see above)

## Testing

To test the function locally or manually:

```bash
# Via Supabase CLI
supabase functions invoke daily-reminder-email

# Via API (requires auth)
curl -X POST https://<project-id>.supabase.co/functions/v1/daily-reminder-email \
  -H "Authorization: Bearer <anon-key>"
```

## Logging

All operations are logged with `[v0]` prefix for easy debugging:
- `[v0] Starting daily reminder email function`
- `[v0] Fetching all users from Supabase Auth`
- `[v0] Found X total users`
- `[v0] Sending reminder email to: user@example.com`
- `[v0] Email sent successfully to user@example.com`
- `[v0] Daily reminder email function completed`

Check Supabase Function Logs for detailed output.

## Important Notes

- The function processes users sequentially to avoid rate limiting
- Each email send is independent; failures don't affect other emails
- The function may take several minutes if there are many users
- Resend has rate limits; ensure API key is configured correctly
- The function uses the Resend sandbox domain `onboarding@resend.dev` by default
