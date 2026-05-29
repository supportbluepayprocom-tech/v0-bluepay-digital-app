================================================================================
                         STEP-BY-STEP TEST PROCEDURE
================================================================================

GOAL: Verify where the OTP flow is breaking

PREREQUISITES:
───────────────
- Modern browser (Chrome, Firefox, Safari, Edge)
- DevTools accessible (F12)
- Access to email inbox for test email


STEP-BY-STEP:
──────────────

1. PREPARE BROWSER
   ─────────────────
   □ Open your browser
   □ Press F12 to open DevTools
   □ Go to Console tab
   □ Go to Application tab → Clear all cookies and sessionStorage
   □ Go back to Console tab
   □ Keep DevTools open next to your app


2. NAVIGATE TO SIGNUP
   ──────────────────
   □ Go to http://localhost:3000/signup (or your app URL)
   □ You should see the CREATE ACCOUNT form
   □ Watch Console for any errors (should be empty)


3. FILL FORM
   ──────────
   □ Full Name field: Enter "Test User"
   □ Email field: Enter a test email (e.g., testotp@gmail.com)
   □ Watch Console (should still be empty at this point)


4. CLICK CREATE ACCOUNT
   ─────────────────────
   □ Click the white "CREATE ACCOUNT" button
   □ IMMEDIATELY watch Console for logs
   □ Expected console logs:
     [v0] signup: Storing user info and redirecting to verify-email
   
   If you see this log:
     ✓ Signup page is working correctly
     ✓ sessionStorage is being set
     ✓ Page will redirect
   
   If you DON'T see this log:
     ✗ JavaScript is broken or disabled
     ✗ Form submission is failing
     → Go back to Step 1 and check for errors


5. WAIT FOR REDIRECT
   ──────────────────
   □ Page should redirect to /verify-email within 1 second
   □ URL should change to /verify-email
   □ You should see the VERIFY EMAIL page
   
   If redirect doesn't happen:
     ✗ Navigation is broken
     → Check console for errors


6. WATCH CONSOLE AFTER PAGE LOADS
   ───────────────────────────────
   □ Page has loaded to /verify-email
   □ Watch Console for logs (within 1-2 seconds):
     [v0] verify-email: Page mounted, checking for signup email in sessionStorage
     [v0] verify-email: storedEmail: testotp@gmail.com storedName: Test User
     [v0] verify-email: Triggering OTP send for: testotp@gmail.com
     [v0] verify-email: Auto-sending OTP to: testotp@gmail.com
   
   These logs confirm:
     ✓ useEffect is running
     ✓ sessionStorage has correct values
     ✓ OTP send function is being called
   
   If you DON'T see logs after 2 seconds:
     ✗ useEffect is not running
     → Try hard refresh: Ctrl+Shift+R


7. CHECK NETWORK TAB
   ──────────────────
   □ Go to Network tab in DevTools
   □ Filter: type:xhr (to show fetch requests)
   □ Look for: POST /api/auth/send-otp
   □ If you see it:
     - Click on the request
     - Check Status: should be 200, 400, or 429
     - Click Response tab
     - Should see JSON with success or error
   
   Expected successful response (200):
     {
       "success": true,
       "message": "Verification code sent to your email",
       "maskedEmail": "te***@gmail.com"
     }
   
   Expected error response (4xx or 5xx):
     {
       "error": "error message here"
     }
   
   If request doesn't appear:
     ✗ fetch() is not being executed
     ✗ Network is blocked
     → Check browser console for fetch errors


8. CHECK SERVER LOGS (VERCEL)
   ──────────────────────────
   □ Go to Vercel Dashboard
   □ Open your project
   □ Go to Deployments → select current deployment → Runtime logs (or Functions)
   □ During the test, watch for logs like:
     [v0] send-otp API: Route handler called
     [v0] send-otp API: Email received: testotp@gmail.com
     [v0] send-otp API: Creating Supabase client...
     [v0] send-otp API: Supabase client created
     [v0] send-otp API: Calling supabase.auth.signInWithOtp with email: testotp@gmail.com
     [v0] send-otp API: Supabase response received
     [v0] send-otp API: Success: true
   
   These logs tell us:
     ✓ API endpoint is being hit
     ✓ Supabase client was initialized
     ✓ signInWithOtp was called
     ✓ Supabase responded
   
   If you see "Success: false" or an error:
     ✗ Supabase rejected the request
     → Check error message in logs
     → Verify Supabase configuration


9. WAIT FOR OTP EMAIL
   ────────────────────
   □ Go to your email inbox for testotp@gmail.com
   □ Check Inbox (wait 5-10 seconds)
   □ Check Spam/Promotions folder
   □ Look for email with subject like "Your OTP code" or similar
   
   If you receive OTP:
     ✓ Everything is working!
     ✓ Enter the 6-digit code on the verify page
     ✓ Should create account and redirect to dashboard
   
   If you DON'T receive OTP after 2 minutes:
     ✗ Supabase email provider not configured
     ✗ Email sending failed
     → Check Supabase Dashboard → Authentication → Users
     → Should show testotp@gmail.com user (even without OTP sent)


10. EXPECTED OUTCOMES
    ──────────────────
    
    Outcome A: Everything works (BEST CASE)
      ✓ Console shows all [v0] logs
      ✓ Network shows 200 response
      ✓ Server logs show Success: true
      ✓ Email received with OTP
      ✓ Enter OTP → Account created → Dashboard
    
    Outcome B: API called but no email (SUPABASE CONFIG ISSUE)
      ✓ Console shows all [v0] logs
      ✓ Network shows 200 response
      ✓ Server logs show Success: true
      ✗ Email NOT received
      → Supabase email provider needs configuration
    
    Outcome C: API not called (CODE ISSUE)
      ✗ Console doesn't show [v0] verify-email logs
      ✗ Network doesn't show POST /api/auth/send-otp
      ✗ useEffect not running
      → Check for JavaScript errors
    
    Outcome D: API called but error response (SUPABASE ERROR)
      ✓ Console shows [v0] logs
      ✓ Network shows 400/500 status
      ✓ Server logs show error message
      → Check error message for what's wrong


REPORTING RESULTS:
───────────────────

Share these screenshots:
1. Browser Console (all [v0] logs)
2. Network tab → POST /api/auth/send-otp → Response
3. Vercel Runtime logs (send-otp API)
4. Supabase Dashboard → Authentication → Users
5. Error message (if any)

This information will help identify exactly where the flow breaks.

================================================================================
