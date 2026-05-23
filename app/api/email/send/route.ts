import { NextRequest, NextResponse } from 'next/server'
import { 
  sendDebitAlertEmail, 
  sendTransactionReceiptEmail,
  type DebitAlertData,
  type TransactionReceiptData
} from '@/lib/email/email-service'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { type, data } = body

    // Validate request
    if (!type || !data) {
      return NextResponse.json(
        { error: 'Missing required fields: type and data' },
        { status: 400 }
      )
    }

    let result

    switch (type) {
      case 'debit_alert':
        // Validate debit alert data
        if (!data.email || !data.amount || !data.transactionType) {
          return NextResponse.json(
            { error: 'Missing required fields for debit alert' },
            { status: 400 }
          )
        }
        result = await sendDebitAlertEmail(data as DebitAlertData)
        break

      case 'receipt':
        // Validate receipt data
        if (!data.email || !data.amount || !data.transactionType) {
          return NextResponse.json(
            { error: 'Missing required fields for receipt' },
            { status: 400 }
          )
        }
        result = await sendTransactionReceiptEmail(data as TransactionReceiptData)
        break

      default:
        return NextResponse.json(
          { error: `Unknown email type: ${type}` },
          { status: 400 }
        )
    }

    if (!result.success) {
      return NextResponse.json(
        { error: result.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: result.message,
      emailId: result.emailId,
    })
  } catch (error) {
    console.error('[BLUEPAY] Email API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
