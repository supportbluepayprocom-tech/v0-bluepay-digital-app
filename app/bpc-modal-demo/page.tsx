'use client'

import { useState } from 'react'
import BPCNotificationModal from '@/components/BPCNotificationModal'

export default function BPCModalDemoPage() {
  const [isOpen, setIsOpen] = useState(true)

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl p-8 shadow-lg text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            BPC Notification Modal
          </h1>
          <p className="text-gray-600 mb-6">
            Click the button below to see the premium fintech modal
          </p>

          <button
            onClick={() => setIsOpen(true)}
            className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold py-3 px-6 rounded-full transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            Open BPC Modal
          </button>

          <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h3 className="font-semibold text-blue-900 mb-2">Features:</h3>
            <ul className="text-sm text-blue-800 space-y-1 text-left">
              <li>✓ White clean premium card design</li>
              <li>✓ Blue fintech themed</li>
              <li>✓ Notification bell icon with animation</li>
              <li>✓ Dynamic greeting based on time</li>
              <li>✓ User name display from account</li>
              <li>✓ BPC code price highlight</li>
              <li>✓ Security messaging</li>
              <li>✓ Smooth animations</li>
              <li>✓ Mobile responsive design</li>
              <li>✓ Close functionality</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Modal */}
      <BPCNotificationModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        userName="Chioma Johnson"
      />
    </div>
  )
}
