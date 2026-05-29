'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { validateEmail } from '@/lib/utils'

const OTP_COOLDOWN_SECONDS = 60

export default function SignupPage() {
  const router = useRouter()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState(false)
  const [generalError, setGeneralError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [cooldownSeconds, setCooldownSeconds] = useState(0)
  const [isExistingAccount, setIsExistingAccount] = useState(false)
  
  // Prevent duplicate submissions
  const submitInProgressRef = useRef(false)
  const cooldownIntervalRef = useRef<NodeJS.Timeout | null>(null)

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!fullName.trim()) {
      newErrors.fullName = 'Full name is required'
    }

    if (!email) {
      newErrors.email = 'Email is required'
    } else if (!validateEmail(email)) {
      newErrors.email = 'Invalid email address'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const startCooldown = () => {
    setCooldownSeconds(OTP_COOLDOWN_SECONDS)
    if (cooldownIntervalRef.current) clearInterval(cooldownIntervalRef.current)
    
    cooldownIntervalRef.current = setInterval(() => {
      setCooldownSeconds((prev) => {
        if (prev <= 1) {
          if (cooldownIntervalRef.current) clearInterval(cooldownIntervalRef.current)
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Prevent duplicate submissions
    if (submitInProgressRef.current || isLoading || cooldownSeconds > 0) {
      return
    }

    setGeneralError('')
    setSuccessMessage('')
    setIsExistingAccount(false)

    if (!validateForm()) {
      return
    }

    submitInProgressRef.current = true
    setIsLoading(true)

    try {
      console.log('[v0] signup: Step 1 - Checking if email exists:', email)
      
      // STEP 1: Check if email already exists BEFORE attempting anything
      const checkEmailResponse = await fetch('/api/auth/check-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      const checkEmailData = await checkEmailResponse.json()

      if (!checkEmailResponse.ok) {
        console.error('[v0] signup: Email check failed:', checkEmailData)
        setGeneralError(checkEmailData.error || 'Unable to verify email. Please try again.')
        submitInProgressRef.current = false
        setIsLoading(false)
        return
      }

      // If email already exists, show the user a login prompt
      if (checkEmailData.exists) {
        console.log('[v0] signup: Email already exists - showing login prompt')
        setIsExistingAccount(true)
        setGeneralError(checkEmailData.message || 'An account with this email already exists. Please login.')
        submitInProgressRef.current = false
        setIsLoading(false)
        return
      }

      console.log('[v0] signup: Email is available - proceeding with account creation')

      // STEP 2: Create the user account (only if email is new)
      const signupResponse = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          fullName,
        }),
      })

      const signupData = await signupResponse.json()

      if (!signupResponse.ok) {
        console.error('[v0] signup: Account creation failed:', signupData)
        setGeneralError(signupData.error || 'Account creation failed')
        submitInProgressRef.current = false
        setIsLoading(false)
        return
      }

      console.log('[v0] signup: Account created successfully')

      // Store info for creating account animation
      sessionStorage.setItem('signupEmail', email)
      sessionStorage.setItem('signupFullName', fullName)

      // STEP 3: Send OTP to email (only after account creation succeeds)
      console.log('[v0] signup: Sending OTP to email:', email)
      const otpResponse = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      const otpData = await otpResponse.json()

      if (!otpResponse.ok) {
        const errorMessage = otpData.error || 'Failed to send verification code'
        console.error('[v0] signup: OTP sending failed:', errorMessage, 'Status:', otpResponse.status)
        setGeneralError(errorMessage)
        
        // Do NOT apply cooldown if OTP failed - only apply after successful delivery
        submitInProgressRef.current = false
        setIsLoading(false)
        return
      }

      console.log('[v0] signup: OTP sent successfully - starting cooldown')
      
      // STEP 4: Only start cooldown AFTER OTP is successfully sent
      setSuccessMessage('Verification code sent to your email!')
      startCooldown()
      
      // Redirect to creating account animation page
      setTimeout(() => {
        router.push('/creating-account')
      }, 1000)
    } catch (error) {
      console.error('[v0] signup: Unexpected error:', error)
      const errorMessage = error instanceof Error ? error.message : 'Network error. Please try again.'
      setGeneralError(errorMessage)
      submitInProgressRef.current = false
    } finally {
      setIsLoading(false)
    }
  }

  const handleLoginRedirect = () => {
    router.push('/signin')
  }

  return (
    <div className="min-h-screen bg-[#0000ff] flex flex-col items-center justify-center px-3 py-6 sm:px-4 sm:py-8">
      <div className="w-full max-w-md">
        {/* Welcome heading */}
        <div className="text-center mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-4xl font-bold text-white mb-2 sm:mb-3 drop-shadow-lg">
            Create Account
          </h1>
          <p className="text-xs sm:text-sm text-white drop-shadow-lg leading-relaxed">
            Create your BLUEPAY PRO V30 account to start earning rewards, purchasing services, withdrawing funds and accessing premium financial solutions instantly.
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl sm:rounded-3xl p-5 sm:p-8 mb-4 sm:mb-6">
          {/* Show existing account error with login redirect */}
          {isExistingAccount && (
            <div className="mb-6">
              <div className="bg-orange-500/20 border border-orange-500/50 rounded-lg p-4 mb-4">
                <p className="text-orange-200 text-sm sm:text-base font-semibold mb-3">
                  Account Already Exists
                </p>
                <p className="text-orange-100 text-xs sm:text-sm mb-4">
                  An account with this email already exists. Please login to your account instead.
                </p>
                <button
                  onClick={handleLoginRedirect}
                  className="w-full px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white font-semibold text-sm rounded-lg transition-colors"
                >
                  Login Instead
                </button>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
            {/* Full Name Input */}
            <div>
              <input
                type="text"
                placeholder="Full Name"
                value={fullName}
                onChange={(e) => {
                  setFullName(e.target.value)
                  if (errors.fullName) setErrors({ ...errors, fullName: '' })
                }}
                disabled={isLoading || cooldownSeconds > 0 || isExistingAccount}
                className="w-full px-4 sm:px-6 py-3 sm:py-4 bg-blue-600/40 border border-white/30 rounded-xl sm:rounded-2xl text-white text-sm sm:text-base placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white/60 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              />
              {errors.fullName && (
                <p className="text-red-200 text-xs sm:text-sm mt-1">{errors.fullName}</p>
              )}
            </div>

            {/* Email Input */}
            <div>
              <input
                type="email"
                placeholder="Email Address"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value)
                  if (errors.email) setErrors({ ...errors, email: '' })
                  setIsExistingAccount(false)
                }}
                disabled={isLoading || cooldownSeconds > 0 || isExistingAccount}
                className="w-full px-4 sm:px-6 py-3 sm:py-4 bg-blue-600/40 border border-white/30 rounded-xl sm:rounded-2xl text-white text-sm sm:text-base placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white/60 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              />
              {errors.email && (
                <p className="text-red-200 text-xs sm:text-sm mt-1">{errors.email}</p>
              )}
            </div>

            {/* General Error (for non-existing-account errors) */}
            {generalError && !isExistingAccount && (
              <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-3 text-red-200 text-xs sm:text-sm">
                {generalError}
              </div>
            )}

            {/* Success Message */}
            {successMessage && (
              <div className="bg-green-500/20 border border-green-500/50 rounded-lg p-3 text-green-200 text-xs sm:text-sm">
                {successMessage}
              </div>
            )}

            {/* Cooldown Message */}
            {cooldownSeconds > 0 && !successMessage && (
              <div className="bg-blue-500/20 border border-blue-500/50 rounded-lg p-3 text-blue-200 text-xs sm:text-sm text-center">
                Please wait {cooldownSeconds}s before requesting another code
              </div>
            )}

            {/* Create Account Button */}
            <button
              type="submit"
              disabled={isLoading || cooldownSeconds > 0 || isExistingAccount}
              className="w-full px-4 sm:px-6 py-3 sm:py-4 bg-white text-[#0000ff] font-bold text-sm sm:text-lg rounded-xl sm:rounded-2xl shadow-2xl hover:shadow-xl hover:scale-105 disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:scale-100 transition-all duration-300 active:scale-95"
            >
              {isLoading ? 'Creating Account...' : cooldownSeconds > 0 ? `Wait ${cooldownSeconds}s` : 'CREATE ACCOUNT'}
            </button>
          </form>

          {/* Terms & Conditions */}
          <p className="text-center text-white text-xs sm:text-sm mt-4 sm:mt-6 drop-shadow-lg leading-relaxed">
            We&apos;ll send a verification code to your email. By continuing, you agree to our{' '}
            <span className="font-semibold">terms & conditions</span>
          </p>
        </div>

        {/* Sign In Link */}
        <p className="text-center text-white text-xs sm:text-sm drop-shadow-lg">
          Already have an account?{' '}
          <Link href="/signin" className="font-bold underline hover:text-gray-100 transition-colors">
            Sign In
          </Link>
        </p>
      </div>
    </div>
  )
}
