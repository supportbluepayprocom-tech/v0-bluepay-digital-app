================================================================================
                    OTP FLOW DIAGNOSTICS & DEBUGGING GUIDE
================================================================================

ISSUE:
──────
OTP is not being sent. Supabase Auth logs show no /otp requests or email events.

ROOT CAUSE ANALYSIS:
─────────────────────

The flow should be:
1. User fills signup form (name, email)
2. Clicks "CREATE ACCOUNT"
3. Data stored in sessionStorage
4. Redirect to /verify-email
5. Page mounts → useEffect runs
6. useEffect calls sendOtpToEmail()
7. sendOtpToEmail calls fetch('/api/auth/send-otp')
8. API handler receives request
9. API calls supabase.auth.signInWithOtp()
10. Supabase sends OTP to email

If Supabase logs show NO OTP requests, it means step 9 is NOT happening.
This could be because steps 1-8 are failing silently.

DIAGNOSTIC STEPS:
──────────────────

Step 1: Check Browser Console
─────────────────────────────

Open browser DevTools (F12) → Console tab

Expected logs when you click CREATE ACCOUNT:
  [v0] signup: Storing user info and redirecting to verify-email

Expected logs when /verify-email page loads:
  [v0] verify-email: Page mounted, checking for signup email in sessionStorage
  [v0] verify-email: storedEmail: {email} storedName: {name}
  [v0] verify-email: Triggering OTP send for: {email}
  [v0] verify-email: Auto-sending OTP to: {email}

If you DON'T see these logs:
  → The code is not running at all
  → Check: Is JavaScript disabled?
  → Check: Did page actually load?
  → Try: Hard refresh (Ctrl+Shift+R)

Step 2: Check Network Tab
──────────────────────────

Open browser DevTools (F12) → Network tab

Click CREATE ACCOUNT, watch for:
  • POST /api/auth/send-otp request
  • Check Status: should be 200 or 429
  • Check Response: should have data or error message

If you DON'T see the request:
  → The fetch() call never executed
  → Check console for errors
  → Verify sessionStorage has values

If status is not 200:
  → Check Response tab for error message
  → Look for specific error from Supabase

Step 3: Check Server Logs
──────────────────────────

Watch Vercel project logs during signup attempt.

Expected server logs:
  [v0] send-otp API: Route handler called
  [v0] send-otp API: Email received: {email}
  [v0] send-otp API: Creating Supabase client...
  [v0] send-otp API: Supabase client created
  [v0] send-otp API: Calling supabase.auth.signInWithOtp with email: {email}
  [v0] send-otp API: Supabase response received
  [v0] send-otp API: Success: true/false
  [v0] send-otp API: Error: error message or undefined

If "Route handler called" doesn't appear:
  → API endpoint is not being reached
  → Request is being blocked before reaching server
  → Check: CORS issues, network issues, fetch blocked

If "Calling supabase.auth.signInWithOtp" appears but then error:
  → The Supabase call is being made
  → But it's failing
  → Check: Supabase config, API keys, project setup

If "Success: true" appears:
  → Code is working correctly
  → Supabase OTP was sent
  → But user didn't receive email
  → Check: Spam folder, email provider, Supabase SMTP config


VERIFICATION CHECKLIST:
────────────────────────

Before debugging further, verify:

□ Supabase project is active (not paused)
□ Authentication is enabled in Supabase
□ Email provider is configured (Supabase built-in or custom SMTP)
□ SUPABASE_URL environment variable is set correctly
□ SUPABASE_ANON_KEY environment variable is set correctly
□ Browser console shows no errors on page load
□ sessionStorage shows email after CREATE ACCOUNT click


DEBUGGING FLOW CHART:
──────────────────────

Is signup page working? (Can you enter data?)
  NO → Fix form validation
  YES ↓

Does /verify-email page load?
  NO → Check redirect logic
  YES ↓

Do you see browser console logs [v0] verify-email?
  NO → Console.log not running, page issues
  YES ↓

Do you see [v0] verify-email: Auto-sending OTP?
  NO → useEffect not triggering
  YES ↓

Do you see Network POST /api/auth/send-otp?
  NO → fetch() not executing
  YES ↓

What is response status?
  200 → Check: Did you get OTP email?
  429 → Rate limit: Wait 2-3 minutes
  400/500 → Server error in response


IF SUPABASE CALL IS BEING MADE BUT NOT SHOWING IN SUPABASE LOGS:
─────────────────────────────────────────────────────────────

This means:
1. Our API IS calling supabase.auth.signInWithOtp()
2. Supabase IS responding
3. But Supabase logs don't show it

Possible reasons:
• Supabase email provider not configured
• Supabase project has email sending disabled
• Different Supabase project keys used
• Email provider quota exceeded


COMPLETE TEST PROCEDURE:
────────────────────────

1. Open browser DevTools (F12)
2. Go to Application tab
3. Clear all cookies and sessionStorage
4. Go to Console tab
5. Go to Network tab
6. Navigate to /signup
7. Enter: Name = "Test User", Email = "test123@gmail.com"
8. Click CREATE ACCOUNT
9. Check console for [v0] logs
10. Check Network for /api/auth/send-otp
11. Watch for page redirect to /verify-email
12. Check console for [v0] verify-email logs
13. Go to Supabase Dashboard
14. Check Authentication → Users for "test123@gmail.com"
15. Check if user was created
16. Check if OTP was sent (look for pending MFA or auth events)


COMMON ISSUES:
───────────────

Issue: Page redirects but no API call
  Solution: Check useEffect dependencies, ensure sessionStorage has email

Issue: API called but 500 error
  Solution: Check Supabase client initialization, API keys

Issue: 200 response but no email received
  Solution: Check Supabase email provider config, check spam folder

Issue: 429 rate limit
  Solution: Wait 2-3 minutes or use different email

Issue: Supabase shows user created but no OTP in logs
  Solution: Supabase email service may be misconfigured


NEXT STEPS:
────────────

1. Run complete test procedure above
2. Share console logs (screenshot or paste)
3. Share Network response body
4. Share Supabase Dashboard logs (if accessible)
5. Verify Supabase project settings:
   - Go to Supabase Dashboard
   - Project Settings → Auth
   - Check: Email Auth enabled
   - Check: OTP enabled
   - Check: Email Provider configured (should show Supabase or SMTP)

With this information, we can identify exactly where the flow breaks.

================================================================================
