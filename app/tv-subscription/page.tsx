'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronLeft, Check, Eye, EyeOff, AlertCircle } from 'lucide-react'
import { sendDebitAlert, generateTransactionId, getCurrentDateTime } from '@/lib/debit-alert'
import { createClient } from '@supabase/supabase-js'
import { addTransaction, deductBalance } from '@/lib/balance-store'
import { validateBPCCode } from '@/lib/bpc-validator'
import BPCCodeValidator from '@/components/BPCCodeValidator'

export default function TVSubscriptionPage() {
  const router = useRouter()
  const [step, setStep] = useState<'select' | 'confirm' | 'countdown' | 'success'>('select')
  const [selectedProvider, setSelectedProvider] = useState('')
  const [selectedPlan, setSelectedPlan] = useState('')
  const [bpcCode, setBpcCode] = useState('')
  const [bpcIsValid, setBpcIsValid] = useState(false)
  const [bpcError, setBpcError] = useState('')
  const [showBpc, setShowBpc] = useState(false)
  const [loading, setLoading] = useState(false)
  const [countdown, setCountdown] = useState(0)
  const [fullName, setFullName] = useState('')
  const [userEmail, setUserEmail] = useState('')
  const [transactionId, setTransactionId] = useState('')

  const providers = [
    { id: 'dstv', name: 'DStv', plans: [
      { id: 'lite', name: 'Lite', price: 3900 },
      { id: 'compact', name: 'Compact', price: 9900 },
      { id: 'premium', name: 'Premium', price: 27500 },
    ]},
    { id: 'gotv', name: 'GoTV', plans: [
      { id: 'lite', name: 'Lite', price: 1500 },
      { id: 'max', name: 'Max', price: 3800 },
      { id: 'jinja', name: 'Jinja', price: 9100 },
    ]},
    { id: 'startimes', name: 'StarTimes', plans: [
      { id: 'basic', name: 'Basic', price: 1900 },
      { id: 'classic', name: 'Classic', price: 4500 },
      { id: 'premium', name: 'Premium', price: 9800 },
    ]},
    { id: 'showmax', name: 'ShowMax', plans: [
      { id: 'standard', name: 'Standard', price: 3999 },
      { id: 'premium', name: 'Premium', price: 5999 },
    ]},
    { id: 'nollywood', name: 'Nollywood+', plans: [
      { id: 'monthly', name: 'Monthly', price: 1999 },
      { id: 'quarterly', name: 'Quarterly', price: 4999 },
    ]},
  ]

  useEffect(() => {
    const loadUserData = async () => {
      try {
        const supabase = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        )
        const { data: { session } } = await supabase.auth.getSession()
        if (session?.user) {
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
  }, [])

  useEffect(() => {
    if (step === 'countdown' && countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
      return () => clearTimeout(timer)
    } else if (step === 'countdown' && countdown === 0 && step === 'countdown') {
      // Record transaction and update balance
      try {
        const provider = providers.find(p => p.id === selectedProvider)
        const plan = provider?.plans.find(pl => pl.id === selectedPlan)
        const amount = plan?.price || 0
        deductBalance(amount)
        addTransaction({
          type: 'tv',
          description: `${provider?.name} ${plan?.name} - NGN${amount.toLocaleString()}`,
          amount: -amount,
          status: 'success',
        })
        // Dispatch events to notify dashboard
        window.dispatchEvent(new Event('balanceChange'))
        window.dispatchEvent(new Event('transactionsChange'))
      } catch (err) {
        console.error('[v0] Error recording TV subscription transaction:', err)
      }
      setStep('success')
    }
  }, [countdown, step, selectedProvider, selectedPlan])

  const currentProvider = providers.find(p => p.id === selectedProvider)
  const currentPlan = currentProvider?.plans.find(pl => pl.id === selectedPlan)

  const handleActivateSubscription = async () => {
    if (!bpcCode.trim()) {
      alert('Please enter your BPC CODE')
      return
    }

    setCountdown(7)
    setStep('countdown')

    // Send debit alert
    const txId = generateTransactionId()
    setTransactionId(txId)

    await sendDebitAlert({
      email: userEmail,
      full_name: fullName,
      transaction_type: 'TV Subscription',
      amount: currentPlan?.price || 0,
      recipient_name: currentProvider?.name || '',
      recipient_account_number: bpcCode,
      recipient_bank_name: currentPlan?.name || '',
      transaction_id: txId,
      transaction_date: getCurrentDateTime(),
    })
  }

  const handleProceed = () => {
    setCountdown(7)
    setStep('countdown')
  }

  if (step === 'success') {
    return (
      <div className="min-h-screen bg-gray-50 pb-8">
        <div className="sticky top-0 z-40 bg-white border-b border-gray-200 px-4 py-4">
          <div className="flex items-center gap-3 max-w-2xl mx-auto">
            <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 rounded-lg">
              <ChevronLeft className="w-6 h-6 text-gray-900" />
            </button>
            <h1 className="text-xl font-bold text-gray-900">Subscription Activated</h1>
          </div>
        </div>

        <div className="max-w-2xl mx-auto px-4 pt-4">
          <div className="bg-gradient-to-b from-green-50 to-blue-50 rounded-2xl p-3 text-center">
            <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Subscription Activated!</h2>
            <p className="text-gray-600 mb-2">Your TV subscription is now active and ready to use.</p>

            <div className="bg-white rounded-xl p-4 border border-gray-200 space-y-3 mb-2 text-left">
              <div>
                <p className="text-xs text-gray-600 mb-1">User Name</p>
                <p className="font-bold text-gray-900">Guest User</p>
              </div>
              <div>
                <p className="text-xs text-gray-600 mb-1">Transaction Date & Time</p>
                <p className="font-bold text-gray-900 text-xs">{getCurrentDateTime()}</p>
              </div>
              <div>
                <p className="text-xs text-gray-600 mb-1">Provider</p>
                <p className="font-bold text-gray-900">{currentProvider?.name}</p>
              </div>
              <div>
                <p className="text-xs text-gray-600 mb-1">Plan</p>
                <p className="font-bold text-gray-900">{currentPlan?.name}</p>
              </div>
              <div>
                <p className="text-xs text-gray-600 mb-1">Amount</p>
                <p className="font-bold text-[#0000ff]">NGN {currentPlan?.price.toLocaleString()}.00</p>
              </div>
              <div>
                <p className="text-xs text-gray-600 mb-1">Transaction ID</p>
                <p className="font-mono font-bold text-gray-900 text-xs">{transactionId}</p>
              </div>
            </div>

            <button
              onClick={() => router.push('/dashboard')}
              className="w-full bg-[#0000ff] text-white font-bold py-3 rounded-xl hover:opacity-90 transition"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (step === 'countdown') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center pb-8">
        <div className="max-w-2xl mx-auto px-4 text-center">
          <div className="text-6xl font-bold text-[#0000ff] mb-4 tabular-nums">{countdown}</div>
          <p className="text-gray-600 text-lg">Processing your TV subscription...</p>
          <p className="text-gray-500 text-sm mt-2">Please wait while we activate your subscription</p>
        </div>
      </div>
    )
  }

  if (step === 'confirm') {
    return (
      <div className="min-h-screen bg-gray-50 pb-8">
        <div className="sticky top-0 z-40 bg-white border-b border-gray-200 px-4 py-4">
          <div className="flex items-center gap-3 max-w-2xl mx-auto">
            <button onClick={() => setStep('select')} className="p-2 hover:bg-gray-100 rounded-lg">
              <ChevronLeft className="w-6 h-6 text-gray-900" />
            </button>
            <h1 className="text-xl font-bold text-gray-900">Confirm Details</h1>
          </div>
        </div>

        <div className="max-w-2xl mx-auto px-4 pt-6">
          <div className="bg-white rounded-xl p-3 border border-gray-200 space-y-4 mb-2">
            <h3 className="font-bold text-gray-900 text-lg">Subscription Summary</h3>

            <div className="space-y-3">
              <div className="flex justify-between pb-3 border-b border-gray-200">
                <span className="text-gray-600">Provider</span>
                <span className="font-bold text-gray-900">{currentProvider?.name}</span>
              </div>
              <div className="flex justify-between pb-3 border-b border-gray-200">
                <span className="text-gray-600">Plan</span>
                <span className="font-bold text-gray-900">{currentPlan?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Amount</span>
                <span className="font-bold text-[#0000ff]">NGN {currentPlan?.price.toLocaleString()}.00</span>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <button
              onClick={() => setStep('select')}
              className="w-full bg-gray-200 text-gray-900 font-bold py-3 rounded-xl hover:bg-gray-300 transition"
            >
              EDIT
            </button>
            
            {/* BPC Code Validator */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-4">
              <div className="flex gap-2 items-start mb-3">
                <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <p className="text-yellow-900 text-sm">
                  <strong>Important:</strong> You must provide a valid Bank Processing Code (BPC Code) to complete this transaction. Generate one from BLUEPAY PRO V30 services.
                </p>
              </div>
              <BPCCodeValidator
                onValidate={(code, isValid) => {
                  setBpcCode(code)
                  setBpcIsValid(isValid)
                  if (!isValid && code.trim()) {
                    setBpcError('Invalid BPC Code. Please obtain a valid Bank Processing Code (BPC) from the BLUEPAY PRO V30 ecosystem.')
                  } else {
                    setBpcError('')
                  }
                }}
                disabled={loading}
              />
            </div>

            <button
              onClick={handleProceed}
              disabled={!bpcIsValid || loading}
              className={`w-full font-bold py-3 rounded-xl transition ${
                bpcIsValid
                  ? 'bg-[#0000ff] text-white hover:opacity-90'
                  : 'bg-gray-300 text-gray-600 cursor-not-allowed'
              }`}
            >
              {loading ? 'Processing...' : 'PROCEED'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-8">
      <div className="sticky top-0 z-40 bg-white border-b border-gray-200 px-4 py-4">
        <div className="flex items-center gap-3 max-w-2xl mx-auto">
          <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 rounded-lg">
            <ChevronLeft className="w-6 h-6 text-gray-900" />
          </button>
          <h1 className="text-xl font-bold text-gray-900">TV Subscription</h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 pt-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">Select TV Provider</label>
            <select
              value={selectedProvider}
              onChange={(e) => {
                setSelectedProvider(e.target.value)
                setSelectedPlan('')
              }}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Choose provider</option>
              {providers.map((provider) => (
                <option key={provider.id} value={provider.id}>{provider.name}</option>
              ))}
            </select>
          </div>

          {selectedProvider && (
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">Select Plan</label>
              <div className="space-y-2">
                {currentProvider?.plans.map((plan) => (
                  <button
                    key={plan.id}
                    type="button"
                    onClick={() => setSelectedPlan(plan.id)}
                    className={`w-full p-3 rounded-lg border-2 transition text-left ${
                      selectedPlan === plan.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <p className="font-semibold text-gray-900">{plan.name}</p>
                      <p className="font-bold text-gray-900">₦{plan.price.toLocaleString()}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {currentPlan && (
            <>
              <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                <p className="text-sm text-gray-600 mb-2">Subscription Summary</p>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-700">Provider</span>
                    <span className="font-bold text-gray-900">{currentProvider?.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-700">Plan</span>
                    <span className="font-bold text-gray-900">{currentPlan.name}</span>
                  </div>
                  <div className="flex justify-between border-t border-blue-200 pt-2 mt-2">
                    <span className="text-gray-700 font-semibold">Total Amount</span>
                    <span className="font-bold text-blue-600">₦{currentPlan.price.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">BPC CODE</label>
                <div className="relative">
                  <input
                    type={showBpc ? 'text' : 'password'}
                    placeholder="Enter your BPC CODE"
                    value={bpcCode}
                    onChange={(e) => setBpcCode(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 pr-12"
                  />
                  <button
                    type="button"
                    onClick={() => setShowBpc(!showBpc)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-900"
                  >
                    {showBpc ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                <p className="text-xs text-gray-600 mt-1">Enter your Bank Processing Code</p>
              </div>

              <button
                onClick={() => setStep('confirm')}
                disabled={!bpcCode.trim()}
                className="w-full bg-[#0000ff] text-white font-bold py-3 rounded-xl hover:opacity-90 disabled:opacity-50 transition mt-2"
              >
                Continue
              </button>

              <a
                href="/buy-bpc"
                className="block w-full text-center bg-gray-200 text-gray-900 font-bold py-3 rounded-xl hover:bg-gray-300 transition"
              >
                Buy BPC
              </a>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
