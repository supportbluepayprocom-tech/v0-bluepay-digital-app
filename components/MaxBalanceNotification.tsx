'use client'

import { useState, useEffect } from 'react'
import { AlertCircle, X } from 'lucide-react'
import { MAX_BALANCE_REACHED_TITLE, MAX_BALANCE_REACHED_MESSAGE, formatNGN } from '@/lib/constants'

interface MaxBalanceNotificationProps {
  isOpen: boolean
  onClose: () => void
  balance?: number
}

export default function MaxBalanceNotification({
  isOpen,
  onClose,
  balance = 1000000
}: MaxBalanceNotificationProps) {
  const [showNotification, setShowNotification] = useState(isOpen)

  useEffect(() => {
    setShowNotification(isOpen)
  }, [isOpen])

  if (!showNotification) {
    return null
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full animate-in fade-in zoom-in-95 duration-300">
        {/* Header with close button */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 rounded-full">
              <AlertCircle className="w-6 h-6 text-amber-600" />
            </div>
            <h2 className="text-lg font-bold text-gray-900">{MAX_BALANCE_REACHED_TITLE}</h2>
          </div>
          <button
            onClick={() => {
              setShowNotification(false)
              onClose()
            }}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Balance Display */}
          <div className="mb-4 p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg border border-blue-200">
            <p className="text-sm text-blue-600 font-medium mb-1">Current Balance</p>
            <p className="text-2xl font-bold text-blue-900">{formatNGN(balance)}</p>
          </div>

          {/* Message */}
          <p className="text-sm text-gray-700 leading-relaxed mb-6">
            {MAX_BALANCE_REACHED_MESSAGE}
          </p>

          {/* Action Items */}
          <div className="space-y-3 mb-6">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center mt-0.5">
                <span className="text-xs font-bold text-blue-600">1</span>
              </div>
              <p className="text-sm text-gray-700">Perform transactions to reduce your balance</p>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center mt-0.5">
                <span className="text-xs font-bold text-blue-600">2</span>
              </div>
              <p className="text-sm text-gray-700">Once below NGN 1,000,000.00, earnings will automatically resume</p>
            </div>
          </div>

          {/* Footer Info */}
          <div className="p-3 bg-gray-50 rounded-lg mb-6">
            <p className="text-xs text-gray-600 text-center">
              Daily tasks and earnings are currently paused. They will resume automatically when your balance decreases.
            </p>
          </div>
        </div>

        {/* Close Button */}
        <div className="flex gap-3 p-6 border-t border-gray-200">
          <button
            onClick={() => {
              setShowNotification(false)
              onClose()
            }}
            className="flex-1 px-4 py-2.5 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
          >
            Understood
          </button>
        </div>
      </div>
    </div>
  )
}
