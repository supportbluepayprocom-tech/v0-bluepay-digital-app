'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Upload, Lock, AlertCircle, Check } from 'lucide-react'

export default function VerifyPinPage() {
  const router = useRouter()
  const [pin, setPin] = useState(['', '', '', '', '', ''])
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [fullName, setFullName] = useState('')
  const [profileImage, setProfileImage] = useState('')
  const [isUploadingImage, setIsUploadingImage] = useState(false)
  const [uploadedSuccessfully, setUploadedSuccessfully] = useState(false)
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
        setTimeout(() => setUploadedSuccessfully(false), 3000)
      }
      reader.readAsDataURL(file)
    } catch (err) {
      console.error('Error uploading image:', err)
    } finally {
      setIsUploadingImage(false)
    }
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
    <div className="min-h-screen bg-gradient-to-br from-[#0000ff] to-blue-900 flex flex-col items-center justify-center px-4 py-8">
      <div className="w-full max-w-sm">
        {/* Welcome Section with Lock Icon */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-white/20 backdrop-blur-md rounded-full">
              <Lock className="w-6 h-6 text-white" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Secure Your Account</h1>
          <p className="text-blue-100 text-sm leading-relaxed">
            Dear <span className="font-semibold">{fullName}</span>, we kindly ask you to create a strong 6-digit PIN to secure your BLUEPAY account from unauthorized access.
          </p>
        </div>

        {/* Profile Picture Upload Section */}
        <div className="mb-6 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-5">
          <p className="text-white text-xs font-semibold mb-3 flex items-center gap-2">
            <Upload className="w-4 h-4" />
            Upload Profile Picture (Optional)
          </p>
          <label className="flex flex-col items-center justify-center w-full h-28 border-2 border-dashed border-white/40 rounded-xl cursor-pointer hover:bg-white/5 transition-all group">
            {profileImage ? (
              <div className="w-full h-full flex items-center justify-center relative overflow-hidden rounded-lg">
                <img src={profileImage} alt="Profile" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/40 group-hover:bg-black/50 flex items-center justify-center transition opacity-0 group-hover:opacity-100">
                  <Upload className="w-5 h-5 text-white" />
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-4">
                <Upload className="w-6 h-6 text-white/60 mb-1" />
                <p className="text-xs text-white/60">Click to upload photo</p>
              </div>
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
          {uploadedSuccessfully && (
            <p className="text-xs text-green-300 mt-2 flex items-center gap-1">
              <Check className="w-4 h-4" />
              Picture uploaded successfully
            </p>
          )}
        </div>

        {/* PIN Security Card */}
        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6 mb-4">
          {/* PIN Input Label */}
          <p className="text-white text-xs font-semibold mb-4 flex items-center gap-2">
            <Lock className="w-4 h-4" />
            Create 6-Digit PIN
          </p>

          {/* PIN Input Boxes - Fintech Style */}
          <div className="flex gap-2 justify-center mb-6">
            {pin.map((digit, index) => (
              <input
                key={index}
                ref={(el) => {
                  if (el) inputRefs.current[index] = el
                }}
                type="password"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                onPaste={handlePaste}
                className="w-12 h-14 text-center text-2xl font-bold bg-white/20 border-2 border-white/40 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-white focus:border-white/60 transition-all backdrop-blur-sm placeholder-white/20"
                placeholder="•"
              />
            ))}
          </div>

          {/* Security Tips */}
          <div className="bg-blue-500/20 border border-blue-400/30 rounded-lg p-3 mb-4">
            <p className="text-blue-100 text-xs">
              <strong>PIN Security Tips:</strong> Use a mix of numbers you can remember. Never share your PIN with anyone.
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-500/20 border border-red-400/30 rounded-lg flex gap-2">
              <AlertCircle className="w-4 h-4 text-red-300 flex-shrink-0 mt-0.5" />
              <p className="text-red-200 text-xs">{error}</p>
            </div>
          )}

          {/* Verify Button */}
          <button
            onClick={handleVerifyPin}
            disabled={isLoading || pin.some((d) => !d)}
            className="w-full bg-white text-[#0000ff] font-bold text-base py-3 rounded-lg hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg"
          >
            {isLoading ? 'Creating PIN...' : 'CREATE PIN & CONTINUE'}
          </button>
        </div>

        {/* Info Text */}
        <p className="text-center text-blue-100 text-xs">
          This PIN will be used to secure future transactions on your BLUEPAY account.
        </p>
      </div>
    </div>
  )
}
