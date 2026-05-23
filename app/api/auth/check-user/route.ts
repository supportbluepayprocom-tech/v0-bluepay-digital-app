import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { validateEmail } from '@/lib/utils'

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    // Validation
    if (!email || !validateEmail(email)) {
      return NextResponse.json(
        { error: 'Invalid email address' },
        { status: 400 }
      )
    }

    // Create server-side Supabase client
    const supabase = await createClient()

    // Check if user exists in the users table
    const { data: existingUser, error } = await supabase
      .from('users')
      .select('id, email, full_name')
      .eq('email', email.toLowerCase())
      .single()

    if (error && error.code !== 'PGRST116') {
      // PGRST116 = no rows returned (user doesn't exist)
      console.error('[v0] Check user error:', error)
      return NextResponse.json(
        { error: 'Error checking user' },
        { status: 500 }
      )
    }

    if (existingUser) {
      // User exists - can sign in
      return NextResponse.json({
        exists: true,
        message: 'User found',
        user: {
          email: existingUser.email,
          fullName: existingUser.full_name,
        },
      })
    }

    // User doesn't exist - needs to create account
    return NextResponse.json({
      exists: false,
      message: 'User not found. Please create an account.',
    })
  } catch (error) {
    console.error('[v0] Check user error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
