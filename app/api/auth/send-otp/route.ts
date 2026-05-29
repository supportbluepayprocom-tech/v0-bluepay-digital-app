import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { validateEmail } from '@/lib/utils'

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email || !validateEmail(email)) {
      console.error('[v0] Invalid email:', email)
      return NextResponse.json(
        { error: 'Invalid email address' },
        { status: 400 }
      )
    }

    console.log('[v0] Sending OTP to email:', email)

    // Create server-side Supabase client
    const supabase = await createClient()

    // Use Supabase's native Email OTP flow
    const { data, error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: true,
      },
    })

    console.log('[v0] Supabase response:', { success: !error, error: error?.message, data })

    if (error) {
      console.error('[v0] Supabase signInWithOtp error:', error.message, error.status)
      
      // Handle rate limiting specifically
      if (error.message?.includes('rate') || error.message?.includes('429') || error.status === 429) {
        return NextResponse.json(
          { error: 'Too many requests. Please wait before requesting another code.' },
          { status: 429 }
        )
      }
      
      return NextResponse.json(
        { error: error.message || 'Failed to send verification code' },
        { status: error.status || 400 }
      )
    }

    console.log('[v0] OTP sent successfully to:', email)

    return NextResponse.json({
      success: true,
      message: 'Verification code sent to your email',
      maskedEmail: email.replace(/(.{2})(.*)(@.*)/, '$1***$3'),
    })
  } catch (error) {
    console.error('[v0] Send OTP error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}
