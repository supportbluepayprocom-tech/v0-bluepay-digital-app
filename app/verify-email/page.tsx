'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Upload, Lock, AlertCircle, Check, Eye, EyeOff, Fingerprint } from 'lucide-react'

export default function VerifyPinPage() {
  const router = useRouter()
  const [pin, setPin] = useState(['', '', '', '', '', ''])
  const [showPin, setShowPin] = useState(false)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [fullName, setFullName] = useState('')
  const [profileImage, setProfileImage] = useState('')
  const [isUploadingImage, setIsUploadingImage] = useState(false)
  const [uploadedSuccessfully, setUploadedSuccessfully] = useState(false)
  const [showFingerprintScanner, setShowFingerprintScanner] = useState(false)
  const [isScanning, setIsScanning] = useState(false)
  const [fingerprintDetected, setFingerprintDetected] = useState(false)
  const [detectedFingerprint, setDetectedFingerprint] = useState<string | null>(null)
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const storedEmail = sessionStorage.getItem('signupEmail')
    const storedName = sessionStorage.getItem('signupFullName')
    
    if (!storedEmail) {
      router.push('/signup')
      return
    }
    
    setFullName(storedName || 'User')
    // Store name for dashboard
    if (storedName) {
      sessionStorage.setItem('userName', storedName)
    }
  }, [router])

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploadingImage(true)
    try {
      const reader = new FileReader()
      reader.onload = (event) => {
        const imageData = event.target?.result as string
        setProfileImage(imageData)
        sessionStorage.setItem('userProfileImage', imageData)
        setUploadedSuccessfully(true)
        setTimeout(() => setUploadedSuccessfully(false), 2000)
      }
      reader.readAsDataURL(file)
    } catch (err) {
      console.error('Error uploading image:', err)
    } finally {
      setIsUploadingImage(false)
    }
  }

  const handleFingerprintScan = () => {
    setShowFingerprintScanner(true)
    setIsScanning(true)
    
    // Simulate fingerprint scanning
    const randomFingerprint = `FP_${Math.random().toString(36).substr(2, 9).toUpperCase()}`
    setDetectedFingerprint(randomFingerprint)
    
    setTimeout(() => {
      setFingerprintDetected(true)
      setIsScanning(false)
      setTimeout(() => {
        setShowFingerprintScanner(false)
        setFingerprintDetected(false)
      }, 1500)
    }, 2000)
  }

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
    <div className="min-h-screen bg-gradient-to-br from-[#0000ff] to-blue-900 flex flex-col items-center justify-center px-4 py-6">
      <div className="w-full max-w-xs">
        {/* Compact Header */}
        <div className="text-center mb-4">
          <h1 className="text-xl font-bold text-white mb-1">Secure Your Account</h1>
          <p className="text-blue-100 text-xs">Dear <span className="font-semibold">{fullName}</span>, create a strong PIN</p>
        </div>

        {/* Profile Picture Upload - Small Circular */}
        <div className="flex justify-center mb-4">
          <label className="relative w-20 h-20 rounded-full border-3 border-dashed border-white/50 cursor-pointer hover:border-white transition-all flex items-center justify-center bg-white/10 backdrop-blur-md group">
            {profileImage ? (
              <img src={profileImage} alt="Profile" className="w-full h-full rounded-full object-cover" />
            ) : (
              <Upload className="w-6 h-6 text-white/60 group-hover:text-white transition" />
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              disabled={isUploadingImage}
              className="hidden"
            />
          </label>
        </div>

        {uploadedSuccessfully && (
          <p className="text-xs text-green-300 text-center mb-4 flex items-center justify-center gap-1">
            <Check className="w-3 h-3" />
            Picture uploaded
          </p>
        )}

        {/* PIN Input Card - Compact */}
        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-4 mb-3">
          {/* PIN Label with Eye Toggle */}
          <div className="flex items-center justify-between mb-3">
            <p className="text-white text-xs font-semibold flex items-center gap-2">
              <Lock className="w-3 h-3" />
              6-Digit PIN
            </p>
            <button
              onClick={() => setShowPin(!showPin)}
              className="p-1 hover:bg-white/10 rounded transition"
            >
              {showPin ? (
                <EyeOff className="w-4 h-4 text-blue-200" />
              ) : (
                <Eye className="w-4 h-4 text-blue-200" />
              )}
            </button>
          </div>

          {/* PIN Input Boxes - Smaller */}
          <div className="flex gap-1.5 justify-center mb-4">
            {pin.map((digit, index) => (
              <input
                key={index}
                ref={(el) => {
                  if (el) inputRefs.current[index] = el
                }}
                type={showPin ? 'text' : 'password'}
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                onPaste={handlePaste}
                className="w-10 h-10 text-center text-lg font-bold bg-white/20 border-2 border-white/40 text-white rounded focus:outline-none focus:ring-2 focus:ring-white transition-all"
                placeholder="•"
              />
            ))}
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-3 p-2 bg-red-500/20 border border-red-400/30 rounded flex gap-2">
              <AlertCircle className="w-3 h-3 text-red-300 flex-shrink-0 mt-0.5" />
              <p className="text-red-200 text-xs">{error}</p>
            </div>
          )}

          {/* Verify Button */}
          <button
            onClick={handleVerifyPin}
            disabled={isLoading || pin.some((d) => !d)}
            className="w-full bg-white text-[#0000ff] font-bold text-sm py-2 rounded hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {isLoading ? 'Creating PIN...' : 'CREATE PIN'}
          </button>
        </div>

        {/* Fingerprint Scanner Button */}
        <div className="flex gap-2 mb-2">
          <button
            onClick={handleFingerprintScan}
            disabled={isScanning}
            className="flex-1 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-semibold text-xs py-2 rounded transition-all flex items-center justify-center gap-1"
          >
            <Fingerprint className="w-4 h-4" />
            Fingerprint
          </button>
        </div>

        {/* Fingerprint Scanner Modal */}
        {showFingerprintScanner && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
            <div className="bg-white/20 backdrop-blur-md border border-white/30 rounded-2xl p-8 max-w-xs mx-4">
              {!fingerprintDetected ? (
                <div className="text-center">
                  <div className={`w-20 h-20 mx-auto mb-4 rounded-full border-4 border-white flex items-center justify-center ${isScanning ? 'animate-pulse bg-blue-500/30' : ''}`}>
                    <Fingerprint className="w-10 h-10 text-white" />
                  </div>
                  <h2 className="text-white font-bold mb-2">Scanning Fingerprint</h2>
                  <p className="text-blue-100 text-xs mb-4">Place your finger on the sensor...</p>
                  {isScanning && <div className="animate-spin w-6 h-6 border-2 border-white border-t-transparent rounded-full mx-auto" />}
                </div>
              ) : (
                <div className="text-center">
                  <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-green-500/30 border-4 border-green-400 flex items-center justify-center">
                    <Check className="w-10 h-10 text-green-400" />
                  </div>
                  <h2 className="text-white font-bold mb-2">Fingerprint Verified</h2>
                  <p className="text-blue-100 text-xs">Your fingerprint has been detected and verified</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Info Text */}
        <p className="text-center text-blue-100 text-xs">
          Secure your transactions with a strong PIN
        </p>
      </div>
    </div>
  )
}
