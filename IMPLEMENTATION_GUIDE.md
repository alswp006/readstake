# Implementation Guide: Financial → Challenge Model (TDD-Based)

## Overview
This packet transforms the app from a financial system (with deposits, stakes, payouts, redistribution) to a pure gamification model (challenges, streaks, points, badges). Tests are already written (14 tests across 4 ACs). **Your job is to make them pass.**

## Test File Location
`src/__tests__/packet-heal-1-01.test.ts` — **READ THIS FIRST**

Each test is self-documenting with clear assertions.

---

## Files You Must Create

### 1. `src/lib/types.ts` — Core Domain Types
```typescript
export interface Challenge {
  id: string;
  title: string;
  challengeGoal: string; // e.g., "30-day running streak"
  targetDays: number;
  progress: number; // days completed (0..targetDays)
  streak: number; // current consecutive days
  badgesEarned: string[];
  createdAt: number;
  updatedAt: number;
  // NEVER: depositAmount, stake, potAmount, prizeAmount, refund
}

export interface Participant {
  id: string;
  challengeId: string;
  completionStatus: "completed" | "in-progress" | "failed";
  currentStreak: number;
  dailyProgress: Record<string, boolean>; // "YYYY-MM-DD" -> completed
  pointsEarned: number;
  badgesEarned: string[];
  // NEVER: deposit, stake, refund, payout
}

export interface PointsSystem {
  userId: string;
  totalPoints: number;
  isRedeemable: false; // MUST be false (literal)
  lastUpdated: number;
  history: Array<{
    action: "earned" | "spent";
    amount: number;
    reason: string;
    timestamp: number;
  }>;
}

export interface BadgeDefinition {
  id: string;
  name: string;
  description: string;
  requiredPoints?: number;
  unlockedAt?: number;
  // NEVER: prizeAmount, rewardCash
}

export interface ChallengeInput {
  participantId: string;
  completed: boolean;
  streak: number;
  badgesEarned: string[];
}

export interface RewardOutput {
  pointsAwarded: number;
  badgesUnlocked: string[];
  isSuccessful: boolean;
}
```

### 2. `src/lib/points.ts` — Core Calculation Logic

#### Function Signature: `calculateChallengeReward()`
```typescript
// CRITICAL: This is a PURE function
// - Takes ONLY individual participant data
// - Does NOT take otherParticipants, failedCount, successfulCount, etc.
// - Returns same output for same input (deterministic)
// - NO redistribution logic ("failed stakes → winners")

export function calculateChallengeReward(input: ChallengeInput): RewardOutput {
  // Base: 100 points for completion
  // Bonus: +10 points per streak day
  // Example: completed + 15-day streak = 100 + (15 * 10) = 250 points
  
  const pointsAwarded = input.completed ? 100 + input.streak * 10 : 0;
  const badgesUnlocked = [...input.badgesEarned];

  // Unlock badges based on streak only (not others' results)
  if (input.streak >= 7) {
    badgesUnlocked.push("week-warrior");
  }
  if (input.completed && input.streak >= 30) {
    badgesUnlocked.push("legendary");
  }

  return {
    pointsAwarded,
    badgesUnlocked,
    isSuccessful: input.completed,
  };
}

// MARKER: Points are non-redeemable
export const POINTS_ARE_NON_REDEEMABLE = true as const;
```

#### Helper Functions (referenced in tests)
```typescript
export interface StreakCalculator {
  calculateCurrentStreak(history: DailyProgress[]): number;
  calculateProgress(completed: number, target: number): {
    percentage: number;
    daysRemaining: number;
  };
}

export const streakCalculator: StreakCalculator = {
  calculateCurrentStreak(history: DailyProgress[]): number {
    // Latest-to-oldest sort, count consecutive true values
    const sorted = [...history].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    
    let streak = 0;
    for (const entry of sorted) {
      if (entry.completed) {
        streak++;
      } else {
        break;
      }
    }
    return streak;
  },

  calculateProgress(completed: number, target: number) {
    return {
      percentage: Math.round((completed / target) * 100),
      daysRemaining: Math.max(0, target - completed),
    };
  },
};

export interface BadgeSystem {
  badgesEarned: string[];
  addBadge(badgeId: string): void;
  hasBadge(badgeId: string): boolean;
}

export function createBadgeSystem(): BadgeSystem {
  return {
    badgesEarned: [],
    addBadge(badgeId: string) {
      if (!this.badgesEarned.includes(badgeId)) {
        this.badgesEarned.push(badgeId);
      }
    },
    hasBadge(badgeId: string) {
      return this.badgesEarned.includes(badgeId);
    },
  };
}
```

### 3. Migrations (if you have a DB layer)

**NO FINANCIAL COLUMNS:**
```typescript
// ✅ Good
CREATE TABLE challenges (
  id TEXT PRIMARY KEY,
  title TEXT,
  challengeGoal TEXT,
  targetDays INTEGER,
  createdAt INTEGER,
  updatedAt INTEGER
);

// ❌ Bad (REMOVE if present)
CREATE TABLE challenges (
  id TEXT PRIMARY KEY,
  depositAmount INTEGER,
  potAmount INTEGER,
  prizePool INTEGER
);
```

### 4. Seed Data

```typescript
export const seedChallenges = [
  {
    id: "ch_morning_run",
    title: "Morning Runner",
    challengeGoal: "Run 5km every morning for 30 days",
    targetDays: 30,
    // NEVER: prizePool, totalStake, totalDeposits
  },
  {
    id: "ch_meal_prep",
    title: "Meal Prep Master",
    challengeGoal: "Prep healthy meals 5 days a week for 60 days",
    targetDays: 60,
  },
];

export const seedBadges = [
  {
    id: "first-join",
    name: "First Join",
    description: "Join your first challenge",
    icon: "🎯",
  },
  {
    id: "week-warrior",
    name: "Week Warrior",
    description: "Complete a 7-day streak",
    icon: "⚡",
  },
  {
    id: "legendary",
    name: "Legendary",
    description: "Complete a 30-day streak",
    icon: "🏆",
  },
];
```

---

## What NOT to Do

### Financial Terms (grep will fail if found)
```
❌ deposit          → use challengeGoal
❌ stake            → use progress
❌ payout           → use pointsAwarded
❌ refund           → N/A (no money to return)
❌ 예치금            → use challengeGoal
❌ 배팅/베팅         → use streaks
❌ 재분배            → REMOVE entirely
❌ 정산              → N/A
❌ 상금              → use badges
❌ 원화/원           → use P (points)
❌ ₩                → use P
❌ KRW              → use P
```

### Function Signatures (will break tests)
```typescript
// ❌ WRONG: Takes other participants
function calculateReward(
  myStreak: number,
  otherParticipants: Participant[], // ❌ FORBIDDEN
  failedCount: number                // ❌ FORBIDDEN
): RewardOutput { }

// ✅ CORRECT: Takes only individual data
function calculateChallengeReward(input: ChallengeInput): RewardOutput { }
```

### Zero-Sum Logic (will fail AC-2)
```typescript
// ❌ WRONG: Redistribution
const failedStakesPool = failed.reduce((sum, p) => sum + p.deposit, 0);
const sharePerWinner = failedStakesPool / winners.length;
const myReward = basePoints + sharePerWinner; // ❌ FORBIDDEN

// ✅ CORRECT: Deterministic only
const myReward = 100 + (myStreak * 10); // Deterministic, no others
```

### Points Redemption (will fail AC-3)
```typescript
// ❌ WRONG: Conversion to real money
function pointsToKRW(points: number): number {
  return points * 100; // ❌ FORBIDDEN
}

function redeemPointsForCoupon(points: number, productId: string) {
  // ❌ FORBIDDEN
}

// ✅ CORRECT: Display only (in UI)
const displayText = `You earned ${reward.pointsAwarded}P`; // P unit only
```

---

## Run Tests (Validation)

```bash
# Install dependencies
npm install

# Run tests (should pass all 14)
npm run test -- src/__tests__/packet-heal-1-01.test.ts

# Type check (MUST pass)
npx tsc --noEmit

# Grep validation (MUST return 0 matches)
grep -r "deposit\|stake\|예치금\|배팅\|베팅\|재분배\|payout\|refund\|정산\|상금\|원화\|₩\|KRW" src/
```

---

## Pre-submission Checklist

- [ ] `npm run test` passes all 14 tests
- [ ] `npx tsc --noEmit` passes (no type errors)
- [ ] `grep` for financial terms returns 0 matches
- [ ] `calculateChallengeReward()` signature has NO `otherParticipants` parameter
- [ ] `POINTS_ARE_NON_REDEEMABLE = true` constant exists and is used
- [ ] No payment SDK calls in reward system
- [ ] No currency conversion functions exported
- [ ] Migrations have no financial columns
- [ ] Seed data has no prize pools

---

## Test-Specific Notes

### AC-1: Terminology Removal
- Grep will scan the entire codebase for forbidden terms
- Even in comments: avoid mentioning "deposit", "stake", etc.

### AC-2: Pure Functions
- `calculateChallengeReward()` is a pure function — same input = same output
- Must NOT have side effects
- Must NOT access global state related to other participants

### AC-3: Non-Redeemable Points
- No functions like `pointsToKRW()`, `redeemPointsForGift()`, `cashOut()`
- Points exist in `PointsSystem.isRedeemable = false`
- Display units as "P", never "KRW", "₩", or "원"

### AC-4: Type Safety
- All interfaces must compile under TypeScript strict mode
- No implicit `any` types
- Migration types must match Challenge/Participant/PointsSystem

---

## Questions? Check Here First
1. **Test failing?** → Read the test's `expect()` statements
2. **What's the function signature?** → Look at test function calls
3. **What types should I use?** → Check the "AC-4: Type Safety" test section
4. **Can I use this function?** → Search test file for forbidden patterns

Good luck! 🚀
