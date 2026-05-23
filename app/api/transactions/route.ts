import { NextRequest, NextResponse } from 'next/server'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userEmail, fullName, amount, type, description } = body

    if (!userEmail || !amount || !type) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Log transaction to Supabase
    const transactionData = {
      email: userEmail,
      full_name: fullName,
      amount: parseFloat(amount),
      type: type,
      description: description,
      transaction_code: 'BPC2026_PRO_V30_54D',
      status: 'completed',
      created_at: new Date().toISOString(),
    }

    const response = await fetch(`${SUPABASE_URL}/rest/v1/transactions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY || '',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify(transactionData),
    })

    if (!response.ok) {
      console.error('Failed to log transaction:', response.statusText)
      // Don't fail the request if Supabase is unavailable
      // Just log it and continue
    }

    // Send debit alert email
    try {
      await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/send-debit-alert`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: userEmail,
          fullName: fullName,
          amount: amount,
          type: type,
          transactionCode: 'BPC2026_PRO_V30_54D',
        }),
      })
    } catch (emailError) {
      console.error('Failed to send debit alert:', emailError)
    }

    return NextResponse.json({ success: true, transaction: transactionData })
  } catch (error) {
    console.error('Transaction error:', error)
    return NextResponse.json(
      { error: 'Failed to process transaction' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const email = request.nextUrl.searchParams.get('email')

    if (!email) {
      return NextResponse.json(
        { error: 'Email parameter required' },
        { status: 400 }
      )
    }

    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/transactions?email=eq.${email}&order=created_at.desc&limit=50`,
      {
        headers: {
          'apikey': SUPABASE_ANON_KEY || '',
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        },
      }
    )

    if (!response.ok) {
      return NextResponse.json({ transactions: [] })
    }

    const transactions = await response.json()
    return NextResponse.json({ transactions })
  } catch (error) {
    console.error('Error fetching transactions:', error)
    return NextResponse.json({ transactions: [] })
  }
}
