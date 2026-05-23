/**
 * BLUEPAY PRO V30 - Client-side Email Utilities
 * 
 * This file provides client-side functions to trigger emails via API routes.
 * All actual email sending happens on the server side.
 */

// Re-export types for convenience
export type { DebitAlertData, TransactionReceiptData, OTPEmailData } from '@/lib/email/email-service'

// Re-export utility functions that are safe for client use
export { generateBPCReference, generateTransactionId, formatNaira, getFormattedDateTime } from '@/lib/email/email-service'

// For backward compatibility - map old type to new type
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
 * Send debit alert email via API route
 * This is safe to call from client components
 */
export async function sendDebitAlertEmail(data: DebitAlertEmailData): Promise<{ success: boolean; message: string; bpcReference?: string }> {
  try {
    const response = await fetch('/api/email/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'debit_alert',
        data: data,
      }),
    })

    const result = await response.json()

    if (!response.ok) {
      console.error('[BLUEPAY] Email send failed:', result)
      return { success: false, message: result.error || 'Failed to send email' }
    }

    return { success: true, message: 'Debit alert sent successfully', bpcReference: data.bpcReference }
  } catch (error) {
    console.error('[BLUEPAY] Error sending debit alert:', error)
    return { success: false, message: 'Network error while sending email' }
  }
}

/**
 * Send transaction receipt email via API route
 */
export async function sendTransactionReceiptEmail(data: {
  email: string
  fullName: string
  amount: number
  transactionType: string
  recipient: string
  transactionId: string
  dateTime: string
  status: 'Successful' | 'Pending' | 'Failed'
}): Promise<{ success: boolean; message: string }> {
  try {
    const response = await fetch('/api/email/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'receipt',
        data: data,
      }),
    })

    const result = await response.json()

    if (!response.ok) {
      return { success: false, message: result.error || 'Failed to send receipt' }
    }

    return { success: true, message: 'Receipt sent successfully' }
  } catch (error) {
    console.error('[BLUEPAY] Error sending receipt:', error)
    return { success: false, message: 'Network error while sending receipt' }
  }
}

/**
 * Request OTP verification email
 */
export async function requestOTPEmail(data: {
  email: string
  fullName?: string
  purpose: 'login' | 'signup' | 'transaction' | 'password_reset'
}): Promise<{ success: boolean; message: string; otp?: string }> {
  try {
    const response = await fetch('/api/email/otp', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })

    const result = await response.json()

    if (!response.ok) {
      return { success: false, message: result.error || 'Failed to send OTP' }
    }

    return { success: true, message: 'Verification code sent', otp: result.otp }
  } catch (error) {
    console.error('[BLUEPAY] Error requesting OTP:', error)
    return { success: false, message: 'Network error while sending OTP' }
  }
}
