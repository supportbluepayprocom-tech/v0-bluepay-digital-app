// Supabase Edge Function: daily-reminder-email
// This function fetches all registered users and sends them a daily reminder email
// Scheduled to run every day at 8:00 AM via Supabase cron

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')!
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

interface User {
  id: string
  email: string
  created_at: string
}

interface EmailResult {
  email: string
  success: boolean
  error?: string
}

// CORS headers for edge function
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

/**
 * Send reminder email using Resend API
 */
async function sendReminderEmail(email: string): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'BLUEPAY PRO V30 <onboarding@resend.dev>',
        to: [email],
        subject: 'Reminder from BLUEPAY PRO V30',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; padding: 20px 0; border-bottom: 2px solid #0066cc;">
              <h1 style="color: #0066cc; margin: 0;">BLUEPAY PRO V30</h1>
            </div>
            
            <div style="padding: 30px 0;">
              <p style="font-size: 16px; color: #333; line-height: 1.6;">
                Hello from BLUEPAY PRO V30.
              </p>
              
              <p style="font-size: 16px; color: #333; line-height: 1.6;">
                This is your daily reminder to purchase your BPC CODE and activate full platform access.
              </p>
              
              <p style="font-size: 16px; color: #333; line-height: 1.6;">
                Login to your dashboard to continue.
              </p>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="https://bluepaypro.com/dashboard" 
                   style="background-color: #0066cc; color: white; padding: 12px 30px; 
                          text-decoration: none; border-radius: 5px; font-weight: bold;">
                  Go to Dashboard
                </a>
              </div>
            </div>
            
            <div style="border-top: 1px solid #eee; padding-top: 20px; text-align: center;">
              <p style="font-size: 12px; color: #888;">
                &copy; ${new Date().getFullYear()} BLUEPAY PRO V30. All rights reserved.
              </p>
              <p style="font-size: 11px; color: #aaa;">
                You received this email because you are registered on BLUEPAY PRO V30.
              </p>
            </div>
          </div>
        `,
        text: `Hello from BLUEPAY PRO V30.

This is your daily reminder to purchase your BPC CODE and activate full platform access.

Login to your dashboard to continue.

Visit: https://bluepaypro.com/dashboard

© ${new Date().getFullYear()} BLUEPAY PRO V30. All rights reserved.`,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      console.error(`Failed to send email to ${email}:`, errorData)
      return { success: false, error: errorData.message || 'Failed to send email' }
    }

    console.log(`Successfully sent reminder email to ${email}`)
    return { success: true }
  } catch (error) {
    console.error(`Error sending email to ${email}:`, error)
    return { success: false, error: error.message }
  }
}

/**
 * Fetch all registered users from Supabase Auth
 */
async function getAllUsers(): Promise<User[]> {
  // Create Supabase admin client with service role key
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })

  const allUsers: User[] = []
  let page = 1
  const perPage = 1000

  // Paginate through all users
  while (true) {
    const { data, error } = await supabase.auth.admin.listUsers({
      page,
      perPage,
    })

    if (error) {
      console.error('Error fetching users:', error)
      throw new Error(`Failed to fetch users: ${error.message}`)
    }

    if (!data.users || data.users.length === 0) {
      break
    }

    // Filter users with valid emails
    const usersWithEmail = data.users
      .filter((user) => user.email && user.email_confirmed_at)
      .map((user) => ({
        id: user.id,
        email: user.email!,
        created_at: user.created_at,
      }))

    allUsers.push(...usersWithEmail)

    // Check if we've fetched all users
    if (data.users.length < perPage) {
      break
    }

    page++
  }

  return allUsers
}

/**
 * Main handler for the Edge Function
 */
Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Validate environment variables
    if (!RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY is not configured')
    }
    if (!SUPABASE_URL) {
      throw new Error('SUPABASE_URL is not configured')
    }
    if (!SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('SUPABASE_SERVICE_ROLE_KEY is not configured')
    }

    console.log('Starting daily reminder email job...')

    // Fetch all registered users
    const users = await getAllUsers()
    console.log(`Found ${users.length} registered users with confirmed emails`)

    if (users.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          message: 'No users found to send reminders to',
          sent: 0,
          failed: 0,
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      )
    }

    // Send reminder emails to all users
    const results: EmailResult[] = []
    
    // Process in batches of 10 to avoid rate limits
    const batchSize = 10
    for (let i = 0; i < users.length; i += batchSize) {
      const batch = users.slice(i, i + batchSize)
      
      const batchResults = await Promise.all(
        batch.map(async (user) => {
          const result = await sendReminderEmail(user.email)
          return {
            email: user.email,
            success: result.success,
            error: result.error,
          }
        })
      )
      
      results.push(...batchResults)
      
      // Small delay between batches to respect rate limits
      if (i + batchSize < users.length) {
        await new Promise((resolve) => setTimeout(resolve, 500))
      }
    }

    // Calculate stats
    const successful = results.filter((r) => r.success).length
    const failed = results.filter((r) => !r.success).length
    const failedEmails = results.filter((r) => !r.success)

    console.log(`Daily reminder job completed: ${successful} sent, ${failed} failed`)

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Daily reminder emails processed',
        sent: successful,
        failed: failed,
        failedDetails: failedEmails.length > 0 ? failedEmails : undefined,
        timestamp: new Date().toISOString(),
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Error in daily reminder job:', error)

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})
