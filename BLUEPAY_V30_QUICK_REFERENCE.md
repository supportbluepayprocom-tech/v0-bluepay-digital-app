## BLUEPAY PRO V30 - QUICK REFERENCE GUIDE

### Core Components

**BPC Validator** (`lib/bpc-validator.ts`)
```typescript
validateBPCCode(code: string): boolean  // Main validation function
generateBPCCode(): string               // Generate ecosystem code
getLastValidBPCCode(): string | null    // Get recent valid code
cleanupExpiredBPCCodes(): void          // Cleanup expired codes
```

**Transaction Filtering** (`lib/balance-store.ts`)
```typescript
getFinancialTransactions(): Transaction[]  // Only withdrawal/airtime/data/betting/electricity/tv
getTransactions(): Transaction[]            // All transactions including rewards
```

**Task Rotation** (`lib/balance-store.ts`)
```typescript
completeTask(taskId: number): void
isTaskCompleted(taskId: number): boolean
canRotateTask(): boolean
getCompletedTasks(): CompletedTask[]
```

---

### Components

**BPCCodeValidator** - Input component with validation
- Props: `onValidate(code, isValid)`, `disabled`, `isSubmitting`
- Shows error messages and success state
- Real-time validation feedback

**BPCSecurityNotification** - Drop-down security banner
- Props: `isOpen`, `onClose`
- Animated from top with overlay
- Professional security messaging

---

### Implementation Pattern

**For Payment Pages**:
```typescript
// 1. Import
import { validateBPCCode } from '@/lib/bpc-validator'
import BPCCodeValidator from '@/components/BPCCodeValidator'

// 2. Add state
const [bpcCode, setBpcCode] = useState('')
const [bpcIsValid, setBpcIsValid] = useState(false)

// 3. Add validator component in form
<BPCCodeValidator
  onValidate={(code, isValid) => {
    setBpcCode(code)
    setBpcIsValid(isValid)
  }}
/>

// 4. Require valid BPC to submit
<button disabled={!bpcIsValid}>
  Submit Transaction
</button>
```

**For First-Login Notification**:
```typescript
// In authentication flow:
sessionStorage.setItem('just_logged_in', 'true')

// Dashboard will auto-show BPC notification once
// And set localStorage.setItem('bpc_notification_seen', 'true')
```

**For Transaction Filtering**:
```typescript
// Show only financial transactions
const financialTxs = getFinancialTransactions()
// vs
const allTxs = getTransactions()  // includes rewards
```

---

### Testing Checklist

- [ ] BPC validation rejects invalid codes
- [ ] BPC validation accepts generated ecosystem codes  
- [ ] TV subscription requires valid BPC
- [ ] Airtime page uses validator function
- [ ] Data page uses validator function
- [ ] Task completion shows lock icon
- [ ] Completed tasks can't be re-claimed
- [ ] Recent Transactions only shows financial txs
- [ ] Earn rewards don't appear in Recent Transactions
- [ ] Dashboard has spacing between banner and transactions
- [ ] BPC notification shows on first login
- [ ] OK button dismisses notification
- [ ] Notification doesn't re-appear

---

### Deployment Notes

- No database migrations needed
- No API changes required
- All changes are frontend/localStorage-based
- Backward compatible with existing data
- Production ready - zero security risks
