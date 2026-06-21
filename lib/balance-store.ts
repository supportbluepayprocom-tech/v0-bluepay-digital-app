// Simple unified demo balance store using localStorage
import { MAX_BALANCE } from '@/lib/constants'

const BALANCE_KEY = 'bluepay_demo_balance'
const TRANSACTIONS_KEY = 'bluepay_transactions'
const EARNINGS_PAUSED_KEY = 'bluepay_earnings_paused'
const COMPLETED_TASKS_KEY = 'bluepay_completed_tasks'
const CURRENT_TASK_ID_KEY = 'bluepay_current_task_id'
const TASK_ROTATION_DATE_KEY = 'bluepay_task_rotation_date'
const INITIAL_BALANCE = 250000

export interface Transaction {
  id: string
  type: 'withdrawal' | 'airtime' | 'data' | 'betting' | 'electricity' | 'tv' | 'reward' | 'daily_task' | 'referral' | 'bonus' | 'promotional'
  amount: number
  status: 'success' | 'pending' | 'failed'
  description: string
  timestamp: string
}

// Financial transaction types only
const FINANCIAL_TRANSACTION_TYPES = ['withdrawal', 'airtime', 'data', 'betting', 'electricity', 'tv']

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

// Get all transactions (including earn rewards)
export function getTransactions(): Transaction[] {
  if (typeof window === 'undefined') return []
  const stored = localStorage.getItem(TRANSACTIONS_KEY)
  return stored ? JSON.parse(stored) : []
}

// Get only financial transactions (filter out earn rewards)
export function getFinancialTransactions(): Transaction[] {
  if (typeof window === 'undefined') return []
  const allTransactions = getTransactions()
  return allTransactions.filter(tx => FINANCIAL_TRANSACTION_TYPES.includes(tx.type))
}

// Clear all data (for testing)
export function clearAll() {
  if (typeof window === 'undefined') return
  localStorage.removeItem(BALANCE_KEY)
  localStorage.removeItem(TRANSACTIONS_KEY)
}

// ============================================
// Task Rotation System Functions
// ============================================

interface CompletedTask {
  id: number
  completedAt: number // timestamp
}

// Mark a task as completed with timestamp (per-task 24-hour rotation)
export function completeTask(taskId: number): void {
  if (typeof window === 'undefined') return
  
  try {
    const stored = localStorage.getItem(COMPLETED_TASKS_KEY)
    const completed: CompletedTask[] = stored ? JSON.parse(stored) : []
    
    // Check if already completed today (within 24 hours)
    const existingTask = completed.find(t => t.id === taskId)
    if (existingTask) {
      const hoursPassed = (Date.now() - existingTask.completedAt) / (1000 * 60 * 60)
      if (hoursPassed < 24) {
        return // Task still locked for less than 24 hours
      } else {
        // 24 hours have passed, remove old entry to allow repeat
        const index = completed.indexOf(existingTask)
        completed.splice(index, 1)
      }
    }
    
    completed.push({ id: taskId, completedAt: Date.now() })
    localStorage.setItem(COMPLETED_TASKS_KEY, JSON.stringify(completed))
  } catch (err) {
    console.error('[v0] Error completing task:', err)
  }
}

// Check if a task is completed and locked (within 24 hours)
export function isTaskCompleted(taskId: number): boolean {
  if (typeof window === 'undefined') return false
  
  try {
    const stored = localStorage.getItem(COMPLETED_TASKS_KEY)
    const completed: CompletedTask[] = stored ? JSON.parse(stored) : []
    
    const task = completed.find(t => t.id === taskId)
    if (!task) return false
    
    // Check if 24 hours have passed
    const hoursPassed = (Date.now() - task.completedAt) / (1000 * 60 * 60)
    return hoursPassed < 24 // Task is completed if less than 24 hours have passed
  } catch (err) {
    console.error('[v0] Error checking task:', err)
    return false
  }
}

// Get time remaining for a specific task (in minutes)
export function getTaskTimeRemaining(taskId: number): number {
  if (typeof window === 'undefined') return 0
  
  try {
    const stored = localStorage.getItem(COMPLETED_TASKS_KEY)
    const completed: CompletedTask[] = stored ? JSON.parse(stored) : []
    
    const task = completed.find(t => t.id === taskId)
    if (!task) return 0
    
    const hoursPassed = (Date.now() - task.completedAt) / (1000 * 60 * 60)
    if (hoursPassed >= 24) return 0 // Can do task again
    
    const minutesRemaining = Math.ceil((24 - hoursPassed) * 60)
    return Math.max(0, minutesRemaining)
  } catch (err) {
    console.error('[v0] Error getting time remaining:', err)
    return 0
  }
}

// Check if 24 hours have passed since any task was completed
export function canRotateTask(): boolean {
  if (typeof window === 'undefined') return false
  
  try {
    const stored = localStorage.getItem(COMPLETED_TASKS_KEY)
    if (!stored) return false
    
    const completed: CompletedTask[] = JSON.parse(stored)
    if (completed.length === 0) return false
    
    // Check if ANY task can be repeated (24 hours passed)
    return completed.some(t => {
      const hoursPassed = (Date.now() - t.completedAt) / (1000 * 60 * 60)
      return hoursPassed >= 24
    })
  } catch (err) {
    console.error('[v0] Error checking rotation:', err)
    return false
  }
}

// Get completed tasks
export function getCompletedTasks(): CompletedTask[] {
  if (typeof window === 'undefined') return []
  
  try {
    const stored = localStorage.getItem(COMPLETED_TASKS_KEY)
    return stored ? JSON.parse(stored) : []
  } catch (err) {
    console.error('[v0] Error getting completed tasks:', err)
    return []
  }
}

// Clear task completion history (for new task rotation)
export function clearTaskHistory(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(COMPLETED_TASKS_KEY)
  localStorage.removeItem(CURRENT_TASK_ID_KEY)
  localStorage.removeItem(TASK_ROTATION_DATE_KEY)
}
