'use client'

import { useState, useEffect } from 'react'
import { AlertTriangle, X } from 'lucide-react'

interface WarningNotificationProps {
  isOpen: boolean
  onClose: () => void
  message?: string
  title?: string
}

export default function WarningNotification({
  isOpen,
  onClose,
  message = 'Important warning message',
  title = 'WARNING',
}: WarningNotificationProps) {
  const [isAnimating, setIsAnimating] = useState(false)

  useEffect(() => {
    if (isOpen) {
      // Trigger animation after component mounts
      const timer = setTimeout(() => setIsAnimating(true), 50)
      document.body.style.overflow = 'hidden'
      return () => clearTimeout(timer)
    } else {
      setIsAnimating(false)
      document.body.style.overflow = 'auto'
    }

    return () => {
      document.body.style.overflow = 'auto'
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/40 transition-opacity duration-300 z-40"
        onClick={onClose}
      />

      {/* Notification - Alert Box */}
      <div
        className={`fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 max-w-md w-full mx-3 z-50 transition-all duration-300 ${
          isAnimating
            ? 'scale-100 opacity-100'
            : 'scale-95 opacity-0'
        }`}
      >
        <div className="bg-gradient-to-b from-yellow-50 to-orange-50 border-2 border-yellow-300 rounded-2xl shadow-2xl overflow-hidden">
          <div className="p-6">
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-start gap-3 flex-1">
                <AlertTriangle className="w-7 h-7 text-yellow-600 flex-shrink-0 mt-0.5 animate-pulse" />
                <div>
                  <h3 className="text-lg font-bold text-yellow-900">{title}</h3>
                </div>
              </div>
              <button
                onClick={onClose}
                className="text-yellow-600 hover:text-yellow-900 transition-colors flex-shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Message */}
            <div className="bg-white/80 rounded-lg p-4 mb-4 border border-yellow-200">
              <p className="text-yellow-900 text-sm leading-relaxed font-medium">
                {message}
              </p>
            </div>

            {/* Action Button */}
            <button
              onClick={onClose}
              className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white font-bold py-3 rounded-lg transition-all shadow-lg active:scale-95"
            >
              I Understand
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
