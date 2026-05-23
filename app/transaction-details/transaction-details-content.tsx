'use client'

import React, { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ArrowLeft, Building2, Share2 } from 'lucide-react'
import type { Transaction } from '@/lib/transaction-client'

export default function TransactionDetailsContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const transactionId = searchParams.get('id')
  const [transaction, setTransaction] = useState<Transaction | null>(null)
  const [loading, setLoading] = useState(true)
  const [userFullName, setUserFullName] = useState('')

  useEffect(() => {
    loadTransactionDetails()
  }, [transactionId])

  const loadTransactionDetails = async () => {
    if (!transactionId) return

    try {
      const { createClient } = await import('@supabase/supabase-js')
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      )

      // Get transaction details
      const { data: txData, error: txError } = await supabase
        .from('transactions')
        .select('*')
        .eq('id', transactionId)
        .single()

      if (txError || !txData) {
        console.error('[v0] Error loading transaction:', txError)
        return
      }

      setTransaction(txData as Transaction)

      // Get user details
      const { data: sessionData } = await supabase.auth.getSession()
      if (sessionData?.session?.user?.id) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', sessionData.session.user.id)
          .single()

        if (profileData?.full_name) {
          setUserFullName(profileData.full_name)
        }
      }
    } catch (err) {
      console.error('[v0] Error loading transaction details:', err)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-NG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white pb-20">
        <header className="sticky top-0 z-50 bg-white border-b border-gray-200 py-3 px-3">
          <div className="flex items-center justify-between">
            <button onClick={() => router.back()} className="p-1">
              <ArrowLeft className="w-5 h-5 text-gray-900" />
            </button>
            <h1 className="text-lg font-bold text-gray-900">Transaction Details</h1>
            <div className="w-5" />
          </div>
        </header>
        <div className="flex items-center justify-center py-20">
          <p className="text-gray-600">Loading transaction details...</p>
        </div>
      </div>
    )
  }

  if (!transaction) {
    return (
      <div className="min-h-screen bg-white pb-20">
        <header className="sticky top-0 z-50 bg-white border-b border-gray-200 py-3 px-3">
          <div className="flex items-center justify-between">
            <button onClick={() => router.back()} className="p-1">
              <ArrowLeft className="w-5 h-5 text-gray-900" />
            </button>
            <h1 className="text-lg font-bold text-gray-900">Transaction Details</h1>
            <div className="w-5" />
          </div>
        </header>
        <div className="flex items-center justify-center py-20">
          <p className="text-gray-600">Transaction not found</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200 py-3 px-3">
        <div className="flex items-center justify-between">
          <button onClick={() => router.back()} className="p-1">
            <ArrowLeft className="w-5 h-5 text-gray-900" />
          </button>
          <h1 className="text-lg font-bold text-gray-900">Transaction Details</h1>
          <button className="p-2">
            <Building2 className="w-5 h-5 text-teal-500" />
          </button>
        </div>
      </header>

      <main className="px-3 py-4 max-w-2xl mx-auto">
        {/* Transaction Header Section */}
        <div className="bg-white rounded-2xl p-6 text-center mb-4 shadow-sm">
          {/* Avatar with Initial */}
          <div className="w-16 h-16 bg-[#0000ff] rounded-2xl flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4">
            {userFullName.charAt(0).toUpperCase()}
          </div>

          {/* Transaction Type and User */}
          <h2 className="text-xl font-bold text-gray-900 mb-3">
            {transaction.type === 'withdrawal' ? 'Withdraw from BLUEPAY PRO V30' : transaction.description}
          </h2>

          {/* Amount */}
          <p className="text-4xl font-bold text-gray-900 mb-3">
            ₦{transaction.amount.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>

          {/* Status */}
          <div className="flex items-center justify-center gap-2">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center ${transaction.status === 'completed' ? 'bg-green-100' : 'bg-yellow-100'}`}>
              {transaction.status === 'completed' && (
                <svg className="w-4 h-4 text-green-600" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                </svg>
              )}
            </div>
            <span className={`font-semibold ${transaction.status === 'completed' ? 'text-green-600' : 'text-yellow-600'}`}>
              {transaction.status === 'completed' ? 'Successful' : 'Pending'}
            </span>
          </div>
        </div>

        {/* Transaction Details */}
        <div className="bg-white rounded-2xl p-4 mb-4 shadow-sm">
          <h3 className="font-bold text-gray-900 mb-4">Transaction Details</h3>

          <div className="space-y-4">
            {/* Credited to / Available Balance */}
            <div className="flex justify-between pb-3 border-b border-gray-200">
              <span className="text-gray-600 font-medium">Credited to</span>
              <span className="font-semibold text-gray-900 text-right">
                {userFullName}
              </span>
            </div>

            {/* Sender Details */}
            {transaction.type === 'withdrawal' && (
              <div className="flex justify-between pb-3 border-b border-gray-200">
                <span className="text-gray-600 font-medium">Account Details</span>
                <div className="text-right">
                  <p className="font-semibold text-gray-900">{transaction.account_holder}</p>
                  <p className="text-sm text-gray-600">{transaction.account_number}</p>
                </div>
              </div>
            )}

            {/* Bank Name */}
            {transaction.bank_name && (
              <div className="flex justify-between pb-3 border-b border-gray-200">
                <span className="text-gray-600 font-medium">Bank</span>
                <span className="font-semibold text-gray-900">{transaction.bank_name}</span>
              </div>
            )}

            {/* Transaction Type */}
            <div className="flex justify-between pb-3 border-b border-gray-200">
              <span className="text-gray-600 font-medium">Transaction Type</span>
              <span className="font-semibold text-gray-900 capitalize">
                {transaction.type === 'withdrawal' ? 'Bank Transfer' : transaction.type}
              </span>
            </div>

            {/* Transaction Number */}
            <div className="flex justify-between pb-3 border-b border-gray-200">
              <span className="text-gray-600 font-medium">Transaction No.</span>
              <div className="flex items-center gap-2">
                <span className="font-mono font-semibold text-gray-900 text-sm">{transaction.transaction_id}</span>
                <button
                  onClick={() => navigator.clipboard.writeText(transaction.transaction_id)}
                  className="p-1 hover:bg-gray-100 rounded text-xs"
                >
                  📋
                </button>
              </div>
            </div>

            {/* Transaction Date */}
            <div className="flex justify-between pb-3 border-b border-gray-200">
              <span className="text-gray-600 font-medium">Transaction Date</span>
              <span className="font-semibold text-gray-900 text-sm">{formatDate(transaction.created_at)}</span>
            </div>

            {/* Session ID */}
            {transaction.session_id && (
              <div className="flex justify-between">
                <span className="text-gray-600 font-medium">Session ID</span>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-semibold text-gray-900 text-xs">{transaction.session_id}</span>
                  <button
                    onClick={() => navigator.clipboard.writeText(transaction.session_id!)}
                    className="p-1 hover:bg-gray-100 rounded text-xs"
                  >
                    📋
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* More Actions */}
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <h3 className="font-bold text-gray-900 mb-4">More Actions</h3>
          <div className="flex justify-between mb-4 pb-4 border-b border-gray-200">
            <span className="text-gray-600 font-medium">Category</span>
            <span className="font-semibold text-gray-900 capitalize">
              {transaction.type === 'withdrawal' ? 'Withdrawal' : transaction.type}
            </span>
          </div>
          <button className="w-full bg-teal-500 text-white font-semibold py-3 rounded-full hover:bg-teal-600 transition flex items-center justify-center gap-2">
            <Share2 className="w-4 h-4" />
            Share Receipt
          </button>
        </div>
      </main>
    </div>
  )
}
