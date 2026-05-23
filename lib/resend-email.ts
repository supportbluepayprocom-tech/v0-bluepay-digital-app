/**
 * BLUEPAY PRO V30 - Professional Fintech Debit Alert Email System
 * Uses Resend API for reliable email delivery
 */

export interface DebitAlertEmailData {
  email: string
  fullName: string
  amount: number
  transactionType: string
  recipient: string
  bpcReference: string
  status: 'Successful' | 'Pending' | 'Failed'
  dateTime: string
  remainingBalance: number
}

/**
 * Generate unique BPC reference code
 * Format: BPC + 10 random digits
 */
export function generateBPCReference(): string {
  const digits = '0123456789'
  let reference = 'BPC'
  for (let i = 0; i < 10; i++) {
    reference += digits.charAt(Math.floor(Math.random() * digits.length))
  }
  return reference
}

/**
 * Format currency for Nigerian Naira
 */
export function formatNaira(amount: number): string {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount).replace('NGN', '₦')
}

/**
 * Get current date and time formatted for emails
 */
export function getFormattedDateTime(): string {
  return new Date().toLocaleString('en-NG', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  })
}

/**
 * Generate professional fintech debit alert HTML email
 */
export function generateDebitAlertHTML(data: DebitAlertEmailData): string {
  const statusColor = data.status === 'Successful' ? '#22c55e' : data.status === 'Pending' ? '#f59e0b' : '#ef4444'
  const statusBg = data.status === 'Successful' ? '#dcfce7' : data.status === 'Pending' ? '#fef3c7' : '#fee2e2'

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>BLUEPAY PRO V30 - Debit Alert</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f3f4f6; line-height: 1.6;">
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f3f4f6;">
    <tr>
      <td style="padding: 40px 20px;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width: 500px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);">
          
          <!-- Header with Logo -->
          <tr>
            <td style="background: linear-gradient(135deg, #0000FF 0%, #1a1aff 100%); padding: 32px 24px; text-align: center;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td style="text-align: center;">
                    <div style="display: inline-block; background-color: #ffffff; border-radius: 12px; padding: 12px 20px; margin-bottom: 16px;">
                      <span style="font-size: 24px; font-weight: 800; color: #0000FF; letter-spacing: -0.5px;">BLUEPAY</span>
                      <span style="font-size: 12px; font-weight: 600; color: #0000FF; display: block; margin-top: -4px;">PRO V30</span>
                    </div>
                    <h1 style="color: #ffffff; font-size: 20px; font-weight: 600; margin: 0; letter-spacing: 0.5px;">DEBIT ALERT</h1>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Amount Section -->
          <tr>
            <td style="padding: 32px 24px 24px; text-align: center; border-bottom: 1px solid #e5e7eb;">
              <p style="color: #6b7280; font-size: 14px; margin: 0 0 8px 0; text-transform: uppercase; letter-spacing: 1px;">Amount Debited</p>
              <p style="color: #0000FF; font-size: 36px; font-weight: 700; margin: 0; letter-spacing: -1px;">${formatNaira(data.amount)}</p>
            </td>
          </tr>

          <!-- Greeting -->
          <tr>
            <td style="padding: 24px 24px 16px;">
              <p style="color: #1f2937; font-size: 16px; margin: 0;">Dear <strong>${data.fullName}</strong>,</p>
              <p style="color: #4b5563; font-size: 14px; margin: 12px 0 0 0;">A transaction has been processed on your BLUEPAY PRO V30 account. Please find the details below:</p>
            </td>
          </tr>

          <!-- Transaction Details -->
          <tr>
            <td style="padding: 0 24px 24px;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f9fafb; border-radius: 12px; overflow: hidden;">
                
                <!-- Transaction Type -->
                <tr>
                  <td style="padding: 16px 20px; border-bottom: 1px solid #e5e7eb;">
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                      <tr>
                        <td style="color: #6b7280; font-size: 13px;">Transaction Type</td>
                        <td style="color: #1f2937; font-size: 14px; font-weight: 600; text-align: right;">${data.transactionType}</td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Recipient/Service -->
                <tr>
                  <td style="padding: 16px 20px; border-bottom: 1px solid #e5e7eb;">
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                      <tr>
                        <td style="color: #6b7280; font-size: 13px;">Recipient/Service</td>
                        <td style="color: #1f2937; font-size: 14px; font-weight: 600; text-align: right;">${data.recipient}</td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- BPC Reference -->
                <tr>
                  <td style="padding: 16px 20px; border-bottom: 1px solid #e5e7eb;">
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                      <tr>
                        <td style="color: #6b7280; font-size: 13px;">BPC Reference</td>
                        <td style="color: #0000FF; font-size: 14px; font-weight: 700; text-align: right; font-family: 'Courier New', monospace;">${data.bpcReference}</td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Date & Time -->
                <tr>
                  <td style="padding: 16px 20px; border-bottom: 1px solid #e5e7eb;">
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                      <tr>
                        <td style="color: #6b7280; font-size: 13px;">Date & Time</td>
                        <td style="color: #1f2937; font-size: 13px; font-weight: 500; text-align: right;">${data.dateTime}</td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Status -->
                <tr>
                  <td style="padding: 16px 20px; border-bottom: 1px solid #e5e7eb;">
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                      <tr>
                        <td style="color: #6b7280; font-size: 13px;">Status</td>
                        <td style="text-align: right;">
                          <span style="display: inline-block; background-color: ${statusBg}; color: ${statusColor}; font-size: 12px; font-weight: 600; padding: 4px 12px; border-radius: 20px;">${data.status}</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Remaining Balance -->
                <tr>
                  <td style="padding: 16px 20px; background-color: #f0f0ff;">
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                      <tr>
                        <td style="color: #0000FF; font-size: 13px; font-weight: 600;">Remaining Balance</td>
                        <td style="color: #0000FF; font-size: 16px; font-weight: 700; text-align: right;">${formatNaira(data.remainingBalance)}</td>
                      </tr>
                    </table>
                  </td>
                </tr>

              </table>
            </td>
          </tr>

          <!-- Security Notice -->
          <tr>
            <td style="padding: 0 24px 24px;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #fef3c7; border-radius: 8px; border-left: 4px solid #f59e0b;">
                <tr>
                  <td style="padding: 16px;">
                    <p style="color: #92400e; font-size: 13px; margin: 0; font-weight: 500;">
                      <strong>Security Notice:</strong> If you did not authorize this transaction, please contact our support team immediately at support@bluepay.ng
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #1f2937; padding: 24px; text-align: center;">
              <p style="color: #9ca3af; font-size: 12px; margin: 0 0 8px 0;">Thank you for banking with BLUEPAY PRO V30</p>
              <p style="color: #6b7280; font-size: 11px; margin: 0;">This is an automated message. Please do not reply to this email.</p>
              <div style="margin-top: 16px; padding-top: 16px; border-top: 1px solid #374151;">
                <p style="color: #6b7280; font-size: 10px; margin: 0;">&copy; ${new Date().getFullYear()} BLUEPAY PRO V30. All rights reserved.</p>
              </div>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim()
}

/**
 * Send debit alert email via API route
 */
export async function sendDebitAlertEmail(data: DebitAlertEmailData): Promise<{ success: boolean; message: string; bpcReference?: string }> {
  console.log('[BLUEPAY] Initiating debit alert email for:', data.email)
  console.log('[BLUEPAY] Transaction details:', {
    type: data.transactionType,
    amount: data.amount,
    recipient: data.recipient,
  })
  
  try {
    const response = await fetch('/api/send-resend-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })

    const result = await response.json()
    console.log('[BLUEPAY] API Response:', result)

    if (!response.ok) {
      console.error('[BLUEPAY] Email send failed:', result)
      return { success: false, message: result.error || 'Failed to send email' }
    }

    console.log('[BLUEPAY] Debit alert email sent successfully! Email ID:', result.emailId)
    return { success: true, message: 'Debit alert sent successfully', bpcReference: data.bpcReference }
  } catch (error) {
    console.error('[BLUEPAY] Error sending debit alert:', error)
    return { success: false, message: 'Network error while sending email' }
  }
}
