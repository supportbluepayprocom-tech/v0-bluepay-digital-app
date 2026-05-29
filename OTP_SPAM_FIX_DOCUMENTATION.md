# Supabase OTP Spam and 429 Rate Limit Fix

## Problem Summary
Multiple /otp requests were being triggered automatically, causing Supabase 429 rate limit errors and email spam. The issue was caused by:
1. No protection against rapid button clicks
2. No cooldown between OTP requests
3. No request deduplication on the frontend
4. Insufficient error handling for rate limits

## Changes Made

### 1. **Sign In Page** (`app/signin/page.tsx`)
**Fixed Issues:**
- Added `submitInProgressRef` to prevent duplicate submissions
- Added 60-second cooldown state (`cooldownSeconds`)
- Added `startCooldown()` function to implement cooldown timer
- Disabled form inputs and button during loading and cooldown
- Show countdown timer to user
- Detect 429 status and apply automatic cooldown

**Key Changes:**
```typescript
// Prevent duplicate submissions
const submitInProgressRef = useRef(false)

// Track cooldown
const [cooldownSeconds, setCooldownSeconds] = useState(0)

// Check before submission
if (submitInProgressRef.current || isLoading || cooldownSeconds > 0) {
  return
}

// Detect rate limit and apply cooldown
if (otpResponse.status === 429) {
  startCooldown()
}
```

**UI Updates:**
- Button shows "Wait {countdown}s" during cooldown
- Cooldown message displayed: "Please wait {seconds}s before requesting another code"
- Email input and Continue button disabled during cooldown
- Back button also disabled during loading/cooldown

### 2. **Sign Up Page** (`app/signup/page.tsx`)
**Applied same fixes as Sign In page:**
- `submitInProgressRef` for duplicate submission prevention
- 60-second cooldown with countdown timer
- Disabled form during loading and cooldown
- Rate limit detection with automatic cooldown
- User-friendly countdown display

### 3. **Verify Email Page** (`app/verify-email/page.tsx`)
**Enhanced Resend OTP Handler:**
- Added check to prevent resend during loading
- Improved error handling for rate limit responses
- Keep cooldown active if rate limited (status 429)
- Provide user feedback on error reason

**Key Changes:**
```typescript
const handleResendOtp = async () => {
  if (isLoading) return  // Prevent during loading
  
  // ... request code ...
  
  if (response.status === 429) {
    setCanResend(false)  // Keep cooldown active
  } else {
    setCanResend(true)   // Allow resend on other errors
  }
}
```

### 4. **OTP API Route** (`app/api/auth/send-otp/route.ts`)
**Improved Error Handling:**
- Detect Supabase rate limit errors specifically
- Return proper 429 status code for rate limit errors
- Provide clear error message to frontend
- Log error details for debugging

**Key Changes:**
```typescript
if (error.message?.includes('rate') || error.message?.includes('429')) {
  return NextResponse.json(
    { error: 'Too many requests. Please wait before requesting another code.' },
    { status: 429 }
  )
}
```

## How It Works

### Prevention Mechanism:
1. **Duplicate Click Prevention**: `submitInProgressRef` prevents the submit handler from running concurrently
2. **Cooldown Timer**: After successful or rate-limited OTP request, 60-second cooldown starts
3. **Form Locking**: During cooldown, form inputs and submit button are disabled
4. **Visual Feedback**: Button and message show countdown ("Wait 45s")

### Rate Limit Response:
1. User clicks button
2. OTP request sent to `/api/auth/send-otp`
3. If 429 response (rate limited):
   - Show error message
   - Start 60-second cooldown
   - Disable form until cooldown expires
4. User sees "Wait Xs before requesting another code"

### User Experience:
- Only one OTP request per form submission
- Clear visual feedback during loading and cooldown
- Can't accidentally or intentionally spam requests
- Cooldown timer shows exact wait time
- Rate limit errors are handled gracefully

## Testing the Fix

### Before & After Comparison:
```
BEFORE (Broken):
- Click Continue → 1 OTP request
- Click Continue again quickly → 2+ OTP requests
- Multiple /otp entries in Supabase logs
- 429 errors due to Supabase rate limits

AFTER (Fixed):
- Click Continue → 1 OTP request
- Click Continue during cooldown → No request sent
- Single /otp entry in Supabase logs
- 60-second wait enforced between requests
```

### Manual Testing Steps:
1. Navigate to /signin or /signup
2. Enter valid email
3. Click Continue button
4. Button should show "Wait 60s"
5. Form inputs should be disabled (grayed out)
6. Attempting to click during countdown does nothing
7. After 60 seconds, button becomes enabled again
8. Check Supabase logs - only 1 /otp request per submission

## Configuration
The cooldown duration is configurable in each page:
```typescript
const OTP_COOLDOWN_SECONDS = 60
```

Adjust this value if needed:
- Lower for faster resends (not recommended - will cause rate limiting)
- Higher for more protection against spam (recommended for high-traffic apps)

## Benefits
✅ Eliminates duplicate OTP requests  
✅ Prevents 429 rate limit errors  
✅ Reduces email spam from multiple requests  
✅ Improved user experience with clear feedback  
✅ Proper error handling and recovery  
✅ Request deduplication on frontend  
✅ Automatic cooldown on rate limit detection  

## Files Modified
1. `app/signin/page.tsx` - Added cooldown and submission prevention
2. `app/signup/page.tsx` - Added cooldown and submission prevention
3. `app/verify-email/page.tsx` - Improved resend error handling
4. `app/api/auth/send-otp/route.ts` - Enhanced rate limit detection

## Supabase Configuration Recommendations
1. Verify Supabase email rate limits are appropriate for your use case
2. Check email provider rate limits (SendGrid, AWS SES, etc.)
3. Monitor `/api/auth/send-otp` logs for patterns
4. Consider increasing cooldown if you see continued rate limit errors

## Future Improvements
- Add server-side cooldown tracking using Redis/database
- Implement progressive backoff for repeated failures
- Add analytics to track rate limit triggers
- Consider email verification link instead of OTP for some flows
- Implement CAPTCHA for high-risk scenarios
