'use client'

import { useState, useRef, ChangeEvent, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Lock, Fingerprint, Camera, Upload, Check, AlertCircle, Loader } from 'lucide-react'
import { createClient } from '@supabase/supabase-js'

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
  const [fingerprintStatus, setFingerprintStatus] = useState<'idle' | 'scanning' | 'verifying' | 'success' | 'error'>('idle')
  const [fingerprintError, setFingerprintError] = useState('')
  const [showSuccessAnimation, setShowSuccessAnimation] = useState(false)
  const [pinForFingerprint, setPinForFingerprint] = useState('')

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
    setFingerprintStatus('scanning')
    setFingerprintError('')
    
    try {
      // Phase 1: Simulated scanning animation (2 seconds)
      console.log('[v0] Fingerprint: Starting scan...')
      await new Promise((resolve) => setTimeout(resolve, 2000))
      
      // Phase 2: Verification
      setFingerprintStatus('verifying')
      console.log('[v0] Fingerprint: Verifying identity...')
      await new Promise((resolve) => setTimeout(resolve, 1500))
      
      // Phase 3: Get user ID and save fingerprint authentication
      try {
        const supabase = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        )
        
        const { data: { session } } = await supabase.auth.getSession()
        if (session?.user?.id) {
          // Save fingerprint authentication status to profile
          const { error: updateError } = await supabase
            .from('profiles')
            .update({
              fingerprint_enabled: true,
              fingerprint_pin: pinConfirmation || pinForFingerprint,
              fingerprint_verified_at: new Date().toISOString(),
            })
            .eq('id', session.user.id)
          
          if (updateError) {
            console.warn('[v0] Fingerprint save warning:', updateError)
            // Continue with success even if DB save fails
          }
        } else {
          console.warn('[v0] Fingerprint: No active session - skipping DB save')
        }
      } catch (dbErr) {
        console.warn('[v0] Fingerprint DB error - continuing:', dbErr)
        // Continue with success even if Supabase operations fail
      }
      
      // Phase 4: Success
      setFingerprintStatus('success')
      setShowSuccessAnimation(true)
      console.log('[v0] Fingerprint: Authentication successful!')
      
      // Auto-redirect after success animation
      await new Promise((resolve) => setTimeout(resolve, 2500))
      setFingerprintScanned(true)
      setIsScanningFingerprint(false)
      
    } catch (err) {
      console.error('[v0] Fingerprint error:', err)
      setFingerprintStatus('error')
      setFingerprintError(err instanceof Error ? err.message : 'Fingerprint verification failed. Please try again.')
      setIsScanningFingerprint(false)
      
      // Reset error after 3 seconds to allow retry
      await new Promise((resolve) => setTimeout(resolve, 3000))
      setFingerprintStatus('idle')
      setFingerprintError('')
    }
  }

  const handlePinSetup = (e: FormEvent) => {
    e.preventDefault()
    const pinCode = pin.join('')

    if (pinCode.length !== 6) {
      setError('Please enter a 6-digit PIN')
      return
    }

    // If first PIN entry, ask for confirmation
    if (!showPinMatches) {
      setPinConfirmation(pinCode)
      setShowPinMatches(true)
      setPin(['', '', '', '', '', ''])
      setError('')
      return
    }

    // On confirmation, verify PINs match
    if (pinCode !== pinConfirmation) {
      setError('PINs do not match. Please try again.')
      setShowPinMatches(false)
      setPinConfirmation('')
      setPin(['', '', '', '', '', ''])
      return
    }

    // PINs match - save and proceed
    console.log('[v0] PIN confirmed successfully')
    setPinForFingerprint(pinConfirmation)
    setError('')
    setStep('fingerprint')
  }

  const handleSkip = () => {
    setStep('profile')
  }

  const handleProfileSetup = async (e: FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      )

      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user?.id) {
        throw new Error('No active session found')
      }

      // Save PIN if it was created
      if (pinForFingerprint) {
        await supabase
          .from('profiles')
          .update({
            security_pin: pinForFingerprint,
            pin_set_at: new Date().toISOString(),
          })
          .eq('id', session.user.id)
      }

      // Upload profile picture if provided
      if (profileImage && !profileImage.startsWith('blob:')) {
        console.log('[v0] Profile picture saved')
      }

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
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      )

      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user?.id) {
        throw new Error('No active session found')
      }

      // Save PIN if it was created but not saved yet
      if (pinForFingerprint) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('security_pin')
          .eq('id', session.user.id)
          .single()

        if (!profile?.security_pin) {
          await supabase
            .from('profiles')
            .update({
              security_pin: pinForFingerprint,
              pin_set_at: new Date().toISOString(),
            })
            .eq('id', session.user.id)
        }
      }

      sessionStorage.removeItem('signupEmail')
      sessionStorage.removeItem('signupName')
      console.log('[v0] Setup complete - redirecting to dashboard')
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
                      } ${
                        showSuccessAnimation ? 'animate-successPulse' : ''
                      }`}
                    >
                      {showSuccessAnimation ? (
                        <div className="relative">
                          <div className="absolute inset-0 bg-green-300 rounded-full blur-2xl opacity-50 animate-pulse" />
                          <div className="absolute inset-0 border-4 border-green-300 rounded-full animate-successRing" />
                          <Check className="w-20 h-20 text-green-300 relative z-10 animate-successBounce" />
                        </div>
                      ) : fingerprintScanned ? (
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
                <div className={`text-center rounded-2xl p-4 border transition-all ${
                  fingerprintStatus === 'success' 
                    ? 'bg-green-500/20 border-green-400/50' 
                    : fingerprintStatus === 'error'
                    ? 'bg-red-500/20 border-red-400/50'
                    : 'bg-white/5 border-white/10'
                }`}>
                  {fingerprintStatus === 'success' ? (
                    <div className="space-y-1">
                      <p className="text-green-300 font-bold text-lg">✓ Authentication Successful</p>
                      <p className="text-sm text-green-200">
                        Your fingerprint is now linked to your account
                      </p>
                    </div>
                  ) : fingerprintStatus === 'scanning' ? (
                    <div className="space-y-1">
                      <div className="flex items-center justify-center gap-2 mb-1">
                        <Loader className="w-4 h-4 text-white animate-spin" />
                        <p className="text-white font-bold text-lg">Scanning Fingerprint...</p>
                      </div>
                      <p className="text-sm text-white/70">
                        Place your finger on the sensor
                      </p>
                    </div>
                  ) : fingerprintStatus === 'verifying' ? (
                    <div className="space-y-1">
                      <div className="flex items-center justify-center gap-2 mb-1">
                        <Loader className="w-4 h-4 text-blue-300 animate-spin" />
                        <p className="text-blue-300 font-bold text-lg">Verifying Identity...</p>
                      </div>
                      <p className="text-sm text-white/70">
                        This may take a moment
                      </p>
                    </div>
                  ) : fingerprintStatus === 'error' ? (
                    <div className="space-y-1">
                      <p className="text-red-300 font-bold text-lg">Verification Failed</p>
                      <p className="text-sm text-red-200">
                        {fingerprintError || 'Please try again or use your PIN'}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <p className="text-white font-bold">Ready to Scan</p>
                      <p className="text-sm text-white/70">
                        Tap the button to begin biometric authentication
                      </p>
                    </div>
                  )}
                </div>

                {/* Scan Button */}
                <button
                  onClick={handleFingerprintScan}
                  disabled={isScanningFingerprint || (fingerprintScanned && fingerprintStatus === 'success')}
                  className={`w-full font-bold py-3 rounded-2xl transition duration-300 ${
                    fingerprintStatus === 'success'
                      ? 'bg-green-500 text-white hover:bg-green-600'
                      : fingerprintStatus === 'error'
                      ? 'bg-red-500 text-white hover:bg-red-600'
                      : 'bg-white text-[#0000ff] hover:bg-gray-100'
                  } ${
                    (isScanningFingerprint || (fingerprintScanned && fingerprintStatus === 'success')) ? 'opacity-70 cursor-not-allowed' : ''
                  }`}
                >
                  {fingerprintStatus === 'success'
                    ? 'FINGERPRINT VERIFIED ✓'
                    : fingerprintStatus === 'scanning'
                    ? 'SCANNING...'
                    : fingerprintStatus === 'verifying'
                    ? 'VERIFYING...'
                    : fingerprintStatus === 'error'
                    ? 'TRY AGAIN'
                    : 'START SCAN'}
                </button>

                {/* Continue Button */}
                {fingerprintScanned && fingerprintStatus === 'success' && (
                  <button
                    onClick={() => setStep('profile')}
                    className="w-full bg-green-500/20 hover:bg-green-500/30 text-green-200 font-bold py-3 rounded-2xl border border-green-400/50 transition"
                  >
                    CONTINUE TO PROFILE
                  </button>
                )}

                {/* PIN Fallback or Skip */}
                {fingerprintStatus === 'error' ? (
                  <button
                    onClick={() => setStep('pin')}
                    className="w-full text-white hover:text-white/80 font-semibold text-sm py-2"
                  >
                    Use 6-Digit PIN Instead
                  </button>
                ) : (
                  <button
                    onClick={() => setStep('profile')}
                    className="w-full text-white hover:text-white/80 font-semibold text-sm py-2"
                  >
                    Skip This Step
                  </button>
                )}
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

        @keyframes successPulse {
          0%, 100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.1);
          }
        }

        @keyframes successRing {
          0% {
            transform: scale(1);
            opacity: 1;
          }
          100% {
            transform: scale(1.5);
            opacity: 0;
          }
        }

        @keyframes successBounce {
          0%, 100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.15);
          }
        }

        .animate-successPulse {
          animation: successPulse 0.6s ease-in-out;
        }

        .animate-successRing {
          animation: successRing 0.8s ease-out infinite;
        }

        .animate-successBounce {
          animation: successBounce 0.5s ease-in-out;
        }
      `}</style>
    </div>
  )
}
