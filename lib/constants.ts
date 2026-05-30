// Balance and wallet constants
export const MAX_BALANCE = 1000000 // NGN 1,000,000.00
export const REGISTRATION_BONUS = 250000 // NGN 250,000.00

// Status messages
export const MAX_BALANCE_REACHED_TITLE = 'Maximum Balance Reached'
export const MAX_BALANCE_REACHED_MESSAGE = 
  'You have reached the maximum wallet balance of NGN 1,000,000.00. ' +
  'To continue earning rewards and completing daily tasks, please perform transactions within BLUEPAY PRO V30 to reduce your balance. ' +
  'Once your balance falls below NGN 1,000,000.00, earnings and task rewards will automatically resume.'

export const EARNINGS_PAUSED_MESSAGE = 'Earnings Paused'
export const EARNINGS_PAUSED_DESCRIPTION = 'Your account has reached the maximum balance. Complete a transaction to resume earning.'

// Formatting
export const formatNGN = (amount: number): string => {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

export const formatNGNSimple = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}
