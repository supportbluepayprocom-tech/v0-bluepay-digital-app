'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Check } from 'lucide-react'

export default function VerifyEmailPage() {
  const router = useRouter()
  const [code, setCode] = useState(['', '', '', '', '', ''])
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [email, setEmail] = useState('')
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  useEffect(() => {
    console.log('[v0] verify-page: Page mounted')
    const storedEmail = sessionStorage.getItem('signupEmail')
    
    if (!storedEmail) {
      console.log('[v0] verify-page: No email in sessionStorage, redirecting to signup')
      router.push('/signup')
      return
    }
    
    setEmail(storedEmail)
  }, [router])

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return
    const newCode = [...code]
    newCode[index] = value.slice(-1)
    setCode(newCode)
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const pastedData = e.clipboardData.getData('text').slice(0, 6)
    if (!/^\d{6}$/.test(pastedData)) return
    setCode(pastedData.split(''))
    inputRefs.current[5]?.focus()
  }

  const handleVerifyCode = async () => {
    const fullCode = code.join('')
    if (fullCode.length !== 6) {
      setError('Please enter all 6 digits')
      return
    }

    console.log('[v0] verify-page: Code entered:', fullCode)
    setIsLoading(true)
    setError('')

    try {
      sessionStorage.setItem('verificationCode', fullCode)
      sessionStorage.setItem('verified', 'true')
      setSuccess(true)
      
      setTimeout(() => {
        console.log('[v0] verify-page: Redirecting to dashboard')
        sessionStorage.removeItem('signupEmail')
        sessionStorage.removeItem('signupFullName')
        sessionStorage.removeItem('verificationCode')
        sessionStorage.removeItem('verified')
        router.push('/dashboard')
      }, 1500)
    } catch (err) {
      console.error('[v0] verify-page: Error:', err)
      setError('Verification failed. Please try again.')
      setIsLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-600 to-blue-800 flex flex-col items-center justify-center px-4">
        <div className="flex flex-col items-center gap-4">
          <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center animate-bounce">
            <Check size={40} className="text-blue-600" strokeWidth={3} />
          </div>
          <h1 className="text-3xl font-bold text-white text-center">Verified!</h1>
          <p className="text-blue-100 text-center">Your account is ready to use</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-blue-800 flex flex-col items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">Verify Your Email</h1>
          <p className="text-blue-100 text-sm md:text-base">Enter the 6-digit verification code</p>
        </div>

        <div className="bg-white bg-opacity-10 backdrop-blur rounded-lg p-4 mb-8 text-center">
          <p className="text-blue-100 text-xs md:text-sm mb-1">Verification code sent to</p>
          <p className="text-white font-semibold text-sm md:text-base break-all">{email}</p>
        </div>

        <div className="mb-8">
          <label className="text-white text-sm font-semibold block mb-4">Enter 6-digit code</label>
          <div className="flex gap-3 md:gap-4 justify-center">
            {code.map((digit, index) => (
              <input
                key={index}
                ref={(el) => {
                  if (el) inputRefs.current[index] = el
                }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                onPaste={handlePaste}
                className="w-12 h-12 md:w-14 md:h-14 text-center text-2xl font-bold bg-white text-blue-600 rounded-lg border-2 border-white focus:outline-none focus:ring-2 focus:ring-yellow-300 focus:border-transparent transition-all"
                placeholder="•"
              />
            ))}
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500 bg-opacity-20 border border-red-400 rounded-lg">
            <p className="text-red-200 text-sm text-center">{error}</p>
          </div>
        )}

        <button
          onClick={handleVerifyCode}
          disabled={isLoading || code.some((d) => !d)}
          className="w-full bg-white text-blue-600 font-bold text-base md:text-lg py-3 md:py-4 rounded-lg hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          {isLoading ? 'Verifying...' : 'VERIFY CODE'}
        </button>

        <p className="text-center text-blue-100 text-xs md:text-sm mt-6">
          Check your email for the 6-digit verification code
        </p>
      </div>
    </div>
  )
}
