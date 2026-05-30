import { createClient } from '@supabase/supabase-js'
import { MAX_BALANCE, REGISTRATION_BONUS } from '@/lib/constants'

// Get Supabase client instance
const getSupabaseClient = () => {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

// Check if adding reward would exceed max balance and update earnings_paused status
export const checkAndUpdateEarningsStatus = async (userId: string, currentBalance: number): Promise<void> => {
  try {
    const supabase = getSupabaseClient()
    const isAtMaxBalance = currentBalance >= MAX_BALANCE
    
    // Update earnings_paused status
    await supabase
      .from('wallets')
      .update({ earnings_paused: isAtMaxBalance })
      .eq('user_id', userId)
  } catch (err) {
    console.error('[v0] Error updating earnings status:', err)
  }
}

// Validate if a reward can be added without exceeding max balance
export const canAddReward = (currentBalance: number, rewardAmount: number): boolean => {
  return currentBalance + rewardAmount <= MAX_BALANCE
}

// Get the capped balance (never exceeds MAX_BALANCE)
export const getCappedBalance = (balance: number): number => {
  return Math.min(balance, MAX_BALANCE)
}

// Auto-create wallet for new users on login/signup
export const ensureWalletExists = async (userId: string): Promise<boolean> => {
  try {
    const supabase = getSupabaseClient()
    // Check if wallet already exists
    const { data: existingWallet, error: checkError } = await supabase
      .from('wallets')
      .select('id')
      .eq('user_id', userId)
      .single()

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('[v0] Error checking wallet:', checkError)
      return false
    }

    // If wallet exists, return success
    if (existingWallet) {
      return true
    }

    // Create new wallet with default balance
    const { error: createError } = await supabase
      .from('wallets')
      .insert({
        user_id: userId,
        balance: 250000, // Default NGN 250,000
      })

    if (createError) {
      console.error('[v0] Error creating wallet:', createError)
      return false
    }

    console.log('[v0] Wallet created successfully for user:', userId)
    return true
  } catch (err) {
    console.error('[v0] Error in ensureWalletExists:', err)
    return false
  }
}

// Get user wallet balance
export const getWalletBalance = async (userId: string): Promise<number | null> => {
  try {
    const supabase = getSupabaseClient()
    const { data, error } = await supabase
      .from('wallets')
      .select('balance')
      .eq('user_id', userId)
      .single()

    if (error) {
      console.error('[v0] Error fetching wallet:', error)
      return null
    }

    return data?.balance || 0
  } catch (err) {
    console.error('[v0] Error in getWalletBalance:', err)
    return null
  }
}

// Deduct balance from wallet
export const deductWalletBalance = async (userId: string, amount: number): Promise<number | null> => {
  try {
    // Get current balance
    const currentBalance = await getWalletBalance(userId)
    if (currentBalance === null) {
      console.error('[v0] Failed to get current balance')
      return null
    }

    // Check if sufficient balance
    if (currentBalance < amount) {
      console.error('[v0] Insufficient balance:', { current: currentBalance, required: amount })
      return null
    }

    const newBalance = currentBalance - amount

    // Update balance
    const supabase = getSupabaseClient()
    const { error } = await supabase
      .from('wallets')
      .update({ balance: newBalance })
      .eq('user_id', userId)

    if (error) {
      console.error('[v0] Error updating wallet:', error)
      return null
    }

    console.log('[v0] Balance deducted:', { userId, amount, newBalance })
    return newBalance
  } catch (err) {
    console.error('[v0] Error in deductWalletBalance:', err)
    return null
  }
}

// Add balance to wallet (for rewards, refunds, etc) with MAX_BALANCE enforcement
export const addWalletBalance = async (userId: string, amount: number): Promise<{ success: boolean; newBalance: number | null; cappedByLimit: boolean }> => {
  try {
    const currentBalance = await getWalletBalance(userId)
    if (currentBalance === null) {
      console.error('[v0] Failed to get current balance')
      return { success: false, newBalance: null, cappedByLimit: false }
    }

    // Calculate new balance
    let newBalance = currentBalance + amount
    let cappedByLimit = false

    // Enforce maximum balance cap
    if (newBalance > MAX_BALANCE) {
      console.warn('[v0] Balance cap exceeded. Capping at MAX_BALANCE:', { userId, calculated: newBalance, max: MAX_BALANCE })
      newBalance = MAX_BALANCE
      cappedByLimit = true
    }

    const supabase = getSupabaseClient()
    
    // Update balance and check if at max to set earnings_paused
    const { error } = await supabase
      .from('wallets')
      .update({ 
        balance: newBalance,
        earnings_paused: newBalance >= MAX_BALANCE
      })
      .eq('user_id', userId)

    if (error) {
      console.error('[v0] Error updating wallet:', error)
      return { success: false, newBalance: null, cappedByLimit: false }
    }

    console.log('[v0] Balance added:', { userId, amount, newBalance, cappedByLimit })
    return { success: true, newBalance, cappedByLimit }
  } catch (err) {
    console.error('[v0] Error in addWalletBalance:', err)
    return { success: false, newBalance: null, cappedByLimit: false }
  }
}

// Get user wallet status including balance and earnings_paused flag
export const getWalletStatus = async (userId: string): Promise<{ balance: number; earnings_paused: boolean } | null> => {
  try {
    const supabase = getSupabaseClient()
    const { data, error } = await supabase
      .from('wallets')
      .select('balance, earnings_paused')
      .eq('user_id', userId)
      .single()

    if (error) {
      console.error('[v0] Error fetching wallet status:', error)
      return null
    }

    return {
      balance: data?.balance || 0,
      earnings_paused: data?.earnings_paused || false
    }
  } catch (err) {
    console.error('[v0] Error in getWalletStatus:', err)
    return null
  }
}

// Record transaction
export const recordTransaction = async (transaction: {
  user_id: string
  type: string
  amount: number
  status: string
  description: string
}): Promise<boolean> => {
  try {
    const supabase = getSupabaseClient()
    const { error } = await supabase
      .from('transactions')
      .insert({
        ...transaction,
        created_at: new Date().toISOString(),
        transaction_id: Date.now().toString(),
      })

    if (error) {
      console.error('[v0] Error recording transaction:', error)
      return false
    }

    console.log('[v0] Transaction recorded:', transaction)
    return true
  } catch (err) {
    console.error('[v0] Error in recordTransaction:', err)
    return false
  }
}
