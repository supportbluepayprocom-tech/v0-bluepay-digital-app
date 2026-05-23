'use client'

import React, { useEffect, useState } from 'react'
import { Bell, X } from 'lucide-react'

interface BPCNotificationModalProps {
  isOpen: boolean
  onClose: () => void
  userName?: string
}

export default function BPCNotificationModal({
  isOpen,
  onClose,
  userName = 'User',
}: BPCNotificationModalProps) {
  const [greeting, setGreeting] = useState('')
  const [isAnimating, setIsAnimating] = useState(false)

  useEffect(() => {
    const hour = new Date().getHours()
    if (hour < 12) {
      setGreeting('Good Morning')
    } else if (hour < 18) {
      setGreeting('Good Afternoon')
    } else {
      setGreeting('Good Evening')
    }
  }, [])

  useEffect(() => {
    if (isOpen) {
      setIsAnimating(true)
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'auto'
    }

    return () => {
      document.body.style.overflow = 'auto'
    }
  }, [isOpen])

  const handleClose = () => {
    setIsAnimating(false)
    setTimeout(() => {
      onClose()
    }, 300)
  }

  if (!isOpen) return null

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-3 transition-opacity duration-300 ${
        isAnimating ? 'opacity-100' : 'opacity-0'
      }`}
      style={{
        backgroundColor: isAnimating ? 'rgba(0, 0, 0, 0.5)' : 'rgba(0, 0, 0, 0)',
      }}
      onClick={handleClose}
    >
      <div
        className={`w-full max-w-sm bg-white rounded-2xl shadow-2xl transform transition-all duration-300 max-h-[90vh] overflow-y-auto ${
          isAnimating ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-3 right-3 p-1.5 hover:bg-gray-100 rounded-full transition-colors z-10"
        >
          <X className="w-4 h-4 text-gray-500" />
        </button>

        {/* Content */}
        <div className="p-5 pt-8">
          {/* Bell Icon */}
          <div className="flex justify-center mb-3">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-50 to-blue-100 rounded-full flex items-center justify-center animate-bounce">
              <Bell className="w-6 h-6 text-blue-600" />
            </div>
          </div>

          {/* Greeting */}
          <h2 className="text-lg font-bold text-gray-900 text-center mb-1">
            {greeting}, <span className="text-blue-600">{userName}</span>
          </h2>

          {/* Divider */}
          <div className="h-0.5 w-8 bg-gradient-to-r from-blue-400 to-blue-600 mx-auto mb-4 rounded-full" />

          {/* Main Message */}
          <p className="text-gray-700 text-xs leading-relaxed mb-4 text-center">
            To keep your transactions safe and successful, always purchase your Bank Processing Code (BPC CODE) directly from <span className="font-semibold text-gray-900">BLUEPAY PRO V30 Ecosystem</span>.
          </p>

          {/* Price Section */}
          <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl p-3 mb-4 border border-blue-200">
            <p className="text-gray-700 text-xs mb-2 font-medium">
              The official price of each personal BPC CODE is:
            </p>
            <p className="text-2xl font-bold text-blue-600 text-center">
              NGN<span className="text-3xl">10,650</span>.00
            </p>
            <p className="text-gray-600 text-xs text-center mt-1 italic">
              Official BLUEPAY PRO V30 Rate
            </p>
          </div>

          {/* Warning Section */}
          <div className="bg-red-50 rounded-xl p-3 mb-4 border border-red-200">
            <p className="text-red-700 font-bold text-center text-base">
              Incorrect BPC CODE
            </p>
            <p className="text-red-600 text-xs text-center mt-1">
              Any BPC CODE gotten outside the BLUEPAY PRO V30 platform will be declined automatically.
            </p>
          </div>

          {/* Guidance Section */}
          <div className="bg-gray-50 rounded-xl p-3 mb-4 border border-gray-200">
            <p className="text-gray-800 text-xs leading-relaxed">
              <span className="font-semibold block mb-1">Dear User,</span>
              Kindly head to <span className="font-bold text-blue-600">BUY BPC</span> and follow the guidance carefully. Your personal BPC CODE will be sent via your registered email address and the name used while creating your <span className="font-semibold">BLUEPAY PRO V30</span> account.
            </p>
          </div>

          {/* Security Note */}
          <div className="bg-blue-50 rounded-xl p-3 mb-5 border border-blue-200">
            <p className="text-blue-900 text-xs leading-relaxed">
              <span className="font-bold block mb-0.5 text-blue-700">🔒 Security Note</span>
              <span className="block">For your security, always buy your BPC CODE only from <span className="font-bold">BLUEPAY PRO V30 Ecosystem</span>.</span>
              <span className="block mt-1 text-blue-800">
                <span className="font-semibold">Stay safe. Stay secure.</span>
              </span>
            </p>
          </div>

          {/* OK Button */}
          <button
            onClick={handleClose}
            className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold py-2.5 px-4 rounded-full transition-all duration-200 shadow-lg hover:shadow-xl active:scale-95 text-sm"
          >
            I Understand, Let&apos;s Continue
          </button>

          {/* Footer Text */}
          <p className="text-center text-gray-500 text-xs mt-4">
            Keep this information secure.
          </p>
        </div>
      </div>
    </div>
  )
}
