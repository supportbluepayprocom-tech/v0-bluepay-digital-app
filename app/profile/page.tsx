'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Camera, Mail, Phone, MapPin, TrendingUp, Users } from 'lucide-react'
import { getCurrentUser, logoutUser } from '@/lib/auth-local'

export default function ProfilePage() {
  const router = useRouter()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [profileImage, setProfileImage] = useState('')
  const [isEditing, setIsEditing] = useState(false)
  const [isUploading, setIsUploading] = useState(false)

  useEffect(() => {
    const loadUserData = () => {
      try {
        const user = getCurrentUser()
        if (user) {
          setEmail(user.email)
          setFullName(user.fullName)
          const profileImage = localStorage.getItem('userProfileImage')
          if (profileImage) {
            setProfileImage(profileImage)
          }
        } else {
          // No user session, redirect to signin
          router.push('/signin')
        }
      } catch (err) {
        console.error('[v0] Error loading profile:', err)
      }
    }
    loadUserData()
  }, [])

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    try {
      const reader = new FileReader()
      reader.onload = (event) => {
        const imageData = event.target?.result as string
        setProfileImage(imageData)
        localStorage.setItem('userProfileImage', imageData)
      }
      reader.readAsDataURL(file)
    } catch (err) {
      console.error('[v0] Error uploading image:', err)
    } finally {
      setIsUploading(false)
    }
  }

  const handleLogout = () => {
    try {
      // Clear session from localStorage
      logoutUser()
      
      // Clear other user-related data but keep auth data structure
      localStorage.removeItem('userProfileImage')
      
      console.log('[v0] User logged out successfully')
      
      // Redirect to signup/create account page
      router.push('/signup')
    } catch (err) {
      console.error('[v0] Error logging out:', err)
      // Force redirect even if logout fails
      logoutUser()
      router.push('/signup')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200 py-2 px-3">
        <div className="flex items-center justify-between">
          <button onClick={() => router.back()} className="p-1">
            <ArrowLeft className="w-5 h-5 text-gray-900" />
          </button>
          <h1 className="text-lg font-bold text-gray-900">My Profile</h1>
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="text-xs font-bold text-[#0000ff] px-2 py-1"
          >
            {isEditing ? 'Done' : 'Edit'}
          </button>
        </div>
      </header>

      <main className="px-3 py-3 max-w-2xl mx-auto">
        {/* Profile Picture Section */}
        <div className="flex flex-col items-center mb-6">
          <div className="relative w-24 h-24 mb-3">
            <div className="w-24 h-24 rounded-full bg-[#0000ff] flex items-center justify-center text-white text-3xl font-bold overflow-hidden">
              {profileImage ? (
                <img src={profileImage} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                fullName.charAt(0).toUpperCase()
              )}
            </div>
            {isEditing && (
              <label className="absolute bottom-0 right-0 bg-[#0000ff] rounded-full p-1.5 cursor-pointer hover:opacity-90">
                <Camera className="w-4 h-4 text-white" />
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  disabled={isUploading}
                  className="hidden"
                />
              </label>
            )}
          </div>
          <h2 className="text-lg font-bold text-gray-900">{fullName}</h2>
          <p className="text-xs text-gray-600">{email}</p>
        </div>

        {/* Account Details */}
        <div className="bg-white rounded-lg p-3 border border-gray-200 mb-3">
          <h3 className="font-bold text-gray-900 text-sm mb-3">Account Details</h3>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Mail className="w-4 h-4 text-[#0000ff]" />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-600">Email</p>
                <p className="font-semibold text-gray-900 text-sm break-all">{email}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Phone className="w-4 h-4 text-[#0000ff]" />
              <div className="flex-1">
                <p className="text-xs text-gray-600">Phone</p>
                <p className="font-semibold text-gray-900 text-sm">+234 (Update in settings)</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <MapPin className="w-4 h-4 text-[#0000ff]" />
              <div className="flex-1">
                <p className="text-xs text-gray-600">Location</p>
                <p className="font-semibold text-gray-900 text-sm">Nigeria</p>
              </div>
            </div>
          </div>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-2 gap-2 mb-3">
          <div className="bg-white rounded-lg p-3 border border-gray-200">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-[#0000ff]" />
              <p className="text-xs text-gray-600 font-semibold">Total Transactions</p>
            </div>
            <p className="text-lg font-bold text-gray-900">42</p>
          </div>
          <div className="bg-white rounded-lg p-3 border border-gray-200">
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-4 h-4 text-[#0000ff]" />
              <p className="text-xs text-gray-600 font-semibold">Referrals</p>
            </div>
            <p className="text-lg font-bold text-gray-900">8</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2">
          <button className="w-full bg-white border border-gray-200 text-gray-900 font-bold py-2.5 rounded-lg hover:bg-gray-50 transition text-sm">
            Security Settings
          </button>
          <button className="w-full bg-white border border-gray-200 text-gray-900 font-bold py-2.5 rounded-lg hover:bg-gray-50 transition text-sm">
            Notification Preferences
          </button>
          <button
            onClick={handleLogout}
            className="w-full bg-red-50 border border-red-200 text-red-600 font-bold py-2.5 rounded-lg hover:bg-red-100 transition text-sm"
          >
            LOG OUT
          </button>
        </div>
      </main>
    </div>
  )
}
