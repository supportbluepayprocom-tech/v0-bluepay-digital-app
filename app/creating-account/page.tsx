'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Check } from 'lucide-react'

type ChecklistItem = 'validating' | 'encrypting' | 'generating'

export default function CreatingAccountPage() {
  const router = useRouter()
  const [completed, setCompleted] = useState<ChecklistItem[]>([])
  const [currentStep, setCurrentStep] = useState<ChecklistItem>('validating')
  const [email, setEmail] = useState('')

  useEffect(() => {
    // Get data from session storage
    const userEmail = sessionStorage.getItem('signupEmail') || ''
    
    console.log('[v0] creating-account: Page loaded with email:', userEmail)
    
    if (!userEmail) {
      console.log('[v0] creating-account: No email in sessionStorage, redirecting to signup')
      router.push('/signup')
      return
    }
    
    setEmail(userEmail)

    // Animation sequence
    const timings = {
      validating: 1500,
      encrypting: 1500,
      generating: 1500,
    }

    const validateTimer = setTimeout(() => {
      setCompleted((prev) => [...prev, 'validating'])
      setCurrentStep('encrypting')
    }, timings.validating)

    const encryptTimer = setTimeout(() => {
      setCompleted((prev) => [...prev, 'encrypting'])
      setCurrentStep('generating')
    }, timings.validating + timings.encrypting)

    const generateTimer = setTimeout(() => {
      setCompleted((prev) => [...prev, 'generating'])
      
      // Just redirect to verify-email, no OTP sending
      console.log('[v0] creating-account: Animation complete, redirecting to verify-email')
      
      setTimeout(() => {
        console.log('[v0] creating-account: Redirecting to verify-email')
        router.push('/verify-email')
      }, 800)
    }, timings.validating + timings.encrypting + timings.generating)

    return () => {
      clearTimeout(validateTimer)
      clearTimeout(encryptTimer)
      clearTimeout(generateTimer)
    }
  }, [router])

  const steps = [
    { id: 'validating', label: 'Validating information' },
    { id: 'encrypting', label: 'Encrypting credentials' },
    { id: 'generating', label: 'Generating verification code' },
  ]

  return (
    <div className="min-h-screen bg-[#0000ff] flex flex-col items-center justify-center px-3 py-6 sm:px-4 sm:py-8">
      <div className="w-full max-w-md flex flex-col items-center">
        {/* Spinner Animation */}
        <div className="mb-8 sm:mb-12">
          <div className="w-16 sm:w-24 h-16 sm:h-24 relative">
            <svg
              className="w-full h-full animate-spin"
              viewBox="0 0 100 100"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <circle
                cx="50"
                cy="50"
                r="40"
                stroke="rgba(255, 255, 255, 0.3)"
                strokeWidth="3"
              />
              <circle
                cx="50"
                cy="50"
                r="40"
                stroke="#ffffff"
                strokeWidth="3"
                strokeDasharray="62.8"
                strokeDashoffset="0"
                strokeLinecap="round"
              />
            </svg>
          </div>
        </div>

        {/* Title */}
        <h1 className="text-2xl sm:text-4xl md:text-5xl font-bold text-white text-center mb-2 sm:mb-4">
          Creating Your Account
        </h1>

        {/* Description */}
        <p className="text-white text-center text-xs sm:text-base md:text-lg mb-5 sm:mb-8 leading-relaxed">
          Setting up your BLUEPAY PRO V30 account with security features...
        </p>

        {/* Divider line */}
        <div className="w-full h-0.5 bg-white bg-opacity-30 mb-5 sm:mb-8 rounded-full" />

        {/* Checklist */}
        <div className="w-full space-y-3 sm:space-y-4">
          {steps.map((step) => {
            const isCompleted = completed.includes(step.id as ChecklistItem)
            const isActive = currentStep === step.id

            return (
              <div key={step.id} className="flex items-center gap-3 sm:gap-4">
                {/* Icon/Checkbox */}
                <div
                  className={`flex-shrink-0 w-8 sm:w-10 h-8 sm:h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                    isCompleted
                      ? 'bg-white text-[#0000ff]'
                      : isActive
                        ? 'border-2 border-white'
                        : 'bg-white bg-opacity-20 border-2 border-white'
                  }`}
                >
                  {isCompleted ? (
                    <Check size={20} className="sm:w-6 sm:h-6 font-bold" />
                  ) : isActive ? (
                    <div className="w-3 sm:w-4 h-3 sm:h-4 rounded-full bg-white animate-pulse" />
                  ) : null}
                </div>

                {/* Label */}
                <span
                  className={`text-sm sm:text-lg transition-all duration-300 ${
                    isCompleted || isActive
                      ? 'text-white font-semibold'
                      : 'text-white text-opacity-60'
                  }`}
                >
                  {step.label}
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
