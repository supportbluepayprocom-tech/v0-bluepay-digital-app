import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const { email, code } = await request.json()

    if (!email || !code) {
      console.error('[v0] verify-otp: Missing email or code')
      return NextResponse.json(
        { error: 'Email and verification code are required' },
        { status: 400 }
      )
    }

    console.log('[v0] verify-otp: Verifying OTP for email:', email)

    // Create server-side Supabase client
    const supabase = await createClient()

    // Use Supabase's native verifyOtp method
    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token: code,
      type: 'email',
    })

    if (error) {
      console.error('[v0] verify-otp: Supabase verifyOtp error:', error.message)
      // Provide specific error messages based on Supabase response
      let userMessage = error.message
      if (error.message?.includes('expired')) {
        userMessage = 'Verification code has expired. Please request a new one.'
      } else if (error.message?.includes('invalid') || error.message?.includes('Invalid')) {
        userMessage = 'Invalid verification code. Please check and try again.'
      } else if (error.message?.includes('not found')) {
        userMessage = 'Email not found. Please check your email address.'
      }
      return NextResponse.json(
        { error: userMessage },
        { status: 400 }
      )
    }

    console.log('[v0] verify-otp: OTP verified successfully for:', email)

    // Create or update user profile in public.users table
    if (data.user) {
      const fullName = data.user.user_metadata?.full_name || 'User'
      
      // First try to get existing profile
      const { data: existingProfile } = await supabase
        .from('users')
        .select('id')
        .eq('id', data.user.id)
        .single()

      if (!existingProfile) {
        // Create new profile if it doesn't exist
        const { error: profileError } = await supabase
          .from('users')
          .insert({
            id: data.user.id,
            email: data.user.email || '',
            full_name: fullName,
            created_at: new Date().toISOString(),
          })
          .select()
          .single()

        if (profileError) {
          console.error('[v0] verify-otp: Profile creation error:', profileError)
          // Don't fail - continue even if profile creation has issues
        } else {
          console.log('[v0] verify-otp: Profile created for user:', data.user.id)
        }
      }

      // Initialize wallet with default balance of 250,000 NGN (only if not exists)
      const { data: walletExists } = await supabase
        .from('wallets')
        .select('id')
        .eq('user_id', data.user.id)
        .single()

      if (!walletExists) {
        const { error: walletError } = await supabase
          .from('wallets')
          .insert({
            user_id: data.user.id,
            balance: 250000,
            created_at: new Date().toISOString(),
          })
          .select()
          .single()

        if (walletError) {
          console.error('[v0] verify-otp: Wallet initialization error:', walletError)
          // Continue even if wallet initialization fails
        } else {
          console.log('[v0] verify-otp: Wallet initialized for user:', data.user.id, 'with balance: 250000')
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Email verified successfully',
      email: email,
      user: data.user,
    })
  } catch (error) {
    console.error('[v0] verify-otp: Unexpected error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}
