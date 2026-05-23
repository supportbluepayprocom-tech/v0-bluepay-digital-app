'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft,
  CheckCircle,
  AlertCircle,
  Loader,
  Copy,
  Tv as TvIcon,
  Check,
  Eye,
  EyeOff,
} from 'lucide-react'
import { sendBpcEmail } from '@/lib/bpc-email'
import { generateTransactionId } from '@/lib/debit-alert'
import { getBalance, deductBalance, addTransaction } from '@/lib/balance-store'
import { createClient } from '@supabase/supabase-js'

const CORRECT_BPC_CODE = 'BPC2026_PRO_V30_54D'

export default function TVPage() {
  const router = useRouter()
  const [step, setStep] = useState<'form' | 'confirm' | 'success'>('form')
  const [selectedProvider, setSelectedProvider] = useState('')
  const [selectedPlan, setSelectedPlan] = useState('')
  const [iucNumber, setIucNumber] = useState('')
  const [bpcCode, setBpcCode] = useState('')
  const [showBpcCode, setShowBpcCode] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [bpcError, setBpcError] = useState('')
  const [copied, setCopied] = useState(false)
  const [userEmail, setUserEmail] = useState('')
  const [fullName, setFullName] = useState('')

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

  const providers = [
    { name: 'DSTV', code: 'DSTV' },
    { name: 'GOTV', code: 'GOTV' },
    { name: 'STARTIMES', code: 'STARTIMES' },
    { name: 'SHOWMAX', code: 'SHOWMAX' },
    { name: 'CONSAT', code: 'CONSAT' },
    { name: 'TSTV', code: 'TSTV' },
    { name: 'MYTV', code: 'MYTV' },
  ]

  const plans = {
    DSTV: [
      { name: 'Access', price: 3750, duration: '1 month', channels: 75 },
      { name: 'Compact', price: 7500, duration: '1 month', channels: 120 },
      { name: 'Compact Plus', price: 12500, duration: '1 month', channels: 150 },
      { name: 'Premium', price: 19500, duration: '1 month', channels: 180 },
      { name: 'Premium Asia', price: 22500, duration: '1 month', channels: 200 },
    ],
    GOTV: [
      { name: 'Max', price: 4700, duration: '1 month', channels: 80 },
      { name: 'Plus', price: 7200, duration: '1 month', channels: 110 },
      { name: 'Jinja', price: 9750, duration: '1 month', channels: 150 },
    ],
    STARTIMES: [
      { name: 'Basic', price: 1050, duration: '1 month', channels: 30 },
      { name: 'Smart', price: 1800, duration: '1 month', channels: 50 },
      { name: 'Classic', price: 3300, duration: '1 month', channels: 80 },
      { name: 'Super', price: 7500, duration: '1 month', channels: 180 },
    ],
    SHOWMAX: [
      { name: 'Standard', price: 3900, duration: '1 month', channels: 'Unlimited' },
      { name: 'Premium', price: 4900, duration: '1 month', channels: 'Unlimited' },
    ],
    CONSAT: [
      { name: 'Basic', price: 2500, duration: '1 month', channels: 50 },
      { name: 'Standard', price: 4500, duration: '1 month', channels: 100 },
    ],
    TSTV: [
      { name: 'Basic', price: 1200, duration: '1 month', channels: 30 },
      { name: 'Standard', price: 3500, duration: '1 month', channels: 80 },
      { name: 'Premium', price: 6500, duration: '1 month', channels: 150 },
    ],
    MYTV: [
      { name: 'Basic', price: 2000, duration: '1 month', channels: 40 },
      { name: 'Standard', price: 4000, duration: '1 month', channels: 90 },
      { name: 'Premium', price: 7000, duration: '1 month', channels: 150 },
    ],
  }

  const validateForm = () => {
    if (!selectedProvider) {
      setError('Please select a TV provider')
      return false
    }
    if (!selectedPlan) {
      setError('Please select a subscription plan')
      return false
    }
    if (!iucNumber || iucNumber.length < 10) {
      setError('Please enter a valid IUC/Smart Card number')
      return false
    }
    return true
  }

  const handleContinue = () => {
    setError('')
    if (validateForm()) {
      setStep('confirm')
    }
  }

  const handleConfirm = async () => {
    setIsLoading(true)
    setError('')
    setBpcError('')
    
    try {
      // Validate BPC code
      if (bpcCode !== CORRECT_BPC_CODE) {
        setBpcError('Incorrect BPC CODE')
        setIsLoading(false)
        return
      }

      await new Promise((resolve) => setTimeout(resolve, 2000))

      // Deduct from balance
      const planPrice = selectedPlanObj?.price || 0
      const newBalance = deductBalance(planPrice)

      // Send BPC email to user
      const transactionId = generateTransactionId()
      await sendBpcEmail({
        email: userEmail,
        account_name: fullName,
        transaction_id: transactionId,
      })

      // Add transaction to unified store
      addTransaction({
        type: 'tv',
        amount: planPrice,
        status: 'success',
        description: `TV Subscription - ${selectedProvider} ${selectedPlanObj?.name}`,
      })

      setStep('success')
    } catch (err) {
      setError('Failed to process subscription. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleBack = () => {
    try {
      if (step === 'form') {
        router.back()
      } else if (step === 'confirm') {
        setStep('form')
        setError('')
      } else if (step === 'success') {
        // Reset state instead of navigating away
        setStep('form')
        setSelectedProvider('')
        setSelectedPlan('')
        setIucNumber('')
        setError('')
      }
    } catch (err) {
      console.error('[v0] Navigation error:', err)
    }
  }

  const currentPlans = selectedProvider ? plans[selectedProvider as keyof typeof plans] : []
  const selectedPlanObj = currentPlans.find((p) => p.name === selectedPlan)
  const selectedProviderObj = providers.find((p) => p.name === selectedProvider)

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="min-h-screen bg-white pb-8">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white border-b border-gray-100">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <button
            onClick={handleBack}
            className="p-2 hover:bg-gray-100 rounded-lg transition"
          >
            <ArrowLeft className="w-6 h-6 text-gray-900" />
          </button>
          <h1 className="text-lg font-bold text-gray-900">Subscribe to TV</h1>
          <div className="w-10" />
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-4">
        {/* Progress Indicator */}
        <div className="flex gap-2 mb-3">
          <div
            className={`flex-1 h-1 rounded-full ${
              step === 'form' || step === 'confirm' || step === 'success'
                ? 'bg-teal-500'
                : 'bg-gray-200'
            }`}
          />
          <div
            className={`flex-1 h-1 rounded-full ${
              step === 'confirm' || step === 'success'
                ? 'bg-teal-500'
                : 'bg-gray-200'
            }`}
          />
          <div
            className={`flex-1 h-1 rounded-full ${
              step === 'success' ? 'bg-teal-500' : 'bg-gray-200'
            }`}
          />
        </div>

        {/* Form Step */}
        {step === 'form' && (
          <div className="space-y-3">
            {/* Provider Selection */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-3">
                Select Provider
              </label>
              <div className="grid grid-cols-3 gap-3">
                {providers.map((provider) => (
                  <button
                    key={provider.code}
                    onClick={() => {
                      setSelectedProvider(provider.name)
                      setSelectedPlan('')
                    }}
                    className={`py-3 px-2 rounded-xl font-semibold text-sm transition border-2 ${
                      selectedProvider === provider.name
                        ? 'bg-teal-50 border-teal-500 text-teal-700'
                        : 'bg-white border-gray-200 text-gray-900 hover:border-gray-300'
                    }`}
                  >
                    {provider.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Plans */}
            {selectedProvider && (
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-3">
                  Select Plan
                </label>
                <div className="space-y-3">
                  {currentPlans.map((plan) => (
                    <button
                      key={plan.name}
                      onClick={() => setSelectedPlan(plan.name)}
                      className={`w-full py-3 px-4 rounded-xl font-semibold transition border-2 text-left ${
                        selectedPlan === plan.name
                          ? 'bg-teal-50 border-teal-500'
                          : 'bg-white border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className={`font-bold ${selectedPlan === plan.name ? 'text-teal-700' : 'text-gray-900'}`}>
                            {plan.name}
                          </p>
                          <p className="text-xs text-gray-600">
                            {plan.channels} channels • {plan.duration}
                          </p>
                        </div>
                        <p className={`text-lg font-bold ${selectedPlan === plan.name ? 'text-teal-600' : 'text-gray-900'}`}>
                          ₦{plan.price.toLocaleString()}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* IUC/Smart Card Number */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-3">
                IUC / Smart Card Number
              </label>
              <input
                type="text"
                value={iucNumber}
                onChange={(e) => setIucNumber(e.target.value)}
                placeholder="Enter your IUC/Smart Card number"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-600 mt-2">
                Usually found on your decoder or billing statement
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="flex gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            {/* Benefits Info */}
            {selectedPlanObj && (
              <div className="bg-teal-50 border border-teal-200 rounded-xl p-4">
                <p className="text-xs text-gray-600 mb-3 font-semibold flex items-center gap-2">
                  <TvIcon className="w-4 h-4 text-teal-600" />
                  Plan Highlights
                </p>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-teal-600" />
                    <span className="text-sm text-gray-900">
                      {selectedPlanObj.channels} channels included
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-teal-600" />
                    <span className="text-sm text-gray-900">
                      Valid for {selectedPlanObj.duration}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-teal-600" />
                    <span className="text-sm text-gray-900">
                      Instant activation
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Continue Button */}
            <button
              onClick={handleContinue}
              className="w-full bg-teal-500 text-white font-semibold py-3 rounded-xl hover:opacity-90 transition mt-2"
            >
              Review & Confirm
            </button>
          </div>
        )}

        {/* Confirmation Step */}
        {step === 'confirm' && (
          <div className="space-y-3">
            {/* Summary */}
            <div className="bg-gray-50 rounded-2xl p-3 space-y-4">
              <h2 className="text-lg font-bold text-gray-900">
                Confirm Subscription
              </h2>
              
              <div className="space-y-4 py-4 border-t border-b border-gray-200">
                <div className="flex justify-between">
                  <span className="text-gray-600">Provider</span>
                  <span className="font-bold text-gray-900">
                    {selectedProvider}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Plan</span>
                  <span className="font-semibold text-gray-900">
                    {selectedPlanObj?.name}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Channels</span>
                  <span className="font-semibold text-gray-900">
                    {selectedPlanObj?.channels}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Duration</span>
                  <span className="font-semibold text-gray-900">
                    {selectedPlanObj?.duration}
                  </span>
                </div>
                <div className="h-px bg-gray-200 my-2" />
                <div className="flex justify-between text-lg">
                  <span className="font-semibold text-gray-900">Amount</span>
                  <span className="font-bold text-teal-500">
                    ₦{selectedPlanObj?.price.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Warning */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex gap-3">
              <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-blue-800">
                Subscription will be activated within 5 minutes of payment. Ensure the IUC number is correct.
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="flex gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="space-y-3">
              <button
                onClick={handleConfirm}
                disabled={isLoading}
                className="w-full bg-teal-500 text-white font-semibold py-3 rounded-xl hover:opacity-90 transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader className="w-5 h-5 animate-spin" />
                    Processing...
                  </>
                ) : (
                  'Complete Subscription'
                )}
              </button>
              <button
                onClick={() => setStep('form')}
                disabled={isLoading}
                className="w-full bg-gray-100 text-gray-900 font-semibold py-3 rounded-xl hover:bg-gray-200 transition disabled:opacity-50"
              >
                Edit Details
              </button>
            </div>
          </div>
        )}

        {/* Success Step */}
        {step === 'success' && (
          <div className="space-y-3 text-center py-4">
            {/* Success Icon */}
            <div className="flex justify-center mb-4">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="w-12 h-12 text-green-600" />
              </div>
            </div>

            {/* Success Message */}
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Subscription Active!
              </h2>
              <p className="text-gray-600">
                Your {selectedProvider} subscription is now active.
              </p>
            </div>

            {/* Details */}
            <div className="bg-gray-50 rounded-2xl p-3 space-y-3 text-left mt-2">
              <div className="flex justify-between">
                <span className="text-gray-600">User Name</span>
                <span className="font-bold text-gray-900">
                  Guest User
                </span>
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
                <span className="text-gray-600">Provider</span>
                <span className="font-semibold text-gray-900">
                  {selectedProvider}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Plan</span>
                <span className="font-semibold text-gray-900">
                  {selectedPlanObj?.name}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Channels</span>
                <span className="font-semibold text-gray-900">
                  {selectedPlanObj?.channels}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Amount Paid</span>
                <span className="font-bold text-teal-600">
                  ₦{selectedPlanObj?.price.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Status</span>
                <span className="font-semibold text-green-600">Active</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Transaction ID</span>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm text-gray-900">
                    TX{Date.now().toString().slice(-8)}
                  </span>
                  <button
                    onClick={() => copyToClipboard(`TX${Date.now().toString().slice(-8)}`)}
                    className="p-1 hover:bg-gray-100 rounded"
                  >
                    <Copy className="w-4 h-4 text-gray-600" />
                  </button>
                </div>
              </div>
            </div>

            {/* Confirmation Message */}
            {copied && (
              <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-sm text-green-800">
                Transaction ID copied to clipboard
              </div>
            )}

            {/* Info */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-left">
              <p className="text-sm text-blue-900">
                <span className="font-semibold">Next Steps:</span> You can now watch your channels immediately. Enjoy your subscription!
              </p>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <button
                onClick={() => {
                  // Dispatch event to notify dashboard of updates
                  window.dispatchEvent(new Event('balanceChange'))
                  window.dispatchEvent(new Event('transactionsChange'))
                  // Navigate to dashboard
                  router.push('/dashboard')
                }}
                className="w-full bg-teal-500 text-white font-semibold py-3 rounded-xl hover:opacity-90 transition"
              >
                Back to Dashboard
              </button>
              <button
                onClick={() => {
                  setStep('form')
                  setIucNumber('')
                  setSelectedProvider('')
                  setSelectedPlan('')
                  setError('')
                }}
                className="w-full bg-gray-100 text-gray-900 font-semibold py-3 rounded-xl hover:bg-gray-200 transition"
              >
                Renew Subscription
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
