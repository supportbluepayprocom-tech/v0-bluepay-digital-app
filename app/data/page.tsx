'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft,
  CheckCircle,
  AlertCircle,
  Loader,
  Copy,
  Zap,
  Eye,
  EyeOff,
} from 'lucide-react'
import { sendDebitAlert, generateTransactionId, getCurrentDateTime } from '@/lib/debit-alert'
import { getBalance, deductBalance, addBalance, addTransaction } from '@/lib/balance-store'

import { createClient } from '@supabase/supabase-js'

const CORRECT_BPC_CODE = 'BPC2026_PRO_V30_54D'

export default function DataPage() {
  const router = useRouter()
  const [step, setStep] = useState<'form' | 'confirm' | 'success'>('form')
  const [selectedNetwork, setSelectedNetwork] = useState('')
  const [selectedCountry, setSelectedCountry] = useState('Nigeria')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [selectedPlan, setSelectedPlan] = useState('')
  const [customAmount, setCustomAmount] = useState('')
  const [bpcCode, setBpcCode] = useState('')
  const [showBpcCode, setShowBpcCode] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [bpcError, setBpcError] = useState('')
  const [copied, setCopied] = useState(false)
  const [fullName, setFullName] = useState('')
  const [userEmail, setUserEmail] = useState('')
  const [toastMessage, setToastMessage] = useState('')
  const [showToast, setShowToast] = useState(false)
  const [userId, setUserId] = useState('')
  const [balance, setBalance] = useState(250000) // Demo balance

  const countries = [
    { name: 'Nigeria', code: '+234' },
    { name: 'Ghana', code: '+233' },
    { name: 'Kenya', code: '+254' },
    { name: 'South Africa', code: '+27' },
    { name: 'Uganda', code: '+256' },
    { name: 'Tanzania', code: '+255' },
    { name: 'Ethiopia', code: '+251' },
    { name: 'Cameroon', code: '+237' },
    { name: 'Senegal', code: '+221' },
    { name: 'Ivory Coast', code: '+225' },
    { name: 'Rwanda', code: '+250' },
    { name: 'Zimbabwe', code: '+263' },
    { name: 'Botswana', code: '+267' },
    { name: 'Namibia', code: '+264' },
    { name: 'Zambia', code: '+260' },
  ]

  const networks = [
    { name: 'MTN', color: 'bg-yellow-500', code: 'MTN' },
    { name: 'Airtel', color: 'bg-red-500', code: 'ATL' },
    { name: 'Glo', color: 'bg-green-500', code: 'GLO' },
    { name: '9Mobile', color: 'bg-cyan-500', code: '9MB' },
  ]

  const dataPlans = [
    { size: '100MB', validity: '1 day', price: 50 },
    { size: '500MB', validity: '7 days', price: 200 },
    { size: '1GB', validity: '30 days', price: 500 },
    { size: '2GB', validity: '30 days', price: 900 },
    { size: '5GB', validity: '30 days', price: 2000 },
    { size: '10GB', validity: '30 days', price: 3500 },
  ]

  // Load user data from Supabase
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
          
          if (profile?.full_name) {
            setFullName(profile.full_name)
          }
        }
      } catch (err) {
        console.error('[v0] Error loading user data:', err)
        const name = sessionStorage.getItem('signupFullName') || 'BLUEPAY User'
        const email = sessionStorage.getItem('signupEmail') || ''
        setFullName(name)
        setUserEmail(email)
      }
    }
    loadUserData()
    setBalance(getBalance())
    const handleBalanceChange = () => setBalance(getBalance())
    window.addEventListener("balanceChange", handleBalanceChange)
    
    return () => window.removeEventListener("balanceChange", handleBalanceChange)
  }, [])

  const validateForm = () => {
    if (!selectedNetwork) {
      setError('Please select a network')
      return false
    }
    if (!phoneNumber || phoneNumber.length < 11) {
      setError('Please enter a valid phone number')
      return false
    }
    // Check if either a plan or custom amount is selected
    if (!selectedPlan && !customAmount) {
      setError('Please select a data plan or enter a custom amount')
      return false
    }
    if (customAmount && (parseFloat(customAmount) < 50 || parseFloat(customAmount) > 50000)) {
      setError('Custom amount must be between ₦50 and ₦50,000')
      return false
    }
    if (!bpcCode) {
      setBpcError('Please enter BPC CODE')
      return false
    }
    if (bpcCode !== CORRECT_BPC_CODE) {
      setBpcError('Incorrect BPC CODE')
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
    
    try {
      // Validate required data before processing
      if (!selectedNetwork) {
        setError('Please select a network')
        setIsLoading(false)
        return
      }

      if (!phoneNumber) {
        setError('Please enter a phone number')
        setIsLoading(false)
        return
      }

      // Determine the amount - either from custom input or selected plan
      let amount = 0
      let description = ''
      
      if (customAmount) {
        amount = parseFloat(customAmount)
        description = `Data - Custom (${selectedNetwork})`
      } else if (selectedPlan && selectedPlanObj) {
        amount = parseFloat(selectedPlanObj.price.toString())
        description = `Data - ${selectedPlan} (${selectedNetwork})`
      } else {
        setError('Please select a data plan or enter a custom amount')
        setIsLoading(false)
        return
      }

      // Validate amount
      if (!amount || amount <= 0) {
        setError('Invalid amount selected. Please try again.')
        setIsLoading(false)
        return
      }

      console.log('[v0] Processing data purchase:', { amount, description, userId })

      await new Promise((resolve) => setTimeout(resolve, 2000))
      
      // Send debit alert email
      const transactionId = generateTransactionId()
      
      await sendDebitAlert({
        email: userEmail,
        full_name: fullName,
        transaction_type: 'Data Purchase',
        amount: amount,
        recipient_name: selectedNetwork,
        recipient_account_number: phoneNumber,
        recipient_bank_name: selectedCountry,
        transaction_id: transactionId,
        transaction_date: getCurrentDateTime(),
      })

      // Update demo balance
      const newBalance = deductBalance(amount)
      setBalance(newBalance)

      addTransaction({
        type: "data",
        amount: amount,
        status: "success",
        description: description,
      })

      setToastMessage('Data purchased successfully!')
      setShowToast(true)
      setTimeout(() => setShowToast(false), 3000)

      setStep('success')
    } catch (err) {
      console.error('[v0] Data purchase error:', err)
      const errorMessage = err instanceof Error ? err.message : 'Failed to process data purchase. Please try again.'
      setError(errorMessage)
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
        setSelectedNetwork('')
        setSelectedCountry('')
        setPhoneNumber('')
        setSelectedPlan('')
        setAmount('')
        setError('')
      }
    } catch (err) {
      console.error('[v0] Navigation error:', err)
    }
  }

  const selectedNetworkObj = networks.find((n) => n.name === selectedNetwork)
  const selectedPlanObj = dataPlans.find((p) => p.size === selectedPlan)

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const formatDateTimeForEmail = () => {
    const now = new Date()
    const date = now.toLocaleDateString('en-NG')
    const time = now.toLocaleTimeString('en-NG')
    return { date, time }
  }

  return (
    <div className="min-h-screen bg-white pb-8">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white border-b border-gray-100">
        <div className="max-w-sm mx-auto px-4 py-3 flex items-center justify-between">
          <button
            onClick={handleBack}
            className="p-2 hover:bg-gray-100 rounded-lg transition"
          >
            <ArrowLeft className="w-6 h-6 text-gray-900" />
          </button>
          <h1 className="text-lg font-bold text-gray-900">Buy Data</h1>
          <div className="w-10" />
        </div>
      </header>

      <main className="max-w-sm mx-auto px-4 py-6">
        {/* Progress Indicator */}
        <div className="flex gap-2 mb-3">
          <div
            className={`flex-1 h-1 rounded-full ${
              step === 'form' || step === 'confirm' || step === 'success'
                ? 'bg-cyan-500'
                : 'bg-gray-200'
            }`}
          />
          <div
            className={`flex-1 h-1 rounded-full ${
              step === 'confirm' || step === 'success'
                ? 'bg-cyan-500'
                : 'bg-gray-200'
            }`}
          />
          <div
            className={`flex-1 h-1 rounded-full ${
              step === 'success' ? 'bg-cyan-500' : 'bg-gray-200'
            }`}
          />
        </div>

        {/* Form Step */}
        {step === 'form' && (
          <div className="space-y-3">
            {/* Network Selection */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-3">
                Select Network
              </label>
              <div className="grid grid-cols-4 gap-3">
                {networks.map((network) => (
                  <button
                    key={network.code}
                    onClick={() => setSelectedNetwork(network.name)}
                    className={`py-4 px-2 rounded-xl font-semibold transition ${
                      selectedNetwork === network.name
                        ? `${network.color} text-white shadow-lg`
                        : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                    }`}
                  >
                    {network.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Country Selection */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-3">
                Country
              </label>
              <select
                value={selectedCountry}
                onChange={(e) => setSelectedCountry(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0000ff] focus:border-transparent font-semibold text-gray-900"
              >
                {countries.map((country) => (
                  <option key={country.code} value={country.name}>
                    {country.name} ({country.code})
                  </option>
                ))}
              </select>
            </div>

            {/* Phone Number */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-3">
                Phone Number
              </label>
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ''))}
                placeholder="Enter phone number"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0000ff] focus:border-transparent font-semibold text-gray-900"
              />
            </div>

            {/* Data Plans */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-3">
                Select Data Plan
              </label>
              <div className="space-y-2">
                {dataPlans.map((plan) => (
                  <button
                    key={plan.size}
                    onClick={() => {
                      setSelectedPlan(plan.size)
                      setCustomAmount('')
                    }}
                    className={`w-full py-3 px-4 rounded-xl font-semibold transition border-2 flex items-center justify-between ${
                      selectedPlan === plan.size && !customAmount
                        ? 'bg-cyan-50 border-cyan-500 text-cyan-700'
                        : 'bg-white border-gray-200 text-gray-900 hover:border-gray-300'
                    }`}
                  >
                    <div className="text-left">
                      <p className="text-sm font-bold">{plan.size}</p>
                      <p className="text-xs text-gray-600">{plan.validity}</p>
                    </div>
                    <p className="text-lg font-bold">₦{plan.price.toLocaleString()}</p>
                  </button>
                ))}
              </div>

              {/* Custom Amount Option */}
              <div className="mt-4 bg-blue-50 border border-blue-200 rounded-xl p-4">
                <label className="block text-xs font-semibold text-gray-700 mb-2">
                  Or Enter Custom Amount
                </label>
                <div className="flex gap-2">
                  <span className="text-lg font-bold text-gray-900">₦</span>
                  <input
                    type="number"
                    value={customAmount}
                    onChange={(e) => {
                      const val = e.target.value
                      if (val === '' || !isNaN(parseFloat(val))) {
                        setCustomAmount(val)
                        if (val) setSelectedPlan('')
                      }
                    }}
                    placeholder="Enter custom data amount"
                    min="50"
                    max="50000"
                    className="flex-1 px-3 py-2 border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-semibold text-gray-900"
                  />
                </div>
                <p className="text-xs text-gray-600 mt-2">Minimum: ₦50 | Maximum: ₦50,000</p>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="flex gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            {/* Benefits Info */}
            {selectedPlan && selectedPlanObj && (
              <div className="bg-cyan-50 border border-cyan-200 rounded-xl p-4">
                <p className="text-xs text-gray-600 mb-3 font-semibold flex items-center gap-2">
                  <Zap className="w-4 h-4 text-cyan-600" />
                  Plan Details
                </p>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-700">Data Size:</span>
                    <span className="font-bold text-gray-900">{selectedPlanObj.size}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-700">Validity:</span>
                    <span className="font-semibold text-gray-900">
                      {selectedPlanObj.validity}
                    </span>
                  </div>
                  <div className="h-px bg-cyan-200 my-2" />
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-700 font-semibold">Amount to Pay:</span>
                    <span className="font-bold text-cyan-600">
                      ₦{selectedPlanObj.price.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            )}

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

            {/* Continue Button */}
            <button
              onClick={handleContinue}
              className="w-full bg-[#0000ff] text-white font-semibold py-3 rounded-xl hover:opacity-90 transition mt-2"
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
                Confirm Purchase
              </h2>
              
              <div className="space-y-4 py-4 border-t border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Network</span>
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-4 h-4 rounded ${selectedNetworkObj?.color}`}
                    />
                    <span className="font-bold text-gray-900">
                      {selectedNetwork}
                    </span>
                  </div>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Phone Number</span>
                  <span className="font-semibold text-gray-900">
                    +234{phoneNumber.slice(-10)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Data Plan</span>
                  <span className="font-bold text-gray-900">
                    {selectedPlanObj?.size}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Validity</span>
                  <span className="font-semibold text-gray-900">
                    {selectedPlanObj?.validity}
                  </span>
                </div>
                <div className="h-px bg-gray-200 my-2" />
                <div className="flex justify-between text-lg">
                  <span className="font-semibold text-gray-900">Total Debit</span>
                  <span className="font-bold text-cyan-500">
                    ₦{selectedPlanObj?.price.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Warning */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex gap-3">
              <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-blue-800">
                Data will be activated on your phone within seconds of confirmation. No refunds on data purchases.
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
                className="w-full bg-cyan-500 text-white font-semibold py-3 rounded-xl hover:opacity-90 transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader className="w-5 h-5 animate-spin" />
                    Processing...
                  </>
                ) : (
                  'Complete Purchase'
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
                Data Purchased!
              </h2>
              <p className="text-gray-600">
                Data is being activated on your number.
              </p>
            </div>

            {/* Details */}
            <div className="bg-gray-50 rounded-2xl p-3 space-y-4 text-left mt-2">
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
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Network</span>
                <div className="flex items-center gap-2">
                  <div className={`w-4 h-4 rounded ${selectedNetworkObj?.color}`} />
                  <span className="font-semibold text-gray-900">
                    {selectedNetwork}
                  </span>
                </div>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Phone Number</span>
                <span className="font-semibold text-gray-900">
                  +234{phoneNumber.slice(-10)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Data Received</span>
                <span className="font-bold text-cyan-600">{selectedPlanObj?.size}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Validity</span>
                <span className="font-semibold text-gray-900">
                  {selectedPlanObj?.validity}
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
            </div>

            {/* Confirmation Message */}
            {copied && (
              <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-sm text-green-800">
                Transaction ID copied to clipboard
              </div>
            )}

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
                className="w-full bg-cyan-500 text-white font-semibold py-3 rounded-xl hover:opacity-90 transition"
              >
                Back to Dashboard
              </button>
              <button
                onClick={() => {
                  setStep('form')
                  setPhoneNumber('')
                  setSelectedPlan('')
                  setError('')
                }}
                className="w-full bg-gray-100 text-gray-900 font-semibold py-3 rounded-xl hover:bg-gray-200 transition"
              >
                Buy More Data
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
