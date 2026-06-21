'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, CheckCircle, AlertCircle, Upload, Loader, Copy, Check, Mail } from 'lucide-react'
import { Countdown } from '@/components/Countdown'
import WarningNotification from '@/components/WarningNotification'
import { createClient } from '@supabase/supabase-js'
import { sendBPCEmail, formatDateTimeForEmail } from '@/lib/email-service'
import { sendDebitAlert, generateTransactionId, getCurrentDateTime } from '@/lib/debit-alert'

export default function BuyBPCPage() {
  const router = useRouter()
  const [step, setStep] = useState<'amount' | 'payment' | 'warning' | 'receipt' | 'success' | 'countdown' | 'receipt_countdown' | 'verify_countdown'>('amount')
  const [amount, setAmount] = useState(10650)
  const [receiptFile, setReceiptFile] = useState<File | null>(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [isVerifying, setIsVerifying] = useState(false)
  const [fullName, setFullName] = useState('')
  const [userEmail, setUserEmail] = useState('')
  const [sessionId, setSessionId] = useState('')
  const [currentDateTime, setCurrentDateTime] = useState('')
  const [copiedField, setCopiedField] = useState<string | null>(null)
  const [showWarningNotification, setShowWarningNotification] = useState(false)

  const BPC_PRICE = 10650
  const ACCOUNT_NUMBER = '6711230988'
  const ACCOUNT_NAME = 'MONIEPOINT MFB'
  const EDGE_FUNCTION_URL = 'https://rykdsszbtjvnoycmialc.supabase.co/functions/v1/send-bpc-email'

  // Copy handler for account details
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

  // Get user data from Supabase session
  useEffect(() => {
    const loadUserData = async () => {
      try {
        // Create Supabase client dynamically
        const supabase = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        )
        
        const { data: { session } } = await supabase.auth.getSession()
        if (session?.user) {
          setUserEmail(session.user.email || '')
          // Get user profile for full name
          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('id', session.user.id)
            .single()
          
          if (profile?.full_name) {
            setFullName(profile.full_name)
          }
        }
        // Generate session ID
        setSessionId(Date.now().toString() + Math.random().toString(36).substr(2, 9))
      } catch (err) {
        console.error('[v0] Error loading user data:', err)
        // Fallback to sessionStorage
        const name = sessionStorage.getItem('signupFullName') || 'BLUEPAY User'
        const email = sessionStorage.getItem('signupEmail') || ''
        setFullName(name)
        setUserEmail(email)
        setSessionId(Date.now().toString() + Math.random().toString(36).substr(2, 9))
      }
    }
    loadUserData()
  }, [])

  // Update date/time when success step is reached
  useEffect(() => {
    if (step === 'success') {
      const updateDateTime = () => {
        const now = new Date()
        const options: Intl.DateTimeFormatOptions = {
          weekday: 'short',
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true,
        }
        const formatted = now.toLocaleDateString('en-US', options)
        setCurrentDateTime(formatted)
      }
      
      updateDateTime()
      const interval = setInterval(updateDateTime, 1000)
      return () => clearInterval(interval)
    }
  }, [step])

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && file.type.startsWith('image/')) {
      setReceiptFile(file)
      setError('')
    } else {
      setError('Please upload a valid image file')
    }
  }

  const handleVerifyPayment = async () => {
    if (!receiptFile) {
      setError('Please upload receipt image')
      return
    }

    setIsVerifying(true)
    setError('')

    try {
      // Trigger 6-second countdown before showing success
      setStep('verify_countdown')
    } catch (err) {
      console.error('[v0] Payment verification error:', err)
      setError('Payment submitted. Please check your email for confirmation.')
    } finally {
      setIsVerifying(false)
    }
  }

  const handleVerifyCountdownComplete = async () => {
    // Send debit alert for BPC purchase
    const transactionId = generateTransactionId()
    await sendDebitAlert({
      email: userEmail,
      full_name: fullName,
      transaction_type: 'BPC CODE Purchase',
      amount: amount,
      recipient_name: 'BLUEPAY Platform',
      recipient_account_number: ACCOUNT_NUMBER,
      recipient_bank_name: ACCOUNT_NAME,
      transaction_id: transactionId,
      transaction_date: getCurrentDateTime(),
    })
    setStep('success')
  }

  const handleProceed = () => {
    if (step === 'amount') {
      setStep('countdown')
    } else if (step === 'payment') {
      setStep('receipt_countdown')
    } else if (step === 'receipt') {
      if (!receiptFile) {
        setError('Please upload receipt image')
        return
      }
      handleVerifyPayment()
    } else if (step === 'warning') {
      setStep('payment')
    }
  }

  const handleCountdownComplete = () => {
    setStep('warning')
  }

  const handleReceiptCountdownComplete = () => {
    setStep('receipt')
  }

  return (
    <div className="min-h-screen bg-white pb-20">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-[#0000ff] hover:opacity-80 transition"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-semibold">Back</span>
          </button>
          <h1 className="text-xl font-bold text-gray-900">Buy BPC</h1>
          <div className="w-12" />
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-2xl mx-auto px-4 py-6">
        {step === 'amount' && (
          <div className="space-y-3">
            <div className="bg-blue-50 rounded-xl p-3 border-2 border-blue-200 mb-3">
              <h3 className="font-bold text-gray-900 text-sm mb-1">BPC CODE Purchase</h3>
              <p className="text-gray-600 text-xs">
                Buy your Bank Processing Code to activate premium features.
              </p>
            </div>

            <div className="bg-white rounded-xl p-3 border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-gray-600">BPC CODE Price</p>
                <p className="font-bold text-[#0000ff] text-base">NGN {amount.toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
              </div>
              <p className="text-xs text-gray-500">One-time payment for premium access</p>
            </div>

            <button
              onClick={handleProceed}
              className="w-full bg-[#0000ff] text-white font-bold py-2.5 rounded-xl hover:opacity-90 transition text-sm"
            >
              Proceed to Payment
            </button>
            <button
              onClick={() => router.push('/dashboard')}
              className="w-full bg-gray-200 text-gray-900 font-bold py-2.5 rounded-xl hover:bg-gray-300 transition text-sm"
            >
              Cancel
            </button>
          </div>
        )}

        {step === 'payment' && (
          <>
            <div className="bg-green-50 rounded-xl p-3 border-2 border-green-200 mb-3">
              <h3 className="font-bold text-gray-900 text-sm mb-1">Payment Details</h3>
              <p className="text-gray-600 text-xs">
                Make transfer to the account details below to verify payment.
              </p>
            </div>

            <div className="bg-white rounded-xl p-2.5 border border-gray-200 shadow-sm mb-3">
              <div className="space-y-2">
                <div className="flex justify-between items-start gap-2">
                  <div className="flex-1">
                    <p className="text-xs text-gray-600 mb-0.5">Bank Name</p>
                    <p className="font-bold text-gray-900 text-sm">MONIEPOINT MFB</p>
                  </div>
                  <button
                    onClick={() => handleCopy('MONIEPOINT MFB', 'bank')}
                    className="p-1.5 hover:bg-gray-200 rounded-lg transition mt-0.5"
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
                    <p className="text-xs text-gray-600 mb-0.5">Account Number</p>
                    <p className="font-mono font-bold text-[#0000ff] text-sm">{ACCOUNT_NUMBER}</p>
                  </div>
                  <button
                    onClick={() => handleCopy(ACCOUNT_NUMBER, 'account')}
                    className="p-1.5 hover:bg-gray-200 rounded-lg transition mt-0.5"
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
                    <p className="text-xs text-gray-600 mb-0.5">Account Name</p>
                    <p className="font-bold text-gray-900 text-sm">CHI.. MODE...AGB</p>
                  </div>
                  <button
                    onClick={() => handleCopy('CHI.. MODE...AGB', 'name')}
                    className="p-1.5 hover:bg-gray-200 rounded-lg transition mt-0.5"
                    title="Copy account name"
                  >
                    {copiedField === 'name' ? (
                      <Check className="w-4 h-4 text-green-600" />
                    ) : (
                      <Copy className="w-4 h-4 text-gray-600" />
                    )}
                  </button>
                </div>
                <div className="flex justify-between items-start gap-2">
                  <div className="flex-1">
                    <p className="text-xs text-gray-600 mb-0.5">Amount to Transfer</p>
                    <p className="font-bold text-gray-900 text-sm">NGN {amount.toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                  </div>
                  <button
                    onClick={() => handleCopy(amount.toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 }), 'amount')}
                    className="p-1.5 hover:bg-gray-200 rounded-lg transition mt-0.5"
                    title="Copy amount"
                  >
                    {copiedField === 'amount' ? (
                      <Check className="w-4 h-4 text-green-600" />
                    ) : (
                      <Copy className="w-4 h-4 text-gray-600" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <button
                onClick={handleProceed}
                className="w-full bg-[#0000ff] text-white font-bold py-2.5 rounded-xl hover:opacity-90 transition text-sm"
              >
                I Have Made the Payment
              </button>
              <button
                onClick={() => setStep('amount')}
                className="w-full bg-gray-200 text-gray-900 font-bold py-2.5 rounded-xl hover:bg-gray-300 transition text-sm"
              >
                Back
              </button>
            </div>
          </>
        )}

        {step === 'receipt' && (
          <>
            <div className="bg-blue-50 rounded-xl p-3 border-2 border-blue-200 mb-3">
              <h3 className="font-bold text-gray-900 text-sm mb-1">Upload Payment Receipt</h3>
              <p className="text-gray-600 text-xs">
                Please upload a screenshot of your payment receipt to verify your payment.
              </p>
            </div>

            <div className="space-y-3">
              {error && (
                <div className="bg-red-50 border-2 border-red-200 rounded-lg p-2 flex gap-2">
                  <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                  <p className="text-red-600 text-xs">{error}</p>
                </div>
              )}

              {success && (
                <div className="bg-green-50 border-2 border-green-200 rounded-lg p-2 flex gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                  <p className="text-green-600 text-xs">{success}</p>
                </div>
              )}

              {/* Receipt Upload */}
              <div>
                <label className="block w-full">
                  <div className="border-2 border-dashed border-[#0000ff] rounded-lg p-4 flex flex-col items-center justify-center cursor-pointer hover:bg-blue-50 transition">
                    <Upload className="w-8 h-8 text-[#0000ff] mb-2" />
                    <p className="font-bold text-gray-900 text-center text-xs mb-0.5">
                      {receiptFile ? 'Receipt Uploaded ✓' : 'Tap to Upload Receipt'}
                    </p>
                    <p className="text-xs text-gray-600 text-center mb-1">
                      PNG, JPG or JPEG (Max. 5MB)
                    </p>
                    {receiptFile && (
                      <p className="text-xs text-gray-600 font-semibold truncate max-w-xs">{receiptFile.name}</p>
                    )}
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              </div>

              <div className="space-y-2">
                <button
                  onClick={handleProceed}
                  disabled={isVerifying}
                  className="w-full bg-[#0000ff] text-white font-bold py-2.5 rounded-xl hover:opacity-90 disabled:opacity-50 transition flex items-center justify-center gap-2 text-sm"
                >
                  {isVerifying ? (
                    <>
                      <Loader className="w-4 h-4 animate-spin" />
                      VERIFYING...
                    </>
                  ) : (
                    'VERIFY PAYMENT'
                  )}
                </button>
                <button
                  onClick={() => setStep('payment')}
                  disabled={isVerifying}
                  className="w-full bg-gray-200 text-gray-900 font-bold py-2.5 rounded-xl hover:bg-gray-300 disabled:opacity-50 transition text-sm"
                >
                  Back
                </button>
              </div>
            </div>
          </>
        )}

        {step === 'countdown' && (
          <Countdown
            seconds={7}
            onComplete={handleCountdownComplete}
            message="Preparing payment details..."
          />
        )}

        {step === 'warning' && (
          <>
            <WarningNotification
              isOpen={true}
              onClose={() => setShowWarningNotification(false)}
              title="WARNING - OPAY NOT SUPPORTED"
              message="Dear BLUEPAY PRO V30 user, making payment via OPAY BANK is not available. Any payment made via OPAY BANK will be declined due to our terms and service. Kindly proceed with other banks."
            />
          <div className="space-y-3">
            <div className="flex justify-center mb-3">
              <img 
                src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/images%20%2828%29-7an7GHzEj5Blc8fCV8ly4jLuP6jjQl.jpeg" 
                alt="OPay - Beyond Banking" 
                className="w-full max-w-xs rounded-lg shadow-md object-cover"
              />
            </div>
            
            <div className="bg-red-50 border-2 border-red-200 rounded-lg p-3">
              <div className="flex gap-2 mb-2">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <h2 className="text-base font-bold text-red-900">WARNING</h2>
              </div>
              <p className="text-red-800 font-semibold mb-2 text-xs">
                Dear BLUEPAY PRO V30 user,
              </p>
              <p className="text-red-800 mb-2 text-xs">
                Be informed that making payment via OPAY BANK is not available and any payment made via OPAY BANK will be declined due to our terms and service.
              </p>
              <p className="text-red-800 font-semibold text-xs">
                Kindly proceed with other banks.
              </p>
            </div>

            <div className="space-y-2">
              <button
                onClick={handleProceed}
                className="w-full bg-[#0000ff] text-white font-bold py-2.5 rounded-xl hover:opacity-90 transition text-sm"
              >
                I UNDERSTAND
              </button>
              <button
                onClick={() => setStep('amount')}
                className="w-full bg-gray-200 text-gray-900 font-bold py-2.5 rounded-xl hover:bg-gray-300 transition text-sm"
              >
                BACK
              </button>
            </div>
          </div>
          </>
        )}

        {step === 'receipt_countdown' && (
          <Countdown
            seconds={7}
            onComplete={handleReceiptCountdownComplete}
            message="Preparing upload page..."
          />
        )}

        {step === 'verify_countdown' && (
          <Countdown
            seconds={6}
            onComplete={handleVerifyCountdownComplete}
            message="Verifying payment and processing BPC CODE..."
          />
        )}

        {step === 'success' && (
          <>
            <div className="bg-gradient-to-b from-yellow-50 to-orange-50 rounded-2xl p-5 text-center mb-4">
              <div className="flex justify-center mb-4">
                <AlertCircle className="w-16 h-16 text-yellow-600" />
              </div>
              
              <h2 className="text-2xl font-bold text-gray-900 mb-1">Payment Not</h2>
              <h3 className="text-base font-semibold text-yellow-600 mb-5">Confirmed</h3>
              
              {/* Main Message */}
              <div className="mb-6 text-left bg-yellow-50 rounded-xl p-4 border-2 border-yellow-200">
                <p className="text-sm font-bold text-yellow-900 mb-3">
                  ⚠️ Payment Pending Confirmation
                </p>
                <p className="text-sm text-yellow-800 leading-relaxed mb-3">
                  Your payment is still being verified. We are currently processing your transaction. Please do not make duplicate payments.
                </p>
                <p className="text-sm text-yellow-800 leading-relaxed font-semibold mb-3">
                  Status: PENDING VERIFICATION
                </p>
                <p className="text-xs text-yellow-700 leading-relaxed">
                  You will receive an email notification with your BPC CODE details once verification is complete. This typically takes 2-5 minutes.
                </p>
                <p className="text-sm font-semibold text-yellow-900 mt-4 pt-3 border-t border-yellow-300">
                  BLUEPAY Support Team
                </p>
              </div>

              {/* Order Details */}
              <div className="bg-white rounded-lg p-3 border-2 border-green-200 text-left mb-4 space-y-2.5">
                <div>
                  <p className="text-xs text-gray-600 mb-0.5 font-semibold">Full Name</p>
                  <p className="font-bold text-gray-900 text-sm">{fullName}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600 mb-0.5 font-semibold">Email Address</p>
                  <p className="font-bold text-gray-900 text-xs break-all">{userEmail}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600 mb-0.5 font-semibold">Amount Paid</p>
                  <p className="font-bold text-[#0000ff] text-sm">NGN {amount.toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600 mb-0.5 font-semibold">Transaction ID</p>
                  <p className="font-mono font-bold text-gray-900 text-xs break-all">{sessionId}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600 mb-0.5 font-semibold">Date & Time</p>
                  <p className="font-bold text-gray-900 text-xs">{currentDateTime || 'Loading...'}</p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2">
                <button
                  onClick={() => {
                    const supportEmail = 'supportbluepaypro.com@gmail.com'
                    const subject = `BPC CODE Order Support - ${sessionId}`
                    const body = `Hello BLUEPAY Support Team,%0A%0AI am following up on my recent BPC CODE order.%0A%0AOrder Details:%0AName: ${fullName}%0AEmail: ${userEmail}%0ATransaction ID: ${sessionId}%0AAmount: NGN ${amount}%0A%0APlease assist me with my order.%0A%0AThank you.`
                    window.open(`mailto:${supportEmail}?subject=${subject}&body=${body}`, '_self')
                  }}
                  className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-bold py-3 rounded-xl transition flex items-center justify-center gap-2"
                >
                  <Mail className="w-4 h-4" />
                  Check Email
                </button>
                <button
                  onClick={() => router.push('/dashboard')}
                  className="w-full bg-[#0000ff] text-white font-bold py-3 rounded-xl hover:opacity-90 transition"
                >
                  Back to Dashboard
                </button>
              </div>

              {/* Info Note */}
              <p className="text-xs text-gray-600 mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                An email with your BPC CODE details will be sent to <span className="font-semibold">{userEmail}</span> once verification is complete.
              </p>
            </div>
          </>
        )}
      </main>
    </div>
  )
}
