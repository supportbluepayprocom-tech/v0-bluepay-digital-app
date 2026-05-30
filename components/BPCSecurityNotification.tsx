'use client'

import { useState, useEffect } from 'react'
import { AlertTriangle, CheckCircle, X } from 'lucide-react'

interface BPCSecurityNotificationProps {
  isOpen: boolean
  onClose: () => void
}

export default function BPCSecurityNotification({
  isOpen,
  onClose,
}: BPCSecurityNotificationProps) {
  const [isAnimating, setIsAnimating] = useState(false)

  useEffect(() => {
    if (isOpen) {
      // Trigger animation after component mounts
      const timer = setTimeout(() => setIsAnimating(true), 50)
      return () => clearTimeout(timer)
    } else {
      setIsAnimating(false)
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/30 transition-opacity duration-300 z-40"
        onClick={onClose}
      />

      {/* Notification - Drops from top */}
      <div
        className={`fixed top-0 left-0 right-0 mx-auto max-w-2xl z-50 transition-all duration-500 ease-out ${
          isAnimating
            ? 'translate-y-0 opacity-100'
            : '-translate-y-full opacity-0'
        }`}
        style={{
          left: '50%',
          transform: isAnimating
            ? 'translateX(-50%) translateY(0)'
            : 'translateX(-50%) translateY(-100%)',
        }}
      >
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 border-b-4 border-blue-800 shadow-2xl">
          <div className="p-6">
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-6 h-6 text-yellow-300 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-lg font-bold text-white">Important Security Notice</h3>
                  <p className="text-blue-100 text-xs mt-1">Bank Processing Code (BPC) Verification</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="text-white/60 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Message */}
            <div className="bg-white/10 rounded-lg p-4 mb-4 backdrop-blur-sm">
              <p className="text-white text-sm leading-relaxed">
                Always obtain your <strong>Bank Processing Code (BPC Code)</strong> directly from BLUEPAY PRO V30 ecosystem services.
              </p>
              <p className="text-white text-sm leading-relaxed mt-3">
                Any BPC Code obtained outside the BLUEPAY PRO V30 ecosystem will be treated as an <strong>Invalid BPC Code</strong> and transactions may be rejected.
              </p>
              <p className="text-yellow-100 text-sm leading-relaxed mt-3">
                Protect your account by using only official BLUEPAY PRO V30 generated BPC Codes.
              </p>
            </div>

            {/* Security Tips */}
            <div className="space-y-2 mb-4">
              <div className="flex items-center gap-2 text-white text-sm">
                <CheckCircle className="w-4 h-4 text-green-300 flex-shrink-0" />
                <span>✓ Use only BLUEPAY PRO V30 generated codes</span>
              </div>
              <div className="flex items-center gap-2 text-white text-sm">
                <CheckCircle className="w-4 h-4 text-green-300 flex-shrink-0" />
                <span>✓ Verify code authenticity before transactions</span>
              </div>
              <div className="flex items-center gap-2 text-white text-sm">
                <CheckCircle className="w-4 h-4 text-green-300 flex-shrink-0" />
                <span>✓ Report suspicious codes immediately</span>
              </div>
            </div>

            {/* OK Button */}
            <button
              onClick={onClose}
              className="w-full bg-white text-blue-700 font-bold py-3 rounded-lg hover:bg-blue-50 transition-all shadow-lg"
            >
              OK, I Understand
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
