'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { AlertCircle, CheckCircle } from 'lucide-react'
import BPCNotificationModal from '@/components/BPCNotificationModal'

export default function VerifyEmailPage() {
  const router = useRouter()
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [timeLeft, setTimeLeft] = useState(300) // 5 minutes
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [canResend, setCanResend] = useState(false)
  const [email, setEmail] = useState('')
  const [fullName, setFullName] = useState('')
  const [showBpcModal, setShowBpcModal] = useState(false)
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  useEffect(() => {
    const storedEmail = sessionStorage.getItem('signupEmail')
    const storedName = sessionStorage.getItem('fullName')
    if (!storedEmail) {
      router.push('/signup')
      return
    }
    setEmail(storedEmail)
    setFullName(storedName || 'User')
  }, [router])

  // Countdown timer
  useEffect(() => {
    if (timeLeft <= 0) {
      setCanResend(true)
      return
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1)
    }, 1000)

    return () => clearInterval(timer)
  }, [timeLeft])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return

    const newOtp = [...otp]
    newOtp[index] = value.slice(-1)
    setOtp(newOtp)

    // Auto focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  const handleKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const pastedData = e.clipboardData.getData('text').slice(0, 6)
    if (!/^\d{6}$/.test(pastedData)) return

    setOtp(pastedData.split(''))
    inputRefs.current[5]?.focus()
  }

  const handleVerifyOtp = async () => {
    const otpCode = otp.join('')

    if (otpCode.length !== 6) {
      setError('Please enter all 6 digits')
      return
    }

    setIsLoading(true)
    setError('')

    try {
      const response = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          code: otpCode,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Verification failed')
        return
      }

      setSuccess(true)
      // Show BPC modal immediately after successful verification
      setTimeout(() => {
        setShowBpcModal(true)
      }, 500)
    } catch (err) {
      console.error('[v0] Verification error:', err)
      setError('An error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleResendOtp = async () => {
    if (isLoading) return
    
    setCanResend(false)
    setTimeLeft(300)
    setError('')
    setOtp(['', '', '', '', '', ''])

    try {
      const response = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      if (!response.ok) {
        const data = await response.json()
        setError(data.error || 'Failed to resend OTP')
        
        // If rate limited, keep cooldown active
        if (response.status === 429) {
          setCanResend(false)
        } else {
          setCanResend(true)
        }
        return
      }

      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (err) {
      console.error('[v0] Resend error:', err)
      setError('Failed to resend OTP')
      setCanResend(true)
    }
  }

  return (
    <div className="min-h-screen bg-[#0000ff] flex flex-col items-center justify-center px-3 py-6 sm:px-4 sm:py-8">
      <div className="w-full max-w-md flex flex-col">
        {/* Title - Shifted upward */}
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white text-center mb-2 sm:mb-3">
          Verify Your Email
        </h1>

        {/* Subtitle with email and instructions */}
        <p className="text-white text-center text-xs sm:text-sm mb-5 sm:mb-8 leading-relaxed">
          Please check your email inbox or spam folder for the OTP verification code sent to{' '}
          <span className="font-bold break-all">{email}</span>. You must enter the correct OTP code before proceeding to secure your BLUEPAY PRO V30 account.
        </p>

        {/* OTP Container Card */}
        <div className="bg-[#0000ff] bg-opacity-40 backdrop-blur-md border border-white border-opacity-20 rounded-2xl sm:rounded-3xl p-4 sm:p-8 mb-4 sm:mb-8">
          {/* OTP Label */}
          <label className="text-white text-sm font-semibold block mb-4">Enter 6-digit code</label>

          {/* OTP Input Boxes - Fintech Style */}
          <div className="flex gap-2 sm:gap-3 justify-center mb-5 sm:mb-8">
            {otp.map((digit, index) => (
              <input
                key={index}
                ref={(el) => {
                  inputRefs.current[index] = el
                }}
                type="tel"
                maxLength={1}
                value={digit}
                onChange={(e) => handleOtpChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                onPaste={handlePaste}
                placeholder=""
                className="w-10 h-10 sm:w-12 sm:h-12 text-center text-lg sm:text-2xl md:text-3xl font-bold border-2 border-white border-opacity-40 rounded-lg sm:rounded-xl bg-white text-gray-900 placeholder-gray-400 focus:border-white focus:outline-none focus:border-opacity-100 focus:ring-2 focus:ring-blue-500 transition-all opacity-100"
                style={{
                  color: '#111827',
                  backgroundColor: '#FFFFFF',
                  caretColor: '#1D4ED8',
                  WebkitTextFillColor: '#111827',
                }}
                autoComplete="off"
                inputMode="numeric"
              />
            ))}
          </div>

          {/* Verify Button */}
          <button
            onClick={handleVerifyOtp}
            disabled={isLoading || otp.some((d) => !d)}
            className="w-full bg-white text-gray-400 font-bold text-sm sm:text-lg py-2 sm:py-3 rounded-lg sm:rounded-2xl hover:bg-gray-50 disabled:opacity-70 disabled:cursor-not-allowed transition-all mb-4 sm:mb-6"
          >
            {isLoading ? 'Verifying...' : 'VERIFY CODE'}
          </button>

          {/* Timer */}
          <div className="text-center">
            <p className="text-white text-sm sm:text-lg">
              Code expires in{' '}
              <span className="font-bold">{formatTime(timeLeft)}</span>
            </p>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 bg-red-500 bg-opacity-20 border border-red-400 rounded-lg p-3 flex items-start gap-2">
            <AlertCircle className="w-4 sm:w-5 h-4 sm:h-5 text-red-300 flex-shrink-0 mt-0.5" />
            <p className="text-red-200 text-xs sm:text-sm">{error}</p>
          </div>
        )}

        {/* Success Message */}
        {success && (
          <div className="mb-4 bg-green-500 bg-opacity-20 border border-green-400 rounded-lg p-3 flex items-start gap-2">
            <CheckCircle className="w-4 sm:w-5 h-4 sm:h-5 text-green-300 flex-shrink-0 mt-0.5" />
            <p className="text-green-200 text-xs sm:text-sm">Email verified successfully!</p>
          </div>
        )}

        {/* Footer */}
        <p className="text-white text-center text-xs sm:text-sm mb-3 sm:mb-4">
          Didn&apos;t receive the code? Check your spam folder.
        </p>

        {/* Resend OTP */}
        {canResend && (
          <button
            onClick={handleResendOtp}
            className="w-full px-4 sm:px-6 py-2.5 sm:py-3 bg-white text-[#0000ff] font-bold text-sm sm:text-base rounded-lg sm:rounded-2xl hover:bg-gray-50 transition-all"
          >
            Resend Code
          </button>
        )}
        
        {!canResend && (
          <p className="text-white text-center text-xs sm:text-sm opacity-70">
            Resend available in {formatTime(timeLeft)}
          </p>
        )}
      </div>

      {/* BPC Notification Modal */}
      <BPCNotificationModal
        isOpen={showBpcModal}
        onClose={() => {
          setShowBpcModal(false)
          router.push('/dashboard')
        }}
        userName={fullName}
      />
    </div>
  )
}
