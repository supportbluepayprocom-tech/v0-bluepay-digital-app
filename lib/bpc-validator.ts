// BPC (Bank Processing Code) Validation Module
// Validates BPC codes and manages code generation within BLUEPAY PRO V30 ecosystem

const BPC_CODE_PREFIX = 'BPC'
const BPC_STORAGE_KEY = 'bluepay_generated_bpc_codes'
const BPC_CODE_VALIDITY_HOURS = 24

// Generate a valid BPC code within BLUEPAY ecosystem
export const generateBPCCode = (): string => {
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(2, 8).toUpperCase()
  const code = `${BPC_CODE_PREFIX}_${timestamp}_${random}`
  
  // Store generated code with timestamp
  try {
    const stored = JSON.parse(localStorage.getItem(BPC_STORAGE_KEY) || '[]') as Array<{ code: string; generatedAt: number }>
    stored.push({ code, generatedAt: timestamp })
    // Keep only recent codes (last 100)
    const recent = stored.slice(-100)
    localStorage.setItem(BPC_STORAGE_KEY, JSON.stringify(recent))
  } catch (err) {
    console.error('[v0] Error storing BPC code:', err)
  }
  
  return code
}

// Validate a BPC code against ecosystem-generated codes
export const validateBPCCode = (code: string): boolean => {
  if (!code || typeof code !== 'string' || code.trim() === '') {
    return false
  }
  
  try {
    const stored = JSON.parse(localStorage.getItem(BPC_STORAGE_KEY) || '[]') as Array<{ code: string; generatedAt: number }>
    const now = Date.now()
    
    // Check if code exists in ecosystem
    for (const entry of stored) {
      if (entry.code === code.trim()) {
        // Check if code is still valid (within 24 hours)
        const ageHours = (now - entry.generatedAt) / (1000 * 60 * 60)
        if (ageHours <= BPC_CODE_VALIDITY_HOURS) {
          return true
        }
      }
    }
    
    return false
  } catch (err) {
    console.error('[v0] Error validating BPC code:', err)
    return false
  }
}

// Get the last valid BPC code generated
export const getLastValidBPCCode = (): string | null => {
  try {
    const stored = JSON.parse(localStorage.getItem(BPC_STORAGE_KEY) || '[]') as Array<{ code: string; generatedAt: number }>
    const now = Date.now()
    
    // Find most recent valid code
    for (let i = stored.length - 1; i >= 0; i--) {
      const entry = stored[i]
      const ageHours = (now - entry.generatedAt) / (1000 * 60 * 60)
      if (ageHours <= BPC_CODE_VALIDITY_HOURS) {
        return entry.code
      }
    }
    
    return null
  } catch (err) {
    console.error('[v0] Error retrieving BPC code:', err)
    return null
  }
}

// Clear invalid codes
export const cleanupExpiredBPCCodes = (): void => {
  try {
    const stored = JSON.parse(localStorage.getItem(BPC_STORAGE_KEY) || '[]') as Array<{ code: string; generatedAt: number }>
    const now = Date.now()
    
    const valid = stored.filter(entry => {
      const ageHours = (now - entry.generatedAt) / (1000 * 60 * 60)
      return ageHours <= BPC_CODE_VALIDITY_HOURS
    })
    
    localStorage.setItem(BPC_STORAGE_KEY, JSON.stringify(valid))
  } catch (err) {
    console.error('[v0] Error cleaning BPC codes:', err)
  }
}
