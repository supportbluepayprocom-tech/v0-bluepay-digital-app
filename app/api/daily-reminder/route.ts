import { NextResponse } from 'next/server'

// API route to manually trigger daily reminder email
// This can be used for testing or manual triggering
// In production, the cron job handles automatic daily execution

const DAILY_REMINDER_URL = process.env.SUPABASE_URL 
  ? `${process.env.SUPABASE_URL}/functions/v1/daily-reminder-email`
  : 'https://rykdsszbtjvnoycmialc.supabase.co/functions/v1/daily-reminder-email'

export async function POST(request: Request) {
  try {
    // Verify admin authorization (you can add your own auth logic here)
    const authHeader = request.headers.get('authorization')
    
    // For security, require a secret key to trigger manually
    const triggerSecret = process.env.DAILY_REMINDER_TRIGGER_SECRET
    
    if (triggerSecret && authHeader !== `Bearer ${triggerSecret}`) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get the service role key for calling the edge function
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!serviceRoleKey) {
      return NextResponse.json(
        { success: false, error: 'Service role key not configured' },
        { status: 500 }
      )
    }

    // Call the Supabase Edge Function
    const response = await fetch(DAILY_REMINDER_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${serviceRoleKey}`,
      },
      body: JSON.stringify({}),
    })

    const data = await response.json()

    if (!response.ok) {
      console.error('[v0] Daily reminder trigger failed:', data)
      return NextResponse.json(
        { success: false, error: data.error || 'Failed to trigger daily reminder' },
        { status: response.status }
      )
    }

    console.log('[v0] Daily reminder triggered successfully:', data)
    
    return NextResponse.json({
      success: true,
      message: 'Daily reminder emails triggered',
      result: data,
    })
  } catch (error) {
    console.error('[v0] Error triggering daily reminder:', error)
    
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Internal server error' 
      },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Daily Reminder Email API',
    usage: 'POST to this endpoint to manually trigger daily reminder emails',
    note: 'Requires authorization header with trigger secret',
  })
}
