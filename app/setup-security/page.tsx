'use client'

import { useState, useRef, ChangeEvent, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Lock, Fingerprint, Camera, Upload, Check, AlertCircle } from 'lucide-react'

export default function SetupSecurityPage() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [step, setStep] = useState<'options' | 'pin' | 'fingerprint' | 'profile'>('options')
  const [pin, setPin] = useState(['', '', '', '', '', ''])
  const [profileImage, setProfileImage] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [pinConfirmation, setPinConfirmation] = useState('')
  const [showPinMatches, setShowPinMatches] = useState(false)
  const [isScanningFingerprint, setIsScanningFingerprint] = useState(false)
  const [fingerprintScanned, setFingerprintScanned] = useState(false)

  const handlePinChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return
    const newPin = [...pin]
    newPin[index] = value.slice(-1)
    setPin(newPin)
  }

  const handleImageUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      setProfileImage(event.target?.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleFingerprintScan = async () => {
    setIsScanningFingerprint(true)
    
    // Simulate fingerprint scan
    await new Promise((resolve) => setTimeout(resolve, 2000))
    
    setFingerprintScanned(true)
    setIsScanningFingerprint(false)
  }

  const handlePinSetup = (e: FormEvent) => {
    e.preventDefault()
    const pinCode = pin.join('')

    if (pinCode.length !== 6) {
      setError('Please enter a 6-digit PIN')
      return
    }

    setPinConfirmation(pinCode)
    setShowPinMatches(true)
    setPin(['', '', '', '', '', ''])
    setError('')
  }

  const handleSkip = () => {
    setStep('profile')
  }

  const handleProfileSetup = async (e: FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      // Here you would upload the profile picture to Supabase Storage
      // For now, we'll just proceed to the dashboard
      sessionStorage.removeItem('signupEmail')
      sessionStorage.removeItem('signupName')
      router.push('/dashboard')
    } catch (err) {
      console.error('[v0] Profile setup error:', err)
      setError('Failed to setup profile')
    } finally {
      setIsLoading(false)
    }
  }

  const handleFinishSetup = async () => {
    setIsLoading(true)
    setError('')

    try {
      sessionStorage.removeItem('signupEmail')
      sessionStorage.removeItem('signupName')
      router.push('/dashboard')
    } catch (err) {
      console.error('[v0] Finish setup error:', err)
      setError('Failed to complete setup')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0000ff] to-[#3366ff] flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        {/* Back Button */}
        {step !== 'options' && (
          <button
            onClick={() => setStep('options')}
            className="mb-6 flex items-center gap-2 text-white hover:text-gray-100 transition"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back</span>
          </button>
        )}

        {/* Glass Card - Premium Fintech Style */}
        <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-3xl shadow-2xl p-8">
          {/* Options Step */}
          {step === 'options' && (
            <>
              <div className="text-center mb-8">
                <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">
                  Protect Your Account
                </h1>
                <p className="text-white/70 text-sm">Choose a security method to secure your BLUEPAY PRO V30 account</p>
              </div>

              <div className="space-y-4">
                {/* Security PIN Option */}
                <button
                  onClick={() => setStep('pin')}
                  className="w-full p-5 border-2 border-white/30 rounded-2xl hover:border-white hover:bg-white/10 transition group"
                >
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-[#0000ff] rounded-xl group-hover:bg-blue-700 transition">
                      <Lock className="w-6 h-6 text-white" />
                    </div>
                    <div className="text-left flex-1">
                      <h3 className="font-bold text-white mb-1">
                        Create 6-Digit PIN
                      </h3>
                      <p className="text-sm text-white/70">
                        Secure your account with a personal 6-digit identification code
                      </p>
                    </div>
                  </div>
                </button>

                {/* Fingerprint Option */}
                <button
                  onClick={() => setStep('fingerprint')}
                  className="w-full p-5 border-2 border-white/30 rounded-2xl hover:border-white hover:bg-white/10 transition group"
                >
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-[#0000ff] rounded-xl group-hover:bg-blue-700 transition">
                      <Fingerprint className="w-6 h-6 text-white" />
                    </div>
                    <div className="text-left flex-1">
                      <h3 className="font-bold text-white mb-1">
                        Enable Fingerprint
                      </h3>
                      <p className="text-sm text-white/70">
                        Use biometric fingerprint for fast and secure access
                      </p>
                    </div>
                  </div>
                </button>

                {/* Skip Option */}
                <button
                  onClick={() => setStep('profile')}
                  className="w-full py-3 text-white hover:text-white/80 font-semibold transition"
                >
                  Skip for Now
                </button>
              </div>
            </>
          )}

          {/* PIN Setup Step */}
          {step === 'pin' && (
            <>
              <div className="text-center mb-8">
                <h1 className="text-2xl font-bold text-white mb-2">
                  {showPinMatches ? 'Confirm Your PIN' : 'Create Your PIN'}
                </h1>
                <p className="text-white/70 text-sm">
                  {showPinMatches
                    ? 'Re-enter your PIN to confirm'
                    : 'Enter a secure 6-digit PIN code for your account'}
                </p>
              </div>

              {error && (
                <div className="mb-6 bg-red-500/20 border border-red-400/50 rounded-lg p-3 flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-red-300 flex-shrink-0 mt-0.5" />
                  <p className="text-red-200 text-sm">{error}</p>
                </div>
              )}

              <form onSubmit={handlePinSetup} className="space-y-6">
                <div className="flex gap-2 justify-center">
                  {pin.map((digit, index) => (
                    <input
                      key={index}
                      type="password"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handlePinChange(index, e.target.value)}
                      className="w-12 h-12 md:w-14 md:h-14 text-center text-2xl font-bold border-2 border-white/30 rounded-lg bg-white/10 text-white placeholder-white/40 focus:border-white focus:outline-none focus:ring-2 focus:ring-white/30 transition"
                    />
                  ))}
                </div>

                {showPinMatches && pinConfirmation && (
                  <div className="bg-green-500/20 border border-green-400/50 rounded-lg p-4 text-center">
                    <Check className="w-6 h-6 text-green-300 mx-auto mb-2" />
                    <p className="text-green-200 font-semibold">PIN Confirmed!</p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-white text-[#0000ff] font-bold py-3 rounded-2xl hover:bg-gray-100 transition duration-300 disabled:opacity-70"
                >
                  {showPinMatches ? 'NEXT' : 'CONTINUE'}
                </button>
              </form>

              {showPinMatches && (
                <button
                  onClick={() => setStep('profile')}
                  className="w-full mt-4 py-2 text-white hover:text-white/80 font-semibold"
                >
                  Skip Biometric Setup
                </button>
              )}
            </>
          )}

          {/* Fingerprint Setup Step */}
          {step === 'fingerprint' && (
            <>
              <div className="text-center mb-8">
                <h1 className="text-2xl font-bold text-white mb-2">
                  Biometric Authentication
                </h1>
                <p className="text-white/70 text-sm">
                  Enable fingerprint scanning for fast and secure access
                </p>
              </div>

              <div className="space-y-6">
                {/* Premium Fingerprint Scanner Animation */}
                <div className="flex justify-center py-8">
                  <div className="relative w-40 h-40">
                    {/* Multiple animated rings for scanning effect */}
                    {isScanningFingerprint && (
                      <>
                        <div className="absolute inset-0 border-2 border-blue-400/40 rounded-full animate-ping" style={{ animationDuration: '1.5s' }} />
                        <div className="absolute inset-0 border border-blue-300/30 rounded-full animate-pulse" style={{ animationDuration: '2s' }} />
                      </>
                    )}
                    {/* Main outer circle */}
                    <div
                      className={`absolute inset-0 border-4 rounded-full transition-all duration-300 ${
                        isScanningFingerprint
                          ? 'border-white/80 shadow-lg shadow-blue-500/50'
                          : fingerprintScanned
                            ? 'border-green-400 shadow-lg shadow-green-500/50'
                            : 'border-white/30'
                      }`}
                    />

                    {/* Inner fingerprint icon with glow */}
                    <div
                      className={`absolute inset-0 flex items-center justify-center transition-all duration-300 ${
                        isScanningFingerprint ? 'scale-110' : 'scale-100'
                      }`}
                    >
                      {fingerprintScanned ? (
                        <div className="relative">
                          <div className="absolute inset-0 bg-green-300 rounded-full blur-lg opacity-30 animate-pulse" />
                          <Check className="w-16 h-16 text-green-300 relative z-10" />
                        </div>
                      ) : (
                        <div className="relative">
                          {isScanningFingerprint && (
                            <div className="absolute inset-0 bg-blue-400 rounded-full blur-md opacity-30 animate-pulse" />
                          )}
                          <Fingerprint className={`w-16 h-16 ${isScanningFingerprint ? 'text-white' : 'text-[#0000ff]'} relative z-10 transition-colors`} />
                        </div>
                      )}
                    </div>

                    {/* Scanning horizontal line animation */}
                    {isScanningFingerprint && (
                      <div className="absolute inset-0 overflow-hidden rounded-full">
                        <div className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-white to-transparent top-1/2 animate-scan" style={{ animation: 'scan 1.5s ease-in-out infinite' }} />
                      </div>
                    )}
                  </div>
                </div>

                {/* Enhanced Status Display */}
                <div className="text-center bg-white/5 rounded-2xl p-4 border border-white/10">
                  {fingerprintScanned ? (
                    <div className="space-y-1">
                      <p className="text-green-300 font-bold text-lg">✓ Fingerprint Verified</p>
                      <p className="text-sm text-white/70">
                        Your biometric security is now active
                      </p>
                    </div>
                  ) : isScanningFingerprint ? (
                    <div className="space-y-1">
                      <p className="text-white font-bold text-lg">Scanning Fingerprint...</p>
                      <p className="text-sm text-white/70">
                        Place your finger on the sensor
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <p className="text-white font-bold">Ready to Scan</p>
                      <p className="text-sm text-white/70">
                        Tap the button to begin scanning
                      </p>
                    </div>
                  )}
                </div>

                {/* Scan Button */}
                <button
                  onClick={handleFingerprintScan}
                  disabled={isScanningFingerprint || fingerprintScanned}
                  className="w-full bg-white text-[#0000ff] font-bold py-3 rounded-2xl hover:bg-gray-100 transition duration-300 disabled:opacity-70"
                >
                  {fingerprintScanned
                    ? 'FINGERPRINT VERIFIED'
                    : isScanningFingerprint
                      ? 'SCANNING...'
                      : 'START SCAN'}
                </button>

                {/* Continue Button */}
                {fingerprintScanned && (
                  <button
                    onClick={() => setStep('profile')}
                    className="w-full bg-white/10 hover:bg-white/20 text-white font-bold py-3 rounded-2xl border border-white/30 transition"
                  >
                    CONTINUE
                  </button>
                )}

                {/* Skip Option */}
                <button
                  onClick={() => setStep('profile')}
                  className="w-full text-white hover:text-white/80 font-semibold text-sm"
                >
                  Skip This Step
                </button>
              </div>
            </>
          )}

          {/* Profile Setup Step */}
          {step === 'profile' && (
            <>
              <div className="text-center mb-8">
                <h1 className="text-2xl font-bold text-white mb-2">
                  Complete Your Profile
                </h1>
                <p className="text-white/70 text-sm">
                  Add a profile picture (optional)
                </p>
              </div>

              <form onSubmit={handleProfileSetup} className="space-y-6">
                {/* Profile Picture Upload */}
                <div className="flex flex-col items-center">
                  {profileImage ? (
                    <div className="relative mb-4">
                      <img
                        src={profileImage}
                        alt="Profile"
                        className="w-32 h-32 rounded-full object-cover border-4 border-[#0000ff]"
                      />
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="absolute bottom-0 right-0 bg-[#0000ff] text-white p-2 rounded-full hover:bg-blue-700 transition"
                      >
                        <Camera className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="w-32 h-32 bg-white/10 rounded-full flex items-center justify-center mb-4 border-2 border-dashed border-white/30">
                      <Upload className="w-8 h-8 text-white/60" />
                    </div>
                  )}

                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleImageUpload}
                    accept="image/*"
                    className="hidden"
                  />

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="text-white hover:text-white/80 font-semibold text-sm"
                  >
                    {profileImage ? 'Change Photo' : 'Upload Photo'}
                  </button>
                </div>

                {error && (
                  <div className="bg-red-500/20 border border-red-400/50 rounded-lg p-3 flex items-start gap-2">
                    <AlertCircle className="w-5 h-5 text-red-300 flex-shrink-0 mt-0.5" />
                    <p className="text-red-200 text-sm">{error}</p>
                  </div>
                )}

                {/* Finish Button */}
                <button
                  type="button"
                  onClick={handleFinishSetup}
                  disabled={isLoading}
                  className="w-full bg-white text-[#0000ff] font-bold py-3 rounded-2xl hover:bg-gray-100 transition duration-300 disabled:opacity-70"
                >
                  {isLoading ? 'Setting Up...' : 'FINISH SETUP'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>

      <style>{`
        @keyframes scan {
          0% {
            top: 0;
          }
          50% {
            top: 50%;
          }
          100% {
            top: 100%;
          }
        }
        
        @keyframes fingerprint-scan {
          0% {
            top: -100%;
          }
          100% {
            top: 100%;
          }
        }
      `}</style>
    </div>
  )
}
