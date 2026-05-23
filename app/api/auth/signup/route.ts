import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { validateEmail } from '@/lib/utils'

export async function POST(request: NextRequest) {
  try {
    const { email, fullName } = await request.json()

    // Validation
    if (!email || !validateEmail(email)) {
      return NextResponse.json(
        { error: 'Invalid email address' },
        { status: 400 }
      )
    }

    if (!fullName || fullName.trim().length < 2) {
      return NextResponse.json(
        { error: 'Full name is required' },
        { status: 400 }
      )
    }

    // Create server-side Supabase client
    const supabase = await createClient()

    // Check if email already exists
    const { data: existingEmail } = await supabase
      .from('users')
      .select('id, email')
      .eq('email', email.toLowerCase())
      .single()

    if (existingEmail) {
      return NextResponse.json(
        { error: 'This email is already registered. Please sign in instead.' },
        { status: 400 }
      )
    }

    // Check if full name already exists (one name per account)
    const { data: existingName } = await supabase
      .from('users')
      .select('id, full_name')
      .ilike('full_name', fullName.trim())
      .single()

    if (existingName) {
      return NextResponse.json(
        { error: 'This name is already registered with another account. Please use a different name.' },
        { status: 400 }
      )
    }

    // OTP-based signup - user profile will be created after email verification
    return NextResponse.json({
      success: true,
      message: 'Account preparation started. Verification code will be sent.',
      user: {
        email: email.toLowerCase(),
        fullName: fullName.trim(),
      },
    })
  } catch (error) {
    console.error('[v0] Signup error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
