import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { validateEmail } from '@/lib/utils'

/**
 * Check if an email already exists in the system
 * This is called BEFORE attempting to send OTP
 * Helps differentiate between existing users and new users
 */
export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    // Validate email format
    if (!email || !validateEmail(email)) {
      console.error('[v0] check-email: Invalid email format:', email)
      return NextResponse.json(
        { error: 'Invalid email address' },
        { status: 400 }
      )
    }

    console.log('[v0] check-email: Checking if email exists:', email)

    // Create server-side Supabase client
    const supabase = await createClient()

    // Check if email exists in public.users table (user profile data)
    // This is more reliable than checking auth.users
    const { data: profileData, error: profileError } = await supabase
      .from('users')
      .select('id, email')
      .eq('email', email.toLowerCase())
      .maybeSingle()

    // Handle query errors (but not "no rows" errors which return null)
    if (profileError && profileError.code !== 'PGRST116') {
      console.error('[v0] check-email: Error querying users profile:', profileError.message)
      return NextResponse.json(
        { error: 'Unable to verify email. Please try again.' },
        { status: 500 }
      )
    }

    // If profile data exists, email is taken
    if (profileData) {
      console.log('[v0] check-email: Email exists in profiles:', email)
      return NextResponse.json(
        { 
          exists: true,
          message: 'An account with this email already exists. Please login.',
          type: 'existing_account'
        },
        { status: 200 }
      )
    }

    // Email is available - safe to send OTP to new user
    console.log('[v0] check-email: Email is available (new user):', email)
    return NextResponse.json(
      { 
        exists: false,
        message: 'Email is available. Ready to send OTP.',
        type: 'new_user'
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('[v0] check-email: Unexpected error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}
