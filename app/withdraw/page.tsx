'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft,
  DollarSign,
  CheckCircle,
  AlertCircle,
  Loader,
  Eye,
  EyeOff,
  Copy,
  Check,
} from 'lucide-react'
import { sendDebitAlert, generateTransactionId, getCurrentDateTime } from '@/lib/debit-alert'
import { deductBalance, getBalance, addTransaction } from '@/lib/balance-store'
import { createClient } from '@supabase/supabase-js'

const CORRECT_BPC_CODE = 'BPC2026_PRO_V30_54D'

export default function WithdrawPage() {
  const router = useRouter()
  const [step, setStep] = useState<'form' | 'confirm' | 'success'>('form')
  const [amount, setAmount] = useState('')
  const [selectedBank, setSelectedBank] = useState('')
  const [accountNumber, setAccountNumber] = useState('')
  const [accountName, setAccountName] = useState('')
  const [bpcCode, setBpcCode] = useState('')
  const [showBpcCode, setShowBpcCode] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [bpcError, setBpcError] = useState('')
  const [fullName, setFullName] = useState('')
  const [userEmail, setUserEmail] = useState('')
  const [userId, setUserId] = useState('')
  const [balance, setBalance] = useState(250000) // Will load from store
  const [copiedField, setCopiedField] = useState<string | null>(null)

  const banks = [
    { name: 'OPAY', code: 'OPAY' },
    { name: 'PALMPAY', code: 'PALMPAY' },
    { name: 'MONIEPOINT', code: 'MONIEPOINT' },
    { name: 'SMART CASH', code: 'SMARTCASH' },
    { name: '9JA BANK', code: '9JA' },
    { name: 'MOMO MFB', code: 'MOMO' },
    { name: 'PAYSTACK TITAN', code: 'PAYSTACK' },
    { name: 'MOREMONEE', code: 'MOREMONEE' },
    { name: 'STANBIC IBTC', code: '221' },
    { name: 'FAIRMONEY', code: 'FAIRMONEY' },
    { name: 'CITI BANK', code: '023' },
    { name: 'LAPO MICROFINANCE BANK', code: 'LAPO' },
    { name: 'ACCESS BANK', code: '044' },
    { name: 'GTBANK', code: '007' },
    { name: 'FIRST BANK', code: '011' },
    { name: 'UBA', code: '033' },
    { name: 'ZENITH', code: '050' },
    { name: 'FIDELITY BANK', code: '070' },
    { name: 'FCMB', code: '214' },
    { name: 'STANDARD CHARTERED', code: '068' },
    { name: 'KUDA', code: 'KUDA' },
    { name: 'UNION BANK', code: '032' },
    { name: 'ECOBANK', code: '050' },
    { name: 'WEMA BANK', code: '035' },
    { name: 'POLARIS BANK', code: '076' },
    { name: 'JAIZ BANK', code: '301' },
    { name: 'KEYSTONE BANK', code: '082' },
    { name: 'PROVIDUS BANK', code: '101' },
  ]

  React.useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined') return

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
        } else {
          setFullName(sessionStorage.getItem('signupFullName') || 'BLUEPAY User')
          setUserEmail(sessionStorage.getItem('signupEmail') || '')
        }
      } catch (err) {
        console.error('[v0] Error loading user data:', err)
        setFullName(sessionStorage.getItem('signupFullName') || 'BLUEPAY User')
        setUserEmail(sessionStorage.getItem('signupEmail') || '')
      }
    }
    
    loadUserData()

    // Load balance from unified store and listen for changes
    try {
      setBalance(getBalance())
      const handleBalanceChange = () => {
        try {
          setBalance(getBalance())
        } catch (e) {
          console.error('[v0] Error updating balance:', e)
        }
      }
      window.addEventListener('balanceChange', handleBalanceChange)
      
      return () => window.removeEventListener('balanceChange', handleBalanceChange)
    } catch (err) {
      console.error('[v0] Error setting up balance listener:', err)
    }
  }, [])

  const validateForm = () => {
    if (!amount || parseFloat(amount) <= 0) {
      setError('Please enter a valid amount')
      return false
    }
    if (parseFloat(amount) > balance) {
      setError(`Insufficient balance. Maximum withdrawal: NGN${balance.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`)
      return false
    }
    if (parseFloat(amount) < 500) {
      setError('Minimum withdrawal amount is NGN500.00')
      return false
    }
    if (!selectedBank) {
      setError('Please select a bank')
      return false
    }
    if (!accountNumber || accountNumber.length < 10) {
      setError('Please enter a valid account number')
      return false
    }
    if (!accountName) {
      setError('Please enter account name')
      return false
    }
    // Validate BPC code
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

  const handleCopy = (text: string, field: string) => {
    try {
      navigator.clipboard.writeText(text).then(() => {
        setCopiedField(field)
        setTimeout(() => setCopiedField(null), 2000)
      })
    } catch (err) {
      console.error('[v0] Copy failed:', err)
    }
  }

  const handleContinue = () => {
    setError('')
    setBpcError('')
    if (validateForm()) {
      setStep('confirm')
    }
  }

  const handleConfirm = async () => {
    setError('')
    setIsLoading(true)

    try {
      await new Promise((resolve) => setTimeout(resolve, 2000))
      
      const withdrawAmount = parseFloat(amount)
      
      // Send debit alert email
      const transactionId = generateTransactionId()
      await sendDebitAlert({
        email: userEmail,
        full_name: fullName,
        transaction_type: 'Withdrawal',
        amount: withdrawAmount,
        recipient_name: accountName,
        recipient_account_number: accountNumber,
        recipient_bank_name: selectedBank,
        transaction_id: transactionId,
        transaction_date: getCurrentDateTime(),
      })
      // Update demo balance in unified store
      const newBalance = deductBalance(withdrawAmount)
      setBalance(newBalance)
      
      // Add transaction to unified store
      addTransaction({
        type: 'withdrawal',
        amount: withdrawAmount,
        status: 'success',
        description: `Withdrawal to ${selectedBank} - ${accountNumber}`,
      })
      
      setStep('success')
    } catch (err) {
      console.error('[v0] Withdrawal error:', err)
      setError('Failed to process withdrawal. Please try again.')
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
        setBpcError('')
      } else if (step === 'success') {
        // Don't use router.push, just reset state and go back to form
        setStep('form')
        setAmount('')
        setSelectedBank('')
        setAccountNumber('')
        setAccountName('')
        setBpcCode('')
        setError('')
        setBpcError('')
      }
    } catch (err) {
      console.error('[v0] Navigation error:', err)
    }
  }

  const selectedBankObj = banks.find((b) => b.name === selectedBank)

  return (
    <div className="min-h-screen bg-white pb-6">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white border-b border-gray-100">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <button
            onClick={handleBack}
            className="p-2 hover:bg-gray-100 rounded-lg transition"
          >
            <ArrowLeft className="w-6 h-6 text-gray-900" />
          </button>
          <h1 className="text-lg font-bold text-gray-900">Withdraw Funds</h1>
          <div className="w-10" />
        </div>
      </header>

      <main className="max-w-sm mx-auto px-4 py-6">
        {/* Progress Indicator */}
        <div className="flex gap-2 mb-3">
          <div
            className={`flex-1 h-1 rounded-full ${
              step === 'form' || step === 'confirm' || step === 'success'
                ? 'bg-[#0000ff]'
                : 'bg-gray-200'
            }`}
          />
          <div
            className={`flex-1 h-1 rounded-full ${
              step === 'confirm' || step === 'success'
                ? 'bg-[#0000ff]'
                : 'bg-gray-200'
            }`}
          />
          <div
            className={`flex-1 h-1 rounded-full ${
              step === 'success' ? 'bg-[#0000ff]' : 'bg-gray-200'
            }`}
          />
        </div>

        {/* Form Step */}
        {step === 'form' && (
          <div className="space-y-3">
            {/* Amount Input */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-3">
                Withdrawal Amount
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600 font-semibold">
                  ₦
                </span>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="Enter amount"
                  className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0000ff] focus:border-transparent"
                />
              </div>
              <p className="text-xs text-gray-600 mt-2">
                Available balance: NGN{balance.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>

            {/* Quick Amount Buttons */}
            <div>
              <p className="text-xs text-gray-600 mb-3">Quick amounts</p>
              <div className="grid grid-cols-4 gap-2">
                {['5000', '10000', '25000', '50000'].map((quickAmount) => (
                  <button
                    key={quickAmount}
                    onClick={() => setAmount(quickAmount)}
                    className={`py-2 px-3 rounded-lg font-semibold text-sm transition ${
                      amount === quickAmount
                        ? 'bg-[#0000ff] text-white'
                        : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                    }`}
                  >
                    ₦{parseInt(quickAmount).toLocaleString()}
                  </button>
                ))}
              </div>
            </div>

            {/* Bank Selection */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-3">
                Select Bank
              </label>
              <select
                value={selectedBank}
                onChange={(e) => setSelectedBank(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0000ff] focus:border-transparent"
              >
                <option value="">Choose your bank</option>
                {banks.map((bank) => (
                  <option key={bank.code} value={bank.name}>
                    {bank.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Account Number */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-3">
                Account Number
              </label>
              <input
                type="text"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, ''))}
                placeholder="10 digit account number"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0000ff] focus:border-transparent"
              />
            </div>

            {/* Account Name */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-3">
                Account Holder Name
              </label>
              <input
                type="text"
                value={accountName}
                onChange={(e) => setAccountName(e.target.value)}
                placeholder="Full name as shown on bank account"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0000ff] focus:border-transparent"
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

            {/* Error Message */}
            {error && (
              <div className="flex gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            {/* Charges Info */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <p className="text-xs text-gray-600 mb-2 font-semibold">
                Withdrawal Charges
              </p>
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-700">Amount:</span>
                  <span className="font-semibold text-gray-900">
                    ₦{amount ? parseInt(amount).toLocaleString() : '0'}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-700">Processing Fee:</span>
                  <span className="font-semibold text-gray-900">₦100</span>
                </div>
                <div className="h-px bg-blue-200 my-2" />
                <div className="flex justify-between text-sm">
                  <span className="text-gray-700 font-semibold">Total Debit:</span>
                  <span className="font-bold text-[#0000ff]">
                    ₦{amount ? (parseInt(amount) + 100).toLocaleString() : '100'}
                  </span>
                </div>
              </div>
            </div>

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
                Confirm Withdrawal
              </h2>
              
              <div className="space-y-4 py-4 border-t border-b border-gray-200">
                <div className="flex justify-between">
                  <span className="text-gray-600">Amount</span>
                  <span className="font-bold text-gray-900">
                    ₦{parseInt(amount).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Processing Fee</span>
                  <span className="font-semibold text-gray-900">₦100</span>
                </div>
                <div className="flex justify-between text-lg">
                  <span className="font-semibold text-gray-900">Total Debit</span>
                  <span className="font-bold text-[#0000ff]">
                    ₦{(parseInt(amount) + 100).toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="space-y-3 pt-2">
                <div className="flex justify-between items-start gap-2">
                  <div className="flex-1">
                    <p className="text-xs text-gray-600 mb-1">Destination Bank</p>
                    <p className="font-semibold text-gray-900">{selectedBank}</p>
                  </div>
                  <button
                    onClick={() => handleCopy(selectedBank, 'bank')}
                    className="p-2 hover:bg-gray-200 rounded-lg transition mt-4"
                    title="Copy bank name"
                  >
                    {copiedField === 'bank' ? (
                      <Check className="w-4 h-4 text-green-600" />
                    ) : (
                      <Copy className="w-4 h-4 text-gray-600" />
                    )}
                  </button>
                </div>
                <div className="flex justify-between items-start gap-2">
                  <div className="flex-1">
                    <p className="text-xs text-gray-600 mb-1">Account Number</p>
                    <p className="font-semibold text-gray-900">
                      {accountNumber.slice(-4).padStart(accountNumber.length, '*')}
                    </p>
                  </div>
                  <button
                    onClick={() => handleCopy(accountNumber, 'account')}
                    className="p-2 hover:bg-gray-200 rounded-lg transition mt-4"
                    title="Copy account number"
                  >
                    {copiedField === 'account' ? (
                      <Check className="w-4 h-4 text-green-600" />
                    ) : (
                      <Copy className="w-4 h-4 text-gray-600" />
                    )}
                  </button>
                </div>
                <div className="flex justify-between items-start gap-2">
                  <div className="flex-1">
                    <p className="text-xs text-gray-600 mb-1">Account Name</p>
                    <p className="font-semibold text-gray-900">{accountName}</p>
                  </div>
                  <button
                    onClick={() => handleCopy(accountName, 'name')}
                    className="p-2 hover:bg-gray-200 rounded-lg transition mt-4"
                    title="Copy account name"
                  >
                    {copiedField === 'name' ? (
                      <Check className="w-4 h-4 text-green-600" />
                    ) : (
                      <Copy className="w-4 h-4 text-gray-600" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Warning */}
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-amber-800">
                Please ensure all details are correct. Incorrect account information may result in loss of funds.
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
                className="w-full bg-[#0000ff] text-white font-semibold py-3 rounded-xl hover:opacity-90 transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader className="w-5 h-5 animate-spin" />
                    Processing...
                  </>
                ) : (
                  'Confirm Withdrawal'
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
            {/* Success Icon - Bank Building */}
            <div className="flex justify-center mb-4">
              <div className="w-24 h-24 bg-green-100 rounded-3xl flex items-center justify-center">
                <svg className="w-12 h-12 text-green-600" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2L2 7v2h20V7L12 2M2 9v11h20V9M4 11v7h3v-7H4m5 0v7h3v-7H9m5 0v7h3v-7h-3m5 0v7h3v-7h-3M6 21h12v1H6v-1z" />
                </svg>
              </div>
            </div>

            {/* Success Message */}
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Withdrawal Successful!
              </h2>
              <p className="text-gray-600">
                Your withdrawal request has been processed.
              </p>
            </div>

            {/* Details */}
            <div className="bg-gray-50 rounded-2xl p-3 space-y-3 text-left mt-2">
              <div className="flex justify-between">
                <span className="text-gray-600">User Name</span>
                <span className="font-bold text-gray-900">
                  {fullName || 'Guest User'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Transaction Date & Time</span>
                <span className="font-semibold text-gray-900 text-xs text-right">
                  {new Date().toLocaleDateString('en-US', { 
                    weekday: 'short',
                    day: '2-digit',
                    month: 'long',
                    year: 'numeric'
                  })}
                  <br />
                  {new Date().toLocaleTimeString('en-US', { 
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                    hour12: true
                  })}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Amount</span>
                <span className="font-bold text-gray-900">
                  ₦{parseInt(amount).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Account Number</span>
                <span className="font-semibold text-gray-900">
                  {accountNumber}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Account Name</span>
                <span className="font-semibold text-gray-900">
                  {accountName}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Destination Bank</span>
                <span className="font-semibold text-gray-900">
                  {selectedBank}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Status</span>
                <span className="font-semibold text-green-600">Processing</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Transaction ID</span>
                <span className="font-mono text-sm text-gray-900">
                  TX{Date.now().toString().slice(-8)}
                </span>
              </div>
            </div>

            {/* Info Message */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-left">
              <p className="text-sm text-blue-900">
                <span className="font-semibold">Estimated Arrival:</span> 5 minutes - 1 hour. 
                You'll receive a confirmation email once the transfer is complete.
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
                className="w-full bg-[#0000ff] text-white font-semibold py-3 rounded-xl hover:opacity-90 transition"
              >
                Back to Dashboard
              </button>
              <button
                onClick={() => {
                  setStep('form')
                  setAmount('')
                  setSelectedBank('')
                  setAccountNumber('')
                  setAccountName('')
                  setError('')
                }}
                className="w-full bg-gray-100 text-gray-900 font-semibold py-3 rounded-xl hover:bg-gray-200 transition"
              >
                Make Another Withdrawal
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
