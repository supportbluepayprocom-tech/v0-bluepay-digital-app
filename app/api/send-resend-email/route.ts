import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { generateDebitAlertHTML, type DebitAlertEmailData } from '@/lib/resend-email'

export async function POST(request: NextRequest) {
  try {
    const data: DebitAlertEmailData = await request.json()
    
    console.log('[BLUEPAY] Received email request for:', data.email, 'Transaction:', data.transactionType)

    // Validate required fields
    if (!data.email || !data.amount || !data.transactionType) {
      console.error('[BLUEPAY] Missing required fields')
      return NextResponse.json(
        { error: 'Missing required fields: email, amount, transactionType' },
        { status: 400 }
      )
    }

    // Check for API key
    const apiKey = process.env.RESEND_API_KEY
    const emailFrom = process.env.EMAIL_FROM
    
    console.log('[BLUEPAY] API Key configured:', !!apiKey)
    console.log('[BLUEPAY] EMAIL_FROM:', emailFrom || 'not set')
    
    if (!apiKey) {
      console.error('[BLUEPAY] RESEND_API_KEY not configured')
      // Return success anyway to not block transactions in demo mode
      return NextResponse.json({
        success: true,
        message: 'Email queued (demo mode - API key not configured)',
        demo: true,
      })
    }

    const resend = new Resend(apiKey)

    // Generate the HTML email
    const htmlContent = generateDebitAlertHTML(data)
    
    // Use verified sender or fall back to Resend's default for testing
    const fromEmail = emailFrom || 'onboarding@resend.dev'
    
    console.log('[BLUEPAY] Sending email from:', fromEmail, 'to:', data.email)

    // Send email via Resend
    const { data: emailData, error } = await resend.emails.send({
      from: fromEmail,
      to: data.email,
      subject: `BLUEPAY Debit Alert - ${data.transactionType} - ₦${data.amount.toLocaleString('en-NG', { minimumFractionDigits: 2 })}`,
      html: htmlContent,
    })

    if (error) {
      console.error('[BLUEPAY] Resend error:', JSON.stringify(error, null, 2))
      return NextResponse.json(
        { error: error.message || 'Failed to send email', details: error },
        { status: 500 }
      )
    }

    console.log('[BLUEPAY] Email sent successfully! ID:', emailData?.id)

    return NextResponse.json({
      success: true,
      message: 'Debit alert email sent successfully',
      emailId: emailData?.id,
      bpcReference: data.bpcReference,
    })
  } catch (error) {
    console.error('[BLUEPAY] Error in send-resend-email route:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
