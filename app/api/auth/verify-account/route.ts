import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { validateEmail } from '@/lib/utils'

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email || !validateEmail(email)) {
      console.error('[v0] verify-account: Invalid email:', email)
      return NextResponse.json(
        { error: 'Invalid email address' },
        { status: 400 }
      )
    }

    console.log('[v0] verify-account: Checking if account exists:', email)

    // Create server-side Supabase client
    const supabase = await createClient()

    // Check if user exists in auth
    const { data: { users }, error: usersError } = await supabase.auth.admin.listUsers()

    if (usersError) {
      console.error('[v0] verify-account: Error listing users:', usersError)
      // Fallback - try to get user profile
    }

    // Check if email exists in auth.users
    const user = users?.find((u) => u.email === email)

    if (user) {
      console.log('[v0] verify-account: Account found for email:', email)
      return NextResponse.json({
        exists: true,
        message: 'Account exists. Please proceed to verify your email.',
        email: email,
      })
    }

    // Also check public.users table as fallback
    const { data: profileData } = await supabase
      .from('users')
      .select('email, id')
      .eq('email', email)
      .single()

    if (profileData) {
      console.log('[v0] verify-account: Account found in profiles:', email)
      return NextResponse.json({
        exists: true,
        message: 'Account exists. Please proceed to verify your email.',
        email: email,
      })
    }

    console.log('[v0] verify-account: No account found for email:', email)
    return NextResponse.json({
      exists: false,
      message: 'No account found. Please create an account first.',
      email: email,
    })
  } catch (error) {
    console.error('[v0] verify-account: Error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}
