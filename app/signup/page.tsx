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
  
  // Prevent duplicate submissions
  const submitInProgressRef = useRef(false)

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
    const interval = setInterval(() => {
      setCooldownSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(interval)
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

    if (!validateForm()) {
      return
    }

    submitInProgressRef.current = true
    setIsLoading(true)

    try {
      // First create the user account
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
        setGeneralError(signupData.error || 'Account creation failed')
        submitInProgressRef.current = false
        setIsLoading(false)
        return
      }

      // Store info for creating account animation
      sessionStorage.setItem('signupEmail', email)
      sessionStorage.setItem('signupFullName', fullName)

      // Send OTP to email
      const otpResponse = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      const otpData = await otpResponse.json()

      if (!otpResponse.ok) {
        const errorMessage = otpData.error || 'Failed to send verification code'
        setGeneralError(errorMessage)
        
        // Apply cooldown on rate limit error
        if (otpResponse.status === 429) {
          startCooldown()
        }
        
        submitInProgressRef.current = false
        setIsLoading(false)
        return
      }

      // Redirect to creating account animation page
      startCooldown()
      setTimeout(() => {
        router.push('/creating-account')
      }, 500)
    } catch (error) {
      console.error('[v0] Signup error:', error)
      const errorMessage = error instanceof Error ? error.message : 'Network error. Please try again.'
      setGeneralError(errorMessage)
      submitInProgressRef.current = false
    } finally {
      setIsLoading(false)
    }
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
                disabled={isLoading || cooldownSeconds > 0}
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
                }}
                disabled={isLoading || cooldownSeconds > 0}
                className="w-full px-4 sm:px-6 py-3 sm:py-4 bg-blue-600/40 border border-white/30 rounded-xl sm:rounded-2xl text-white text-sm sm:text-base placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white/60 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              />
              {errors.email && (
                <p className="text-red-200 text-xs sm:text-sm mt-1">{errors.email}</p>
              )}
            </div>

            {/* General Error */}
            {generalError && (
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
              disabled={isLoading || cooldownSeconds > 0}
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
