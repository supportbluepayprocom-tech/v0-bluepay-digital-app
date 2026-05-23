/**
 * BLUEPAY PRO V30 - Server-Side Email Service
 * Centralized email utility using Resend API
 * 
 * IMPORTANT: This file should only be used in server-side code (API routes, server actions)
 * Never import this in client components
 */

import { Resend } from 'resend'

// Default sender - no domain verification required for testing
const DEFAULT_SENDER = 'BLUEPAY PRO V30 <onboarding@resend.dev>'

// Initialize Resend with API key
function getResendClient(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    console.warn('[BLUEPAY Email] RESEND_API_KEY not configured')
    return null
  }
  return new Resend(apiKey)
}

// ==================== Types ====================

export interface DebitAlertData {
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

export interface TransactionReceiptData {
  email: string
  fullName: string
  amount: number
  transactionType: string
  recipient: string
  transactionId: string
  dateTime: string
  status: 'Successful' | 'Pending' | 'Failed'
}

export interface OTPEmailData {
  email: string
  fullName?: string
  otp: string
  purpose: 'login' | 'signup' | 'transaction' | 'password_reset'
  expiresIn?: string
}

export interface EmailResult {
  success: boolean
  message: string
  emailId?: string
}

// ==================== Utility Functions ====================

export function generateBPCReference(): string {
  const digits = '0123456789'
  let reference = 'BPC'
  for (let i = 0; i < 10; i++) {
    reference += digits.charAt(Math.floor(Math.random() * digits.length))
  }
  return reference
}

export function generateTransactionId(): string {
  const prefix = 'TX'
  const timestamp = Date.now().toString().slice(-8)
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0')
  return `${prefix}${timestamp}${random}`
}

export function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

export function formatNaira(amount: number): string {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount).replace('NGN', '₦')
}

export function getFormattedDateTime(): string {
  return new Date().toLocaleString('en-NG', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  })
}

// ==================== Email Templates ====================

function generateDebitAlertHTML(data: DebitAlertData): string {
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
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width: 500px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #0000FF 0%, #1a1aff 100%); padding: 32px 24px; text-align: center;">
              <div style="display: inline-block; background-color: #ffffff; border-radius: 12px; padding: 12px 20px; margin-bottom: 16px;">
                <span style="font-size: 24px; font-weight: 800; color: #0000FF; letter-spacing: -0.5px;">BLUEPAY</span>
                <span style="font-size: 12px; font-weight: 600; color: #0000FF; display: block; margin-top: -4px;">PRO V30</span>
              </div>
              <h1 style="color: #ffffff; font-size: 20px; font-weight: 600; margin: 0;">DEBIT ALERT</h1>
            </td>
          </tr>

          <!-- Amount -->
          <tr>
            <td style="padding: 32px 24px 24px; text-align: center; border-bottom: 1px solid #e5e7eb;">
              <p style="color: #6b7280; font-size: 14px; margin: 0 0 8px 0; text-transform: uppercase; letter-spacing: 1px;">Amount Debited</p>
              <p style="color: #ef4444; font-size: 36px; font-weight: 700; margin: 0;">-${formatNaira(data.amount)}</p>
            </td>
          </tr>

          <!-- Greeting -->
          <tr>
            <td style="padding: 24px 24px 16px;">
              <p style="color: #1f2937; font-size: 16px; margin: 0;">Dear <strong>${data.fullName}</strong>,</p>
              <p style="color: #4b5563; font-size: 14px; margin: 12px 0 0 0;">A transaction has been processed on your BLUEPAY PRO V30 account:</p>
            </td>
          </tr>

          <!-- Transaction Details -->
          <tr>
            <td style="padding: 0 24px 24px;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f9fafb; border-radius: 12px;">
                <tr><td style="padding: 16px 20px; border-bottom: 1px solid #e5e7eb;">
                  <table width="100%"><tr>
                    <td style="color: #6b7280; font-size: 13px;">Transaction Type</td>
                    <td style="color: #1f2937; font-size: 14px; font-weight: 600; text-align: right;">${data.transactionType}</td>
                  </tr></table>
                </td></tr>
                <tr><td style="padding: 16px 20px; border-bottom: 1px solid #e5e7eb;">
                  <table width="100%"><tr>
                    <td style="color: #6b7280; font-size: 13px;">Recipient/Service</td>
                    <td style="color: #1f2937; font-size: 14px; font-weight: 600; text-align: right;">${data.recipient}</td>
                  </tr></table>
                </td></tr>
                <tr><td style="padding: 16px 20px; border-bottom: 1px solid #e5e7eb;">
                  <table width="100%"><tr>
                    <td style="color: #6b7280; font-size: 13px;">BPC Reference</td>
                    <td style="color: #0000FF; font-size: 14px; font-weight: 700; text-align: right; font-family: monospace;">${data.bpcReference}</td>
                  </tr></table>
                </td></tr>
                <tr><td style="padding: 16px 20px; border-bottom: 1px solid #e5e7eb;">
                  <table width="100%"><tr>
                    <td style="color: #6b7280; font-size: 13px;">Date & Time</td>
                    <td style="color: #1f2937; font-size: 13px; font-weight: 500; text-align: right;">${data.dateTime}</td>
                  </tr></table>
                </td></tr>
                <tr><td style="padding: 16px 20px; border-bottom: 1px solid #e5e7eb;">
                  <table width="100%"><tr>
                    <td style="color: #6b7280; font-size: 13px;">Status</td>
                    <td style="text-align: right;">
                      <span style="background-color: ${statusBg}; color: ${statusColor}; font-size: 12px; font-weight: 600; padding: 4px 12px; border-radius: 20px;">${data.status}</span>
                    </td>
                  </tr></table>
                </td></tr>
                <tr><td style="padding: 16px 20px; background-color: #eff6ff;">
                  <table width="100%"><tr>
                    <td style="color: #0000FF; font-size: 13px; font-weight: 600;">Remaining Balance</td>
                    <td style="color: #0000FF; font-size: 16px; font-weight: 700; text-align: right;">${formatNaira(data.remainingBalance)}</td>
                  </tr></table>
                </td></tr>
              </table>
            </td>
          </tr>

          <!-- Security Notice -->
          <tr>
            <td style="padding: 0 24px 24px;">
              <div style="background-color: #fef3c7; border-radius: 8px; border-left: 4px solid #f59e0b; padding: 16px;">
                <p style="color: #92400e; font-size: 13px; margin: 0;">
                  <strong>Security Notice:</strong> If you did not authorize this transaction, please contact support immediately.
                </p>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #1f2937; padding: 24px; text-align: center;">
              <p style="color: #9ca3af; font-size: 12px; margin: 0 0 8px 0;">Thank you for banking with BLUEPAY PRO V30</p>
              <p style="color: #6b7280; font-size: 10px; margin: 0;">&copy; ${new Date().getFullYear()} BLUEPAY PRO V30. All rights reserved.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`.trim()
}

function generateTransactionReceiptHTML(data: TransactionReceiptData): string {
  const statusColor = data.status === 'Successful' ? '#22c55e' : data.status === 'Pending' ? '#f59e0b' : '#ef4444'

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>BLUEPAY PRO V30 - Transaction Receipt</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f3f4f6; line-height: 1.6;">
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f3f4f6;">
    <tr>
      <td style="padding: 40px 20px;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width: 500px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #0000FF 0%, #1a1aff 100%); padding: 32px 24px; text-align: center;">
              <div style="display: inline-block; background-color: #ffffff; border-radius: 12px; padding: 12px 20px; margin-bottom: 16px;">
                <span style="font-size: 24px; font-weight: 800; color: #0000FF;">BLUEPAY</span>
                <span style="font-size: 12px; font-weight: 600; color: #0000FF; display: block; margin-top: -4px;">PRO V30</span>
              </div>
              <h1 style="color: #ffffff; font-size: 20px; font-weight: 600; margin: 0;">TRANSACTION RECEIPT</h1>
            </td>
          </tr>

          <!-- Success Icon -->
          <tr>
            <td style="padding: 32px 24px 16px; text-align: center;">
              <div style="width: 64px; height: 64px; background-color: #dcfce7; border-radius: 50%; margin: 0 auto 16px; display: flex; align-items: center; justify-content: center;">
                <span style="color: #22c55e; font-size: 32px;">&#10003;</span>
              </div>
              <h2 style="color: #1f2937; font-size: 20px; margin: 0;">Transaction ${data.status}</h2>
            </td>
          </tr>

          <!-- Amount -->
          <tr>
            <td style="padding: 0 24px 24px; text-align: center;">
              <p style="color: #6b7280; font-size: 14px; margin: 0 0 8px 0;">Amount</p>
              <p style="color: #1f2937; font-size: 32px; font-weight: 700; margin: 0;">${formatNaira(data.amount)}</p>
            </td>
          </tr>

          <!-- Details -->
          <tr>
            <td style="padding: 0 24px 24px;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f9fafb; border-radius: 12px;">
                <tr><td style="padding: 16px 20px; border-bottom: 1px solid #e5e7eb;">
                  <table width="100%"><tr>
                    <td style="color: #6b7280; font-size: 13px;">Recipient</td>
                    <td style="color: #1f2937; font-size: 14px; font-weight: 600; text-align: right;">${data.recipient}</td>
                  </tr></table>
                </td></tr>
                <tr><td style="padding: 16px 20px; border-bottom: 1px solid #e5e7eb;">
                  <table width="100%"><tr>
                    <td style="color: #6b7280; font-size: 13px;">Transaction ID</td>
                    <td style="color: #0000FF; font-size: 14px; font-weight: 700; text-align: right; font-family: monospace;">${data.transactionId}</td>
                  </tr></table>
                </td></tr>
                <tr><td style="padding: 16px 20px; border-bottom: 1px solid #e5e7eb;">
                  <table width="100%"><tr>
                    <td style="color: #6b7280; font-size: 13px;">Type</td>
                    <td style="color: #1f2937; font-size: 14px; font-weight: 500; text-align: right;">${data.transactionType}</td>
                  </tr></table>
                </td></tr>
                <tr><td style="padding: 16px 20px;">
                  <table width="100%"><tr>
                    <td style="color: #6b7280; font-size: 13px;">Date & Time</td>
                    <td style="color: #1f2937; font-size: 13px; text-align: right;">${data.dateTime}</td>
                  </tr></table>
                </td></tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #1f2937; padding: 24px; text-align: center;">
              <p style="color: #9ca3af; font-size: 12px; margin: 0 0 8px 0;">Thank you for using BLUEPAY PRO V30</p>
              <p style="color: #6b7280; font-size: 10px; margin: 0;">&copy; ${new Date().getFullYear()} BLUEPAY PRO V30</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`.trim()
}

function generateOTPEmailHTML(data: OTPEmailData): string {
  const purposeText = {
    login: 'sign in to your account',
    signup: 'verify your email address',
    transaction: 'authorize this transaction',
    password_reset: 'reset your password',
  }[data.purpose]

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>BLUEPAY PRO V30 - Verification Code</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f3f4f6; line-height: 1.6;">
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f3f4f6;">
    <tr>
      <td style="padding: 40px 20px;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width: 500px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #0000FF 0%, #1a1aff 100%); padding: 32px 24px; text-align: center;">
              <div style="display: inline-block; background-color: #ffffff; border-radius: 12px; padding: 12px 20px; margin-bottom: 16px;">
                <span style="font-size: 24px; font-weight: 800; color: #0000FF;">BLUEPAY</span>
                <span style="font-size: 12px; font-weight: 600; color: #0000FF; display: block; margin-top: -4px;">PRO V30</span>
              </div>
              <h1 style="color: #ffffff; font-size: 20px; font-weight: 600; margin: 0;">VERIFICATION CODE</h1>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 32px 24px;">
              <p style="color: #1f2937; font-size: 16px; margin: 0 0 16px 0;">
                ${data.fullName ? `Hello <strong>${data.fullName}</strong>,` : 'Hello,'}
              </p>
              <p style="color: #4b5563; font-size: 14px; margin: 0 0 24px 0;">
                Use the verification code below to ${purposeText}:
              </p>
              
              <!-- OTP Code -->
              <div style="background-color: #f0f0ff; border: 2px dashed #0000FF; border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 24px;">
                <p style="color: #0000FF; font-size: 40px; font-weight: 800; letter-spacing: 8px; margin: 0; font-family: monospace;">${data.otp}</p>
              </div>
              
              <p style="color: #6b7280; font-size: 13px; margin: 0 0 16px 0;">
                This code will expire in <strong>${data.expiresIn || '10 minutes'}</strong>.
              </p>
              
              <div style="background-color: #fef3c7; border-radius: 8px; border-left: 4px solid #f59e0b; padding: 16px;">
                <p style="color: #92400e; font-size: 13px; margin: 0;">
                  <strong>Security Warning:</strong> Never share this code with anyone. BLUEPAY will never ask for your OTP via phone or chat.
                </p>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #1f2937; padding: 24px; text-align: center;">
              <p style="color: #9ca3af; font-size: 12px; margin: 0 0 8px 0;">If you did not request this code, please ignore this email.</p>
              <p style="color: #6b7280; font-size: 10px; margin: 0;">&copy; ${new Date().getFullYear()} BLUEPAY PRO V30</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`.trim()
}

// ==================== Email Sending Functions ====================

/**
 * Send Debit Alert Email
 * Call this after a successful transaction is processed
 */
export async function sendDebitAlertEmail(data: DebitAlertData): Promise<EmailResult> {
  const resend = getResendClient()
  
  if (!resend) {
    console.log('[BLUEPAY Email] Demo mode - Debit alert would be sent to:', data.email)
    return { success: true, message: 'Email queued (demo mode)' }
  }

  try {
    const { data: emailData, error } = await resend.emails.send({
      from: DEFAULT_SENDER,
      to: data.email,
      subject: `BLUEPAY Debit Alert - ${data.transactionType} - ${formatNaira(data.amount)}`,
      html: generateDebitAlertHTML(data),
    })

    if (error) {
      console.error('[BLUEPAY Email] Failed to send debit alert:', error)
      return { success: false, message: error.message || 'Failed to send email' }
    }

    console.log('[BLUEPAY Email] Debit alert sent:', emailData?.id)
    return { success: true, message: 'Debit alert sent', emailId: emailData?.id }
  } catch (error) {
    console.error('[BLUEPAY Email] Error:', error)
    return { success: false, message: 'Failed to send debit alert email' }
  }
}

/**
 * Send Transaction Receipt Email
 * Call this immediately after payment success
 */
export async function sendTransactionReceiptEmail(data: TransactionReceiptData): Promise<EmailResult> {
  const resend = getResendClient()
  
  if (!resend) {
    console.log('[BLUEPAY Email] Demo mode - Receipt would be sent to:', data.email)
    return { success: true, message: 'Email queued (demo mode)' }
  }

  try {
    const { data: emailData, error } = await resend.emails.send({
      from: DEFAULT_SENDER,
      to: data.email,
      subject: `BLUEPAY Receipt - ${data.transactionType} - ${formatNaira(data.amount)}`,
      html: generateTransactionReceiptHTML(data),
    })

    if (error) {
      console.error('[BLUEPAY Email] Failed to send receipt:', error)
      return { success: false, message: error.message || 'Failed to send email' }
    }

    console.log('[BLUEPAY Email] Receipt sent:', emailData?.id)
    return { success: true, message: 'Receipt sent', emailId: emailData?.id }
  } catch (error) {
    console.error('[BLUEPAY Email] Error:', error)
    return { success: false, message: 'Failed to send receipt email' }
  }
}

/**
 * Send OTP Verification Email
 * Call this for login, signup, or sensitive actions
 */
export async function sendOTPEmail(data: OTPEmailData): Promise<EmailResult> {
  const resend = getResendClient()
  
  if (!resend) {
    console.log('[BLUEPAY Email] Demo mode - OTP would be sent to:', data.email, 'Code:', data.otp)
    return { success: true, message: 'OTP queued (demo mode)' }
  }

  const subjectMap = {
    login: 'Your Login Verification Code',
    signup: 'Verify Your Email Address',
    transaction: 'Transaction Authorization Code',
    password_reset: 'Password Reset Code',
  }

  try {
    const { data: emailData, error } = await resend.emails.send({
      from: DEFAULT_SENDER,
      to: data.email,
      subject: `BLUEPAY - ${subjectMap[data.purpose]}`,
      html: generateOTPEmailHTML(data),
    })

    if (error) {
      console.error('[BLUEPAY Email] Failed to send OTP:', error)
      return { success: false, message: error.message || 'Failed to send OTP' }
    }

    console.log('[BLUEPAY Email] OTP sent:', emailData?.id)
    return { success: true, message: 'OTP sent', emailId: emailData?.id }
  } catch (error) {
    console.error('[BLUEPAY Email] Error:', error)
    return { success: false, message: 'Failed to send OTP email' }
  }
}
