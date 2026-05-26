import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.1'

interface EmailResult {
  email: string
  sent: boolean
  error?: string
}

interface ResponseData {
  totalUsers: number
  emailsSent: number
  emailsFailed: number
  results: EmailResult[]
  timestamp: string
}

serve(async (req: Request): Promise<Response> => {
  try {
    console.log('[v0] Starting daily reminder email function')

    // Get environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    const mailgunApiKey = Deno.env.get('MAILGUN_API_KEY')
    const mailgunDomain = Deno.env.get('MAILGUN_DOMAIN')

    // Validate environment variables
    if (!supabaseUrl || !supabaseServiceRoleKey || !mailgunApiKey || !mailgunDomain) {
      console.error('[v0] Missing required environment variables')
      return new Response(
        JSON.stringify({
          error: 'Missing required environment variables',
          totalUsers: 0,
          emailsSent: 0,
          emailsFailed: 0,
          results: [],
          timestamp: new Date().toISOString(),
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      )
    }

    // Initialize Supabase admin client
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false,
      },
    })

    console.log('[v0] Fetching all users from Supabase Auth')

    // Fetch all users
    const { data: users, error: usersError } = await supabase.auth.admin.listUsers()

    if (usersError) {
      console.error('[v0] Error fetching users:', usersError)
      return new Response(
        JSON.stringify({
          error: `Failed to fetch users: ${usersError.message}`,
          totalUsers: 0,
          emailsSent: 0,
          emailsFailed: 0,
          results: [],
          timestamp: new Date().toISOString(),
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      )
    }

    const totalUsers = users?.users?.length || 0
    console.log(`[v0] Found ${totalUsers} total users`)

    const results: EmailResult[] = []
    let emailsSent = 0
    let emailsFailed = 0

    // Process each user
    if (users?.users && users.users.length > 0) {
      for (const user of users.users) {
        if (!user.email) {
          console.log(`[v0] Skipping user without email: ${user.id}`)
          continue
        }

        try {
          console.log(`[v0] Sending reminder email to: ${user.email}`)

          // Prepare email content
          const emailFrom = `BLUEPAY PRO V30 <noreply@${mailgunDomain}>`
          const emailTo = user.email
          const subject = 'Reminder from BLUEPAY PRO V30'
          const text = `Hello from BLUEPAY PRO V30.

This is your daily reminder to purchase your BPC CODE and activate full platform access.

Login to your dashboard to continue.

Best regards,
BLUEPAY PRO V30 Support Team`

          // Create FormData for Mailgun API
          const formData = new FormData()
          formData.append('from', emailFrom)
          formData.append('to', emailTo)
          formData.append('subject', subject)
          formData.append('text', text)

          // Send email via Mailgun API
          const mailgunUrl = `https://api.mailgun.net/v3/${mailgunDomain}/messages`
          const authHeader = `Basic ${btoa(`api:${mailgunApiKey}`)}`

          const response = await fetch(mailgunUrl, {
            method: 'POST',
            headers: {
              'Authorization': authHeader,
            },
            body: formData,
          })

          if (!response.ok) {
            const errorText = await response.text()
            console.error(`[v0] Mailgun error for ${user.email}:`, errorText)
            emailsFailed++
            results.push({
              email: user.email,
              sent: false,
              error: `HTTP ${response.status}: ${errorText}`,
            })
          } else {
            const mailgunResponse = await response.json()
            console.log(`[v0] Email sent successfully to ${user.email}:`, mailgunResponse)
            emailsSent++
            results.push({
              email: user.email,
              sent: true,
            })
          }
        } catch (error) {
          console.error(`[v0] Error sending email to ${user.email}:`, error)
          emailsFailed++
          results.push({
            email: user.email,
            sent: false,
            error: error instanceof Error ? error.message : 'Unknown error',
          })
        }
      }
    }

    const responseData: ResponseData = {
      totalUsers,
      emailsSent,
      emailsFailed,
      results,
      timestamp: new Date().toISOString(),
    }

    console.log('[v0] Daily reminder email function completed:', responseData)

    return new Response(JSON.stringify(responseData), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('[v0] Unexpected error:', error)
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Unexpected error',
        totalUsers: 0,
        emailsSent: 0,
        emailsFailed: 0,
        results: [],
        timestamp: new Date().toISOString(),
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  }
})
