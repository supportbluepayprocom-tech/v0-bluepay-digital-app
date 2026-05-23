import { NextRequest, NextResponse } from 'next/server'
import { sendOTPEmail, generateOTP, type OTPEmailData } from '@/lib/email/email-service'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, fullName, purpose } = body

    // Validate request
    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    if (!purpose || !['login', 'signup', 'transaction', 'password_reset'].includes(purpose)) {
      return NextResponse.json(
        { error: 'Valid purpose is required: login, signup, transaction, or password_reset' },
        { status: 400 }
      )
    }

    // Generate OTP
    const otp = generateOTP()

    // Send OTP email
    const result = await sendOTPEmail({
      email,
      fullName,
      otp,
      purpose,
      expiresIn: '10 minutes',
    })

    if (!result.success) {
      return NextResponse.json(
        { error: result.message },
        { status: 500 }
      )
    }

    // Return success (don't expose OTP in production - this is for the client to show a success message)
    // In a real app, you would store the OTP in a database with expiration for verification
    return NextResponse.json({
      success: true,
      message: 'Verification code sent to your email',
      // Only include OTP in development for testing
      ...(process.env.NODE_ENV === 'development' && { otp }),
    })
  } catch (error) {
    console.error('[BLUEPAY] OTP API error:', error)
    return NextResponse.json(
      { error: 'Failed to send verification code' },
      { status: 500 }
    )
  }
}
