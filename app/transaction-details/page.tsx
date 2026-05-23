import React, { Suspense } from 'react'
import TransactionDetailsContent from './transaction-details-content'

function LoadingFallback() {
  return (
    <div className="min-h-screen bg-white pb-20">
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200 py-3 px-3">
        <div className="flex items-center justify-between">
          <div className="w-5" />
          <h1 className="text-lg font-bold text-gray-900">Transaction Details</h1>
          <div className="w-5" />
        </div>
      </header>
      <div className="flex items-center justify-center py-20">
        <p className="text-gray-600">Loading transaction details...</p>
      </div>
    </div>
  )
}

export default function TransactionDetailsPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <TransactionDetailsContent />
    </Suspense>
  )
}
