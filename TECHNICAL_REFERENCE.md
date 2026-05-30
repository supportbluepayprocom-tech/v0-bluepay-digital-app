# BLUEPAY PRO V30 - Technical Reference Guide

## Core Constants

```typescript
// lib/constants.ts
export const MAX_BALANCE = 1000000                    // NGN 1,000,000.00
export const REGISTRATION_BONUS = 250000              // NGN 250,000.00
export const MAX_BALANCE_REACHED_TITLE = 'Maximum Balance Reached'
export const MAX_BALANCE_REACHED_MESSAGE = '...'      // Full message with instructions
export const EARNINGS_PAUSED_MESSAGE = 'Earnings Paused'
export const EARNINGS_PAUSED_DESCRIPTION = '...'      // Resume instructions
```

## Backend Balance Functions

### wallet.ts

```typescript
// Check if reward can be added
export const canAddReward = (currentBalance: number, rewardAmount: number): boolean
// Returns: currentBalance + rewardAmount <= MAX_BALANCE

// Get capped balance
export const getCappedBalance = (balance: number): number
// Returns: Math.min(balance, MAX_BALANCE)

// Get wallet status with earnings flag
export const getWalletStatus = async (userId: string) => {
  return { balance: number, earnings_paused: boolean }
}

// Add balance with enforcement
export const addWalletBalance = async (userId: string, amount: number) => {
  return {
    success: boolean
    newBalance: number | null
    cappedByLimit: boolean  // true if capped at MAX_BALANCE
  }
}

// Update earnings paused flag
export const checkAndUpdateEarningsStatus = async (userId: string, currentBalance: number)
```

## Frontend Balance Functions

### balance-store.ts

```typescript
// Add balance with cap
export function addBalance(amount: number): {
  newBalance: number
  cappedByLimit: boolean  // true if reward was capped
}

// Check if earnings paused
export function isEarningsPaused(): boolean

// Set earnings paused status
export function setEarningsPaused(paused: boolean): void
```

## Dashboard Integration

### app/dashboard/page.tsx

```typescript
// State
const [showMaxBalanceNotification, setShowMaxBalanceNotification] = useState(false)
const [earningsPaused, setEarningsPaused] = useState(false)

// Check on load
if (initialBalance >= MAX_BALANCE) {
  setShowMaxBalanceNotification(true)
  setEarningsPaused(true)
}

// Display balance capped
Math.min(balance, MAX_BALANCE).toLocaleString(...)

// Show notification
<MaxBalanceNotification
  isOpen={showMaxBalanceNotification}
  onClose={() => setShowMaxBalanceNotification(false)}
  balance={Math.min(balance, MAX_BALANCE)}
/>
```

## Earn Page Integration

### app/earn/page.tsx

```typescript
// Check before claiming reward
if (balance >= MAX_BALANCE || earningsPaused) {
  alert(EARNINGS_PAUSED_MESSAGE)
  return
}

// Validate reward amount
if (currentBalance + task.reward > MAX_BALANCE) {
  setEarningsPaused(true)
  alert('Cannot claim reward - would exceed maximum balance...')
  return
}

// Update earnings status
if (newBalance >= MAX_BALANCE) {
  setEarningsPaused(true)
}

// Disable button when paused
disabled={isCompleted || claimingTaskId === task.id || earningsPaused}
```

## Notification Component

### components/MaxBalanceNotification.tsx

```typescript
interface MaxBalanceNotificationProps {
  isOpen: boolean
  onClose: () => void
  balance?: number
}

// Features:
// - Modal with blur backdrop
// - Displays current balance in gradient card
// - Shows full requirement message
// - Numbered action items
// - Auto-close button
// - Fintech styling
```

## Balance Flow Diagram

```
User Action (Task/Reward/Referral)
           ↓
Frontend Validation
  - Check balance >= MAX_BALANCE?
  - Check earningsPaused flag?
           ↓
Backend Validation (Primary)
  - Get current balance
  - Calculate: newBalance = current + reward
  - IF newBalance > MAX_BALANCE:
    - Set balance = MAX_BALANCE
    - Set earnings_paused = true
    - Return cappedByLimit = true
  - ELSE:
    - Update balance normally
    - Update earnings_paused status
           ↓
Display Update
  - Dashboard shows Math.min(balance, MAX_BALANCE)
  - If at max: Show notification
  - If paused: Disable earnings buttons
```

## Environment Variables

None required - all constants defined in `lib/constants.ts`

## Database Schema Updates (Optional)

For persistent earnings_paused flag across sessions:

```sql
-- Add to wallets table
ALTER TABLE wallets ADD COLUMN earnings_paused BOOLEAN DEFAULT false;
ALTER TABLE wallets ADD COLUMN max_balance_reached_at TIMESTAMP;
```

## API Endpoint Pattern

```typescript
// Any reward/credit endpoint should:
1. Get current balance
2. Check: balance >= MAX_BALANCE?
3. If yes: Return error + earnings_paused status
4. If no: Check: (balance + reward) > MAX_BALANCE?
5. If yes: Cap at MAX_BALANCE, set earnings_paused = true
6. If no: Credit normally, check if now at max
7. Return updated balance + earnings_paused status
```

## Error Handling

```typescript
// Show to user when at max balance
const message = `${EARNINGS_PAUSED_MESSAGE}\n${EARNINGS_PAUSED_DESCRIPTION}`
alert(message)

// Log for monitoring
console.log('[v0] Balance capped:', { userId, calculated: newBalance, max: MAX_BALANCE })

// Track in analytics (optional)
trackEvent('balance_cap_reached', { userId, balance: MAX_BALANCE })
```

## Testing Checklist

- [ ] addWalletBalance() returns cappedByLimit=true at 1,000,000
- [ ] Frontend setBalance() never stores > 1,000,000
- [ ] isEarningsPaused() returns true when balance >= MAX_BALANCE
- [ ] Dashboard caps display at MAX_BALANCE
- [ ] Notification shows when balance = MAX_BALANCE
- [ ] Earn page disables tasks when earningsPaused=true
- [ ] Refer page disables referrals when earningsPaused=true
- [ ] Auto-resume when balance drops below MAX_BALANCE
- [ ] User name displays correctly on dashboard
- [ ] Profile updates reflect on dashboard immediately

## Debugging

```typescript
// Check balance status
console.log('[v0] Balance:', getBalance())
console.log('[v0] Max Balance:', MAX_BALANCE)
console.log('[v0] Earnings Paused:', isEarningsPaused())
console.log('[v0] Capped Balance:', getCappedBalance(getBalance()))

// Check wallet status (backend)
const status = await getWalletStatus(userId)
console.log('[v0] Wallet Status:', status)

// Verify notification trigger
if (balance >= MAX_BALANCE) {
  console.log('[v0] Should show max balance notification')
}
```

## Performance Notes

- Balance cap check: O(1) constant time
- No database query overhead for capping
- Frontend validation instant
- Backend validation single query
- No complex loops or recursive calls

## Security Notes

- Backend validation is mandatory - frontend is supplementary
- No user can bypass MAX_BALANCE through direct API calls
- Rewards rejected if they would exceed limit
- earnings_paused flag prevents all reward types
- No admin bypass without explicit function call

## Rollback Instructions

If needed to revert changes:

1. Delete `lib/constants.ts` (or disable its use)
2. Revert `lib/wallet.ts` to remove addWalletBalance cap
3. Revert `lib/balance-store.ts` to remove setBalance cap
4. Remove MaxBalanceNotification from dashboard
5. Remove earnings_paused checks from earn/refer pages

All changes are isolated and can be reverted independently.
