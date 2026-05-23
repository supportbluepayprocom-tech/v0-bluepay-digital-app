import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const { email, code } = await request.json()

    if (!email || !code) {
      return NextResponse.json(
        { error: 'Email and verification code are required' },
        { status: 400 }
      )
    }

    // Create server-side Supabase client
    const supabase = await createClient()

    // Verify OTP using Supabase
    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token: code,
      type: 'email',
    })

    if (error) {
      let userMessage = error.message
      if (error.message?.includes('expired')) {
        userMessage = 'Verification code has expired. Please request a new one.'
      } else if (error.message?.includes('invalid')) {
        userMessage = 'Invalid verification code. Please check and try again.'
      }
      return NextResponse.json(
        { error: userMessage },
        { status: 400 }
      )
    }

    // Verify user exists in our users table
    if (data.user) {
      const { data: existingUser, error: userError } = await supabase
        .from('users')
        .select('id, email, full_name')
        .eq('email', email.toLowerCase())
        .single()

      if (userError || !existingUser) {
        return NextResponse.json(
          { error: 'Account not found. Please create an account first.' },
          { status: 400 }
        )
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Signed in successfully',
      email: email,
      user: data.user,
    })
  } catch (error) {
    console.error('[v0] Verify signin error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
