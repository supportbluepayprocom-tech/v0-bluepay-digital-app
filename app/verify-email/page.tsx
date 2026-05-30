'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function VerifyPinPage() {
  const router = useRouter()
  const [pin, setPin] = useState(['', '', '', '', '', ''])
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  useEffect(() => {
    const storedEmail = sessionStorage.getItem('signupEmail')
    if (!storedEmail) {
      router.push('/signup')
      return
    }
  }, [router])

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return
    const newPin = [...pin]
    newPin[index] = value.slice(-1)
    setPin(newPin)
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !pin[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const pastedData = e.clipboardData.getData('text').slice(0, 6)
    if (!/^\d{6}$/.test(pastedData)) return
    setPin(pastedData.split(''))
    inputRefs.current[5]?.focus()
  }

  const handleVerifyPin = async () => {
    const fullPin = pin.join('')
    if (fullPin.length !== 6) {
      setError('Please enter all 6 digits')
      return
    }

    setIsLoading(true)
    setError('')

    try {
      sessionStorage.setItem('verificationPin', fullPin)
      sessionStorage.setItem('verified', 'true')
      
      setTimeout(() => {
        sessionStorage.removeItem('signupEmail')
        sessionStorage.removeItem('signupFullName')
        sessionStorage.removeItem('verificationPin')
        sessionStorage.removeItem('verified')
        router.push('/dashboard')
      }, 800)
    } catch (err) {
      setError('Verification failed. Please try again.')
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0000ff] flex flex-col items-center justify-center px-4 py-8">
      <div className="w-full max-w-xs">
        {/* Title */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-white mb-2">Create Secure PIN</h1>
          <p className="text-blue-200 text-sm">Enter 6-digit PIN</p>
        </div>

        {/* PIN Input Form */}
        <div className="mb-6">
          <div className="flex gap-2 justify-center mb-4">
            {pin.map((digit, index) => (
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
                className="w-11 h-11 text-center text-xl font-bold bg-white text-[#0000ff] rounded border-2 border-white focus:outline-none focus:ring-2 focus:ring-white transition-all"
                placeholder="•"
              />
            ))}
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 bg-red-500 bg-opacity-20 border border-red-400 rounded">
            <p className="text-red-200 text-xs text-center">{error}</p>
          </div>
        )}

        {/* Verify Button */}
        <button
          onClick={handleVerifyPin}
          disabled={isLoading || pin.some((d) => !d)}
          className="w-full bg-white text-[#0000ff] font-bold text-sm py-2.5 rounded hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          {isLoading ? 'Verifying...' : 'VERIFY PIN'}
        </button>
      </div>
    </div>
  )
}
