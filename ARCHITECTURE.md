# Architecture: Challenge Gamification Model

## Domain Model Transformation

### OLD (Financial Model) → NEW (Gamification Model)

```
OLD DOMAIN                          NEW DOMAIN
─────────────────────────────────────────────────────────

User deposits $ stake               User joins challenge
  └─> potAmount (pool)               └─> challengeGoal (target)

Track participation                 Track progress
  └─> No financial tracking          └─> dailyProgress[date]
                                        └─> progress (n/30)
                                        └─> streak (consecutive)

Failed users' stakes → Winners       Success = Points + Badges
(Redistribution logic)              (Pure calculation, no zero-sum)

Settlement service calculates       Direct point award
  └─> who gets paid?                 └─> pointsAwarded = 100 + streak*10
  └─> how much from pot?             └─> badgesUnlocked = [...]

Display currency (₩/KRW)            Display points (P)
  └─> 5000원 refund                  └─> 250P earned
```

---

## New Data Model

### Core Entities

```typescript
Challenge (Goal Definition)
├── id: string
├── title: string
├── challengeGoal: string              // e.g., "30-day running streak"
├── targetDays: number                 // Duration (30, 60, 90)
├── createdAt: number
└── updatedAt: number

Participant (Engagement)
├── id: string
├── challengeId: string                // Which challenge
├── userId: string                     // Who's doing it
├── completionStatus: "completed" | "in-progress" | "failed"
├── currentStreak: number              // Consecutive days (0..targetDays)
├── dailyProgress: Record<YYYY-MM-DD, boolean>  // Per-day tracking
├── pointsEarned: number               // Non-redeemable gamification points
├── badgesEarned: string[]             // Achievement badges
├── createdAt: number
└── updatedAt: number

PointsSystem (Wallet, no real money)
├── userId: string
├── totalPoints: number                // Accumulated P
├── isRedeemable: false                // MARKER: Non-redeemable
├── lastUpdated: number
└── history: Array<{                   // Transaction log
    action: "earned" | "spent",
    amount: number,
    reason: string,                    // "challenge-completed", etc.
    timestamp: number
  }>

Badge (Achievement)
├── id: string
├── name: string
├── description: string                // "Complete 7-day streak"
├── icon: string                       // "⚡", "🏆", etc.
└── requiredPoints?: number            // Optional for future expansion

DailyProgress (Journal)
├── date: string                       // "YYYY-MM-DD"
└── completed: boolean                 // Did user complete today?
```

---

## Core Functions

### Pure Calculation: Reward Calculation

```typescript
calculateChallengeReward(input: ChallengeInput): RewardOutput {
  // NO dependency on other participants
  // Deterministic: same input = same output always
  
  const pointsAwarded = input.completed 
    ? 100 + (input.streak * 10)        // Base + streak bonus
    : 0;
  
  const badges = [];
  if (input.streak >= 7) badges.push("week-warrior");
  if (input.completed && input.streak >= 30) badges.push("legendary");
  
  return { pointsAwarded, badgesUnlocked: badges, isSuccessful: input.completed };
}
```

**Why Pure Function?**
- No global state access
- No network calls
- No side effects
- Deterministic (testable)
- **Participant's reward is never affected by others' success/failure**

### Streak Tracking

```typescript
calculateCurrentStreak(dailyProgress: DailyProgress[]): number {
  // Count consecutive `completed: true` from latest date backward
  // Break on first `false`
  
  const sorted = [...dailyProgress].sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );
  
  let streak = 0;
  for (const day of sorted) {
    if (day.completed) streak++;
    else break;
  }
  return streak;
}
```

### Progress Calculation

```typescript
calculateProgress(completed: number, target: number) {
  return {
    percentage: Math.round((completed / target) * 100),
    daysRemaining: Math.max(0, target - completed)
  };
}
```

### Badge Management

```typescript
interface BadgeSystem {
  badgesEarned: string[];
  
  addBadge(badgeId: string): void {
    if (!this.badgesEarned.includes(badgeId)) {
      this.badgesEarned.push(badgeId);
    }
  }
  
  hasBadge(badgeId: string): boolean {
    return this.badgesEarned.includes(badgeId);
  }
}
```

---

## Type Safety (TypeScript)

All types strict mode compliant. No implicit 'any'.

### Challenge Type Hierarchy
```
Challenge
├── id: string
├── challengeGoal: string
├── targetDays: number
├── progress: number          // 0..targetDays
├── streak: number            // 0..targetDays
├── badgesEarned: string[]    // ["week-warrior", ...]
└── timestamps: { createdAt, updatedAt }
    
    ⚠️ NEVER: depositAmount, stake, potAmount, prizeAmount
```

### Participant Type Hierarchy
```
Participant
├── challengeId: string       // Which challenge
├── userId: string            // Who
├── completionStatus: enum    // completed|in-progress|failed
├── currentStreak: number
├── dailyProgress: Map        // {"2026-08-18": true, ...}
├── pointsEarned: number      // Gamification only
└── badgesEarned: string[]
    
    ⚠️ NEVER: deposit, stake, refund, payout, potAmount
```

### PointsSystem Type Hierarchy
```
PointsSystem
├── userId: string
├── totalPoints: number
├── isRedeemable: false ✓      // MARKER: Non-redeemable
├── history: Array             // Audit trail
│   ├── action: "earned"|"spent"
│   ├── amount: number
│   ├── reason: string
│   └── timestamp: number
└── lastUpdated: number

    ⚠️ NEVER: conversionRate, currencyCode, externalWallet, redemptionPath
    ✓ ALWAYS: isRedeemable = false
```

---

## Points System (Non-Redeemable)

### Key Properties
- **Earned through:** Challenge completion, streak achievements, badges
- **Cannot be:** Converted to cash, gift cards, external assets
- **Can be:** Displayed in UI, used for cosmetic progression, stacked over time
- **Visually:** Always labeled "P" (250P, not 250₩ or 250원)

### Constant Marker
```typescript
export const POINTS_ARE_NON_REDEEMABLE = true as const;
```

### Example Points Award
```typescript
// User completes 30-day challenge with current 15-day streak
const reward = calculateChallengeReward({
  participantId: "user123",
  completed: true,
  streak: 15,
  badgesEarned: []
});

// Output:
// {
//   pointsAwarded: 250,           // 100 base + (15 * 10)
//   badgesUnlocked: ["week-warrior"],  // streak >= 7
//   isSuccessful: true
// }

// Display: "You earned 250P and unlocked Week Warrior! 🎉"
//         NOT: "You earned ₩25,000" or "Refunding ₩10,000"
```

---

## Data Persistence (Storage)

### Local Storage Keys (Example)
```typescript
// User's points wallet
localStorage.setItem("user_points_v1", JSON.stringify(pointsSystem));

// User's challenge participation
localStorage.setItem("user_challenges_v1", JSON.stringify(challenges));

// User's daily progress journal
localStorage.setItem("daily_progress_v1", JSON.stringify(dailyProgress));

// Badges library (app-wide)
localStorage.setItem("badges_v1", JSON.stringify(allBadges));
```

### Migration Keys (DB)
```
Table: challenges
  Columns: id, title, challengeGoal, targetDays, createdAt, updatedAt
  
Table: participants
  Columns: id, challengeId, userId, completionStatus, currentStreak, pointsEarned, 
           dailyProgress (JSON), badgesEarned, createdAt, updatedAt

Table: points_system
  Columns: userId, totalPoints, history (JSON), updatedAt

Table: badges
  Columns: id, name, description, icon, requiredPoints
```

---

## Seed Data Examples

### Challenges (Game Definitions)
```typescript
[
  {
    id: "ch_morning_run",
    title: "Morning Runner",
    challengeGoal: "Run 5km every morning for 30 days",
    targetDays: 30,
    createdAt: Date.now(),
    updatedAt: Date.now()
  },
  {
    id: "ch_meal_prep",
    title: "Meal Prep Master",
    challengeGoal: "Prep 5 healthy meals per week for 60 days",
    targetDays: 60,
    createdAt: Date.now(),
    updatedAt: Date.now()
  }
]
```

### Badges (Achievement Library)
```typescript
[
  {
    id: "first-join",
    name: "First Join",
    description: "Join your first challenge",
    icon: "🎯"
  },
  {
    id: "week-warrior",
    name: "Week Warrior",
    description: "Complete a 7-day streak",
    icon: "⚡"
  },
  {
    id: "legendary",
    name: "Legendary",
    description: "Complete a 30-day streak",
    icon: "🏆"
  }
]
```

---

## Validation Rules

### Account Creation
- User joins challenge → creates Participant entry
- Initial: `currentStreak = 0`, `pointsEarned = 0`, `badgesEarned = []`

### Daily Completion
- User logs today's completion → `dailyProgress["2026-08-18"] = true`
- Auto-calculate `currentStreak` from history
- If `completionStatus === "completed"` → trigger `calculateChallengeReward()`

### Reward Issuance
- Award is deterministic (same streak = same points)
- No dependency on other users
- Points added to `PointsSystem.totalPoints`
- New badges added to `Participant.badgesEarned`

### Challenge Completion
- User reaches `progress === targetDays` → `completionStatus = "completed"`
- Final reward calculated and issued
- No refunds, no reversals (points are non-redeemable anyway)

---

## No-Go Zones ❌

### Financial Operations
```
❌ Settlement service
❌ Payment gateway calls
❌ Currency conversion (KRW, ₩, 원)
❌ Redistribution logic (failed → winners)
❌ Refund processing
❌ Prize pool calculation
❌ Real money transactions
```

### SDK Calls
```
❌ TossPayment.settleRewards()
❌ Wallet.deposit()
❌ Ledger.calculatePayout()
❌ Settlement.process()
```

### Data Fields
```
❌ depositAmount
❌ stake / stakeAmount
❌ potAmount
❌ prizeAmount / prizePool
❌ refundAmount
❌ settlementStatus
❌ payoutDate
❌ currencyCode
❌ exchangeRate
```

---

## Success Criteria

✅ All 14 tests pass
✅ TypeScript strict mode: 0 errors
✅ Grep (financial terms): 0 matches
✅ Pure function: `calculateChallengeReward()` signature verified
✅ Points non-redeemable: `isRedeemable = false` enforced
✅ UI displays P units (not ₩/원/KRW)
✅ No SDK settlement calls
✅ Migrations clean (no financial columns)

---

## Examples: What Good Looks Like

### ✅ Correct Reward Function
```typescript
function calculateChallengeReward(input: ChallengeInput): RewardOutput {
  const pointsAwarded = input.completed ? 100 + input.streak * 10 : 0;
  const badgesUnlocked = [...input.badgesEarned];
  if (input.streak >= 7) badgesUnlocked.push("week-warrior");
  return { pointsAwarded, badgesUnlocked, isSuccessful: input.completed };
}
```

### ✅ Correct Points Display
```typescript
const displayPoints = (points: number) => `${points}P earned!`;
// Output: "250P earned!"
// NOT: "250₩ earned" or "250원 적립"
```

### ✅ Correct Type Definition
```typescript
interface Participant {
  id: string;
  challengeId: string;
  pointsEarned: number;    // ✓ Gamification
  badgesEarned: string[];  // ✓ Achievements
  // NO: deposit, stake, refund, payout
}
```

### ❌ Wrong: Redistribution
```typescript
// THIS IS FORBIDDEN
function calculateReward(participant: Participant, allParticipants: Participant[]) {
  const failed = allParticipants.filter(p => !p.completed);
  const pot = failed.reduce((sum, p) => sum + p.deposit, 0);  // ❌ ZERO-SUM
  return 100 + (pot / winners.length);  // ❌ BANNED
}
```

### ❌ Wrong: Currency Conversion
```typescript
// THIS IS FORBIDDEN
function pointsToKRW(points: number): number {
  return points * 1000;  // ❌ CONVERSION BANNED
}

function redeemPointsForCoupon(points: number, couponId: string) {
  // ❌ REDEMPTION BANNED
}
```

---

## Summary

This architecture removes all financial machinery and replaces it with a pure **gamification model**:

- **Deposits → Challenges** (goal-based activities)
- **Stakes → Streaks** (consistency tracking)
- **Payouts → Points** (non-redeemable gamification)
- **Redistribution → Pure Calculation** (user's reward ≠ others' results)
- **Currency → P Units** (display only)

Result: A clean, testable, fair system where users earn badges and points through consistent participation, with **zero financial complexity** and **zero zero-sum mechanics**.
