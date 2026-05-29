================================================================================
                   CREATING NEW SUPABASE PROJECT - STEP BY STEP
================================================================================

STEP 1: CREATE NEW SUPABASE PROJECT
─────────────────────────────────────

1. Go to https://app.supabase.com
2. Sign in with your account
3. Click "New Project"
4. Fill in the form:
   - Name: "bluepay-auth" (or any name you prefer)
   - Database Password: Generate a strong password (save this!)
   - Region: Select closest to your users
5. Click "Create New Project"
6. Wait 2-5 minutes for project to initialize


STEP 2: GET YOUR CREDENTIALS
──────────────────────────────

Once project is ready:

1. Go to Project Settings (bottom left → Settings)
2. Click "API" tab
3. You'll see:
   - Project URL (looks like: https://xxxxx.supabase.co)
   - Project API Key - anon public (looks like: eyJhbGc...)
4. COPY both values and save them


STEP 3: CONFIGURE EMAIL AUTH
──────────────────────────────

Still in Supabase Dashboard:

1. Go to Authentication (left sidebar)
2. Go to Providers tab
3. Find "Email" section
4. Click "Email" to expand
5. You'll see:
   - Enable Email provider: Toggle ON
   - Confirm email: Toggle OFF (for OTP flow)
   - OTP expiry: 3600 seconds (default is fine)
6. Click "Save"

Note: Supabase sends emails by default using their SMTP.
For production, you'd configure custom SMTP in Settings → Email.


STEP 4: ENABLE OTP
───────────────────

Still in Authentication:

1. Go to Authentication → Providers
2. Find "Phone/SMS" or "Email OTP" section
3. Ensure Email OTP is enabled
4. Check settings:
   - OTP length: 6 digits (default)
   - OTP expiry: 3600 seconds
   - Enable sign up: ON
   - Auto Confirm Users: OFF (recommended for security)
5. Click "Save"


STEP 5: CREATE SCHEMA (Users Table)
─────────────────────────────────────

Now set up your database schema:

1. Go to SQL Editor (left sidebar)
2. Click "New Query"
3. Paste this SQL:

```sql
-- Create users table
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  wallet_balance DECIMAL(15,2) DEFAULT 250000,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for users to read their own data
CREATE POLICY "Users can read own data" ON public.users
  FOR SELECT USING (auth.uid() = id);

-- Create RLS policy for users to update their own data
CREATE POLICY "Users can update own data" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- Create RLS policy for service role (for auth APIs)
CREATE POLICY "Service role can manage users" ON public.users
  AS PERMISSIVE FOR ALL USING (true)
  WITH CHECK (true);
```

4. Click "Run"
5. You should see: "Query executed successfully"


STEP 6: ENABLE STORAGE (Optional for uploads)
───────────────────────────────────────────────

If you need file uploads:

1. Go to Storage (left sidebar)
2. Click "New Bucket"
3. Name: "uploads"
4. Make it Private (for user files)
5. Click "Create Bucket"


STEP 7: VERIFY EMAIL SENDING
──────────────────────────────

Test that emails work:

1. Go to Authentication → Users
2. Click "Add User"
3. Email: your-test@gmail.com
4. Password: (leave blank for OTP only)
5. Click "Add User"
6. Go back to Users list
7. Look for that user - should have an "Invited" status
8. Check your email - you should receive an invitation email
9. If not, check spam folder

If you don't receive email:
  - Check Supabase Logs (Authentication → Logs tab)
  - May need to configure custom SMTP
  - For development, Supabase provides built-in email


STEP 8: COLLECT YOUR CREDENTIALS
───────────────────────────────────

You now have:
  ✓ Supabase Project URL
  ✓ Supabase Anon Key
  ✓ Database Password (saved securely)
  ✓ Email OTP enabled
  ✓ Users table created
  ✓ RLS policies configured

You need these two:
  - SUPABASE_URL=https://xxxxx.supabase.co
  - SUPABASE_ANON_KEY=eyJhbGc...

Next step: Add these to your v0 project environment.

================================================================================
