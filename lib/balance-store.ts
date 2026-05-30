// Simple unified demo balance store using localStorage
import { MAX_BALANCE } from '@/lib/constants'

const BALANCE_KEY = 'bluepay_demo_balance'
const TRANSACTIONS_KEY = 'bluepay_transactions'
const EARNINGS_PAUSED_KEY = 'bluepay_earnings_paused'
const INITIAL_BALANCE = 250000

export interface Transaction {
  id: string
  type: 'withdrawal' | 'airtime' | 'data' | 'betting' | 'electricity' | 'tv' | 'reward'
  amount: number
  status: 'success' | 'pending' | 'failed'
  description: string
  timestamp: string
}

// Initialize balance if not exists
export function initializeBalance() {
  if (typeof window === 'undefined') return INITIAL_BALANCE
  const stored = localStorage.getItem(BALANCE_KEY)
  if (!stored) {
    localStorage.setItem(BALANCE_KEY, INITIAL_BALANCE.toString())
    return INITIAL_BALANCE
  }
  return parseFloat(stored)
}

// Get current balance
export function getBalance(): number {
  if (typeof window === 'undefined') return INITIAL_BALANCE
  const balance = localStorage.getItem(BALANCE_KEY)
  return balance ? parseFloat(balance) : INITIAL_BALANCE
}

// Update balance with MAX_BALANCE cap enforcement
export function setBalance(amount: number): number {
  if (typeof window === 'undefined') return INITIAL_BALANCE
  try {
    // Cap balance at MAX_BALANCE
    const cappedAmount = Math.min(Math.max(0, amount), MAX_BALANCE)
    const cappedByLimit = amount > MAX_BALANCE
    
    localStorage.setItem(BALANCE_KEY, cappedAmount.toString())
    
    // Update earnings_paused status
    if (cappedByLimit) {
      localStorage.setItem(EARNINGS_PAUSED_KEY, 'true')
    } else if (cappedAmount < MAX_BALANCE) {
      localStorage.setItem(EARNINGS_PAUSED_KEY, 'false')
    }
    
    // Trigger storage event for cross-tab updates
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('balanceChange'))
    }
    return cappedAmount
  } catch (err) {
    console.error('[v0] Error setting balance:', err)
    return amount
  }
}

// Deduct amount from balance
export function deductBalance(amount: number): number {
  const currentBalance = getBalance()
  const newBalance = currentBalance - amount
  return setBalance(newBalance)
}

// Add amount to balance (for rewards) with MAX_BALANCE cap
export function addBalance(amount: number): { newBalance: number; cappedByLimit: boolean } {
  const currentBalance = getBalance()
  const calculatedBalance = currentBalance + amount
  const cappedByLimit = calculatedBalance > MAX_BALANCE
  const newBalance = setBalance(calculatedBalance)
  return { newBalance, cappedByLimit }
}

// Get earnings paused status
export function isEarningsPaused(): boolean {
  if (typeof window === 'undefined') return false
  const status = localStorage.getItem(EARNINGS_PAUSED_KEY)
  return status === 'true'
}

// Set earnings paused status
export function setEarningsPaused(paused: boolean): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(EARNINGS_PAUSED_KEY, paused ? 'true' : 'false')
}

// Add transaction
export function addTransaction(transaction: Omit<Transaction, 'id' | 'timestamp'>): Transaction {
  if (typeof window === 'undefined') {
    return {
      ...transaction,
      id: '',
      timestamp: '',
    }
  }

  try {
    const stored = localStorage.getItem(TRANSACTIONS_KEY)
    const transactions: Transaction[] = stored ? JSON.parse(stored) : []

    const newTransaction: Transaction = {
      ...transaction,
      id: `tx_${Date.now()}`,
      timestamp: new Date().toISOString(),
    }

    transactions.unshift(newTransaction)
    // Keep only last 50 transactions
    if (transactions.length > 50) {
      transactions.pop()
    }

    localStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(transactions))
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('transactionsChange'))
    }

    return newTransaction
  } catch (err) {
    console.error('[v0] Error adding transaction:', err)
    return {
      ...transaction,
      id: `tx_${Date.now()}`,
      timestamp: new Date().toISOString(),
    }
  }
}

// Get all transactions
export function getTransactions(): Transaction[] {
  if (typeof window === 'undefined') return []
  const stored = localStorage.getItem(TRANSACTIONS_KEY)
  return stored ? JSON.parse(stored) : []
}

// Clear all data (for testing)
export function clearAll() {
  if (typeof window === 'undefined') return
  localStorage.removeItem(BALANCE_KEY)
  localStorage.removeItem(TRANSACTIONS_KEY)
}
