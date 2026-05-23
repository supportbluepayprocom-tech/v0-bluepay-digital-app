import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { generateDebitAlertHTML, type DebitAlertEmailData } from '@/lib/resend-email'

// Default Resend testing email - no domain verification required
const RESEND_DEFAULT_SENDER = 'BLUEPAY PRO V30 <onboarding@resend.dev>'

export async function POST(request: NextRequest) {
  try {
    const data: DebitAlertEmailData = await request.json()

    // Validate required fields
    if (!data.email || !data.amount || !data.transactionType) {
      return NextResponse.json(
        { error: 'Missing required fields: email, amount, transactionType' },
        { status: 400 }
      )
    }

    // Check for API key
    const apiKey = process.env.RESEND_API_KEY
    
    if (!apiKey) {
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

    // Send email via Resend using default sender (no domain verification needed)
    const { data: emailData, error } = await resend.emails.send({
      from: RESEND_DEFAULT_SENDER,
      to: data.email,
      subject: `BLUEPAY Debit Alert - ${data.transactionType} - ₦${data.amount.toLocaleString('en-NG', { minimumFractionDigits: 2 })}`,
      html: htmlContent,
    })

    if (error) {
      console.error('[BLUEPAY] Resend error:', error)
      return NextResponse.json(
        { error: error.message || 'Failed to send email', details: error },
        { status: 500 }
      )
    }

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
