import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { validateEmail } from '@/lib/utils'

export async function POST(request: NextRequest) {
  try {
    console.log('[v0] send-otp API: Route handler called')
    const { email } = await request.json()
    console.log('[v0] send-otp API: Email received:', email)

    // CRITICAL: Validate email format before hitting Supabase
    if (!email || !validateEmail(email)) {
      console.error('[v0] send-otp API: Invalid email:', email)
      return NextResponse.json(
        { error: 'Invalid email address' },
        { status: 400 }
      )
    }

    console.log('[v0] send-otp API: Creating Supabase client...')
    
    // Create server-side Supabase client
    const supabase = await createClient()
    console.log('[v0] send-otp API: Supabase client created')

    console.log('[v0] send-otp API: Calling supabase.auth.signInWithOtp with email:', email)
    
    // CRITICAL: Use Supabase's native Email OTP flow
    // This will NOT create duplicate users or trigger multiple requests
    const { data, error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: true,
      },
    })

    console.log('[v0] send-otp API: Supabase response received')
    console.log('[v0] send-otp API: Success:', !error)
    console.log('[v0] send-otp API: Error:', error?.message)
    console.log('[v0] send-otp API: Data:', data ? 'Present' : 'None')

    if (error) {
      console.error('[v0] send-otp API: Supabase auth error:', error.message, 'Status:', error.status)
      
      // CRITICAL: Handle rate limiting specifically
      if (error.message?.includes('rate') || error.message?.includes('429') || error.status === 429) {
        console.log('[v0] send-otp API: Rate limited by Supabase')
        return NextResponse.json(
          { error: 'Too many requests. Please wait before requesting another code.' },
          { 
            status: 429,
            headers: {
              'Retry-After': '60' // Tell client to wait 60 seconds
            }
          }
        )
      }
      
      // CRITICAL: Handle email-related errors
      if (error.message?.includes('email') || error.message?.includes('Email')) {
        console.log('[v0] send-otp API: Email-related error:', error.message)
        return NextResponse.json(
          { error: 'Email verification temporarily unavailable. Please try again in a few moments.' },
          { status: 503 }
        )
      }
      
      console.log('[v0] send-otp API: Returning error response')
      return NextResponse.json(
        { error: error.message || 'Failed to send verification code' },
        { status: error.status || 400 }
      )
    }

    console.log('[v0] send-otp API: OTP sent successfully to:', email)

    return NextResponse.json({
      success: true,
      message: 'Verification code sent to your email',
      maskedEmail: email.replace(/(.{2})(.*)(@.*)/, '$1***$3'),
    })
  } catch (error) {
    console.error('[v0] send-otp API: Unexpected error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}
