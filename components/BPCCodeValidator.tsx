'use client'

import { useState, useRef } from 'react'
import { Copy, Check, AlertCircle } from 'lucide-react'
import { validateBPCCode } from '@/lib/bpc-validator'

interface BPCCodeValidatorProps {
  onValidate: (code: string, isValid: boolean) => void
  isSubmitting?: boolean
  disabled?: boolean
}

export default function BPCCodeValidator({
  onValidate,
  isSubmitting = false,
  disabled = false,
}: BPCCodeValidatorProps) {
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [isValid, setIsValid] = useState(false)
  const [copied, setCopied] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleCodeChange = (value: string) => {
    const trimmed = value.trim().toUpperCase()
    setCode(trimmed)
    setError('')
    
    // Auto-validate as user types
    if (trimmed.length > 0) {
      const valid = validateBPCCode(trimmed)
      setIsValid(valid)
      if (!valid && trimmed.length > 5) {
        setError('Invalid BPC Code. Please obtain a valid Bank Processing Code (BPC) from the BLUEPAY PRO V30 ecosystem.')
      }
      onValidate(trimmed, valid)
    } else {
      setIsValid(false)
      onValidate('', false)
    }
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const pastedCode = e.clipboardData.getData('text').trim().toUpperCase()
    handleCodeChange(pastedCode)
  }

  const handleValidate = () => {
    if (!code.trim()) {
      setError('BPC Code is required')
      onValidate('', false)
      return
    }

    const valid = validateBPCCode(code)
    setIsValid(valid)
    
    if (valid) {
      setError('')
      onValidate(code, true)
    } else {
      setError('Invalid BPC Code. Please obtain a valid Bank Processing Code (BPC) from the BLUEPAY PRO V30 ecosystem.')
      onValidate(code, false)
    }
  }

  return (
    <div className="w-full">
      <div className="mb-3">
        <label className="text-xs font-semibold text-gray-700 mb-2 block">
          Bank Processing Code (BPC Code)
        </label>
        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={code}
            onChange={(e) => handleCodeChange(e.target.value)}
            onPaste={handlePaste}
            disabled={disabled || isSubmitting}
            placeholder="Enter BPC Code (e.g., BPC_1234567890_ABC123)"
            className={`flex-1 px-3 py-2.5 rounded-lg border-2 transition-all text-sm font-mono ${
              isValid
                ? 'border-green-500 bg-green-50 text-green-900'
                : error
                  ? 'border-red-500 bg-red-50 text-red-900'
                  : 'border-gray-300 bg-white text-gray-900'
            } disabled:bg-gray-100 disabled:cursor-not-allowed`}
          />
          <button
            onClick={handleValidate}
            disabled={disabled || isSubmitting || !code.trim()}
            className="px-3 py-2.5 bg-[#0000ff] text-white rounded-lg font-semibold text-sm hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            Validate
          </button>
        </div>
      </div>

      {/* Status Message */}
      {isValid && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-lg flex gap-2 items-start mb-3">
          <Check className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-semibold text-green-900">BPC Code Valid</p>
            <p className="text-xs text-green-700 mt-0.5">Your BPC code has been verified. You can proceed with the transaction.</p>
          </div>
        </div>
      )}

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex gap-2 items-start mb-3">
          <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-semibold text-red-900">Validation Failed</p>
            <p className="text-xs text-red-700 mt-0.5">{error}</p>
          </div>
        </div>
      )}

      {/* Help Text */}
      <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-xs text-blue-900">
          <strong>Important:</strong> Your BPC Code must be generated within the BLUEPAY PRO V30 ecosystem. Any BPC Code obtained outside this ecosystem will be considered invalid.
        </p>
      </div>
    </div>
  )
}
