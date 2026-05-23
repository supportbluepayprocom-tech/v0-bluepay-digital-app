'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { validateEmail } from '@/lib/utils'

export default function SigninPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState(false)
  const [generalError, setGeneralError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!email) {
      newErrors.email = 'Email is required'
    } else if (!validateEmail(email)) {
      newErrors.email = 'Invalid email address'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setGeneralError('')
    setSuccessMessage('')

    if (!validateForm()) {
      return
    }

    setIsLoading(true)

    try {
      // First check if user exists in BLUEPAY PRO V30
      const checkResponse = await fetch('/api/auth/check-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.toLowerCase() }),
      })

      const checkData = await checkResponse.json()

      if (!checkResponse.ok) {
        setGeneralError(checkData.error || 'Error checking account')
        setIsLoading(false)
        return
      }

      // If user doesn't exist, prompt them to create an account
      if (!checkData.exists) {
        setGeneralError('No account found with this email. Please create an account first.')
        setIsLoading(false)
        return
      }

      // User exists - store their name for the session
      if (checkData.user?.fullName) {
        sessionStorage.setItem('userFullName', checkData.user.fullName)
      }

      // Send OTP for signin
      const otpResponse = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.toLowerCase() }),
      })

      const otpData = await otpResponse.json()

      if (!otpResponse.ok) {
        setGeneralError(otpData.error || 'Failed to send verification code')
        setIsLoading(false)
        return
      }

      // Store email for verification
      sessionStorage.setItem('signinEmail', email.toLowerCase())
      setSuccessMessage('Verification code sent to your email!')
      
      // Redirect to verification
      setTimeout(() => {
        router.push('/verify-signin')
      }, 1500)
    } catch (error) {
      console.error('[v0] Signin error:', error)
      setGeneralError('Network error. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleBack = () => {
    router.back()
  }

  return (
    <div className="min-h-screen bg-[#0000ff] flex flex-col items-center justify-center px-3 py-6 sm:px-4 sm:py-8">
      <div className="w-full max-w-md flex flex-col">
        {/* Header - Shifted upward */}
        <div className="text-center mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-4xl font-bold text-white mb-1 drop-shadow-lg">
            BLUEPAY
          </h1>
          <p className="text-lg sm:text-2xl font-bold text-white drop-shadow-lg mb-4">
            PRO V30
          </p>
        </div>

        {/* Sign In Card */}
        <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl sm:rounded-3xl p-5 sm:p-8 mb-4 sm:mb-6">
          {/* Title */}
          <h2 className="text-xl sm:text-3xl font-bold text-white text-center mb-2 sm:mb-3">
            Sign In
          </h2>

          {/* Subtitle */}
          <p className="text-center text-white/80 text-xs sm:text-sm mb-5 sm:mb-6 leading-relaxed">
            Welcome back to BLUEPAY PRO V30. Enter the email you used to create your account to sign in securely.
          </p>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
            {/* Email Label */}
            <div>
              <label className="block text-white font-semibold mb-2 text-sm sm:text-base">
                Email Address
              </label>
              <input
                type="email"
                placeholder="Enter your registered email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value)
                  if (errors.email) setErrors({ ...errors, email: '' })
                  if (generalError) setGeneralError('')
                }}
                className="w-full px-4 sm:px-6 py-3 sm:py-4 bg-blue-600/40 border border-white/30 rounded-xl sm:rounded-2xl text-white text-sm sm:text-base placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white/60 transition-all"
              />
              {errors.email && (
                <p className="text-red-200 text-xs sm:text-sm mt-1">{errors.email}</p>
              )}
            </div>

            {/* General Error */}
            {generalError && (
              <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-3 text-red-200 text-xs sm:text-sm">
                {generalError}
                {generalError.includes('create an account') && (
                  <Link 
                    href="/signup" 
                    className="block mt-2 text-white underline font-semibold hover:text-gray-100"
                  >
                    Create Account Now
                  </Link>
                )}
              </div>
            )}

            {/* Success Message */}
            {successMessage && (
              <div className="bg-green-500/20 border border-green-500/50 rounded-lg p-3 text-green-200 text-xs sm:text-sm">
                {successMessage}
              </div>
            )}

            {/* Continue Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full px-4 sm:px-6 py-3 sm:py-4 bg-white text-[#0000ff] font-bold text-sm sm:text-lg rounded-xl sm:rounded-2xl shadow-2xl hover:shadow-xl hover:scale-105 disabled:opacity-70 disabled:cursor-not-allowed transition-all duration-300 active:scale-95"
            >
              {isLoading ? 'Checking...' : 'Continue'}
            </button>
          </form>

          {/* Sign Up Link */}
          <p className="text-center text-white text-xs sm:text-sm mt-4 sm:mt-6">
            Don&apos;t have an account?{' '}
            <Link
              href="/signup"
              className="font-bold text-white underline hover:text-gray-100 transition-colors"
            >
              Sign Up
            </Link>
          </p>
        </div>

        {/* Back Button */}
        <button
          onClick={handleBack}
          className="w-full px-4 sm:px-6 py-3 sm:py-4 bg-white text-[#0000ff] font-bold text-sm sm:text-lg rounded-xl sm:rounded-2xl shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 active:scale-95 flex items-center justify-center gap-2"
        >
          <ArrowLeft size={18} />
          Back
        </button>
      </div>
    </div>
  )
}
