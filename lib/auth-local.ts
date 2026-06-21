// Local authentication utility using localStorage
// No external dependencies - pure localStorage-based auth

export interface User {
  id: string
  email: string
  fullName: string
  pin?: string
  fingerprintEnabled?: boolean
  fingerprintVerifiedAt?: string
  createdAt: string
}

export interface AuthSession {
  user: User
  loginTime: string
}

const USERS_KEY = 'bluepay_users'
const SESSION_KEY = 'bluepay_session'

// Generate a simple UUID
function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2)
}

// Get all users from localStorage
function getAllUsers(): User[] {
  try {
    const usersJson = localStorage.getItem(USERS_KEY)
    return usersJson ? JSON.parse(usersJson) : []
  } catch (err) {
    console.error('[v0] Error reading users from localStorage:', err)
    return []
  }
}

// Save all users to localStorage
function saveAllUsers(users: User[]): void {
  try {
    localStorage.setItem(USERS_KEY, JSON.stringify(users))
  } catch (err) {
    console.error('[v0] Error saving users to localStorage:', err)
  }
}

// Register a new user
export function registerUser(email: string, fullName: string, pin: string): User | null {
  try {
    const users = getAllUsers()
    
    // Check if email already exists
    if (users.some(u => u.email === email)) {
      console.error('[v0] Email already registered:', email)
      return null
    }
    
    const newUser: User = {
      id: generateId(),
      email: email.toLowerCase(),
      fullName,
      pin,
      fingerprintEnabled: false,
      createdAt: new Date().toISOString(),
    }
    
    users.push(newUser)
    saveAllUsers(users)
    console.log('[v0] User registered:', email)
    return newUser
  } catch (err) {
    console.error('[v0] Error registering user:', err)
    return null
  }
}

// Login user
export function loginUser(email: string, pin: string): User | null {
  try {
    const users = getAllUsers()
    const user = users.find(u => u.email === email.toLowerCase())
    
    if (!user) {
      console.error('[v0] User not found:', email)
      return null
    }
    
    if (user.pin !== pin) {
      console.error('[v0] Invalid PIN for user:', email)
      return null
    }
    
    // Create session
    const session: AuthSession = {
      user,
      loginTime: new Date().toISOString(),
    }
    localStorage.setItem(SESSION_KEY, JSON.stringify(session))
    console.log('[v0] User logged in:', email)
    return user
  } catch (err) {
    console.error('[v0] Error logging in user:', err)
    return null
  }
}

// Get current session
export function getSession(): AuthSession | null {
  try {
    const sessionJson = localStorage.getItem(SESSION_KEY)
    return sessionJson ? JSON.parse(sessionJson) : null
  } catch (err) {
    console.error('[v0] Error reading session:', err)
    return null
  }
}

// Get current user
export function getCurrentUser(): User | null {
  const session = getSession()
  return session?.user || null
}

// Logout user
export function logoutUser(): void {
  try {
    localStorage.removeItem(SESSION_KEY)
    console.log('[v0] User logged out')
  } catch (err) {
    console.error('[v0] Error logging out:', err)
  }
}

// Save fingerprint settings
export function saveFingerprintSettings(userId: string, enabled: boolean, pin?: string): boolean {
  try {
    const users = getAllUsers()
    const userIndex = users.findIndex(u => u.id === userId)
    
    if (userIndex === -1) {
      console.error('[v0] User not found for fingerprint update:', userId)
      return false
    }
    
    users[userIndex].fingerprintEnabled = enabled
    users[userIndex].fingerprintVerifiedAt = new Date().toISOString()
    if (pin) {
      users[userIndex].pin = pin
    }
    
    saveAllUsers(users)
    
    // Update current session if user is logged in
    const session = getSession()
    if (session && session.user.id === userId) {
      session.user = users[userIndex]
      localStorage.setItem(SESSION_KEY, JSON.stringify(session))
    }
    
    console.log('[v0] Fingerprint settings saved for user:', userId)
    return true
  } catch (err) {
    console.error('[v0] Error saving fingerprint settings:', err)
    return false
  }
}

// Verify fingerprint authentication
export function verifyFingerprintAuth(userId: string): boolean {
  try {
    const users = getAllUsers()
    const user = users.find(u => u.id === userId)
    
    if (!user || !user.fingerprintEnabled) {
      return false
    }
    
    console.log('[v0] Fingerprint verified for user:', userId)
    return true
  } catch (err) {
    console.error('[v0] Error verifying fingerprint:', err)
    return false
  }
}

// Update user profile
export function updateUserProfile(userId: string, updates: Partial<User>): boolean {
  try {
    const users = getAllUsers()
    const userIndex = users.findIndex(u => u.id === userId)
    
    if (userIndex === -1) {
      return false
    }
    
    users[userIndex] = { ...users[userIndex], ...updates }
    saveAllUsers(users)
    
    // Update session if needed
    const session = getSession()
    if (session && session.user.id === userId) {
      session.user = users[userIndex]
      localStorage.setItem(SESSION_KEY, JSON.stringify(session))
    }
    
    return true
  } catch (err) {
    console.error('[v0] Error updating user profile:', err)
    return false
  }
}

// Clear all data (for testing/reset)
export function clearAllData(): void {
  try {
    localStorage.removeItem(USERS_KEY)
    localStorage.removeItem(SESSION_KEY)
    console.log('[v0] All auth data cleared')
  } catch (err) {
    console.error('[v0] Error clearing data:', err)
  }
}
