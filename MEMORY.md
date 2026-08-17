# Project Memory Index

## Packet: Financial Domain → Challenge/Gamification Model Transformation (TDD)

### Current Status
- Test file created: `src/__tests__/packet-heal-1-01.test.ts` (14 test cases across 4 ACs)
- Waiting for implementation by Coder

### Core Transformation
1. **Remove all financial terms**: deposit, stake, payout, refund, 원화, ₩, KRW, etc.
2. **Replace with challenge model**: challengeGoal, progress, streak, points (non-redeemable), badges
3. **Eliminate redistribution logic**: No "failed users' stakes → winners" mechanic (zero-sum forbidden)
4. **Pure reward functions**: Calculations must NOT depend on other participants' results
5. **Non-redeemable points**: P units only, no conversion to cash/coupons/wallets

### Test Structure (TDD)
- **AC-1** (3 tests): Zero financial terminology, P unit formatting
- **AC-2** (5 tests): Pure functions with zero-sum removal, signature validation
- **AC-3** (6 tests): Points marked POINTS_ARE_NON_REDEEMABLE, no conversion pathways
- **AC-4** (5 tests): Type safety, migration/seed data cleanup

### Key Functions Coder Must Implement
1. `calculateChallengeReward(input: ChallengeInput): RewardOutput` — pure function signature, NO otherParticipants
2. Challenge type: challengeGoal, progress, streak, badges (no depositAmount, potAmount)
3. Participant type: pointsEarned, badgesEarned (no stake, refund, deposit)
4. PointsSystem type: isRedeemable = false
5. Badge system: gameplay only, no prize amounts

### Pre-implementation Checklist
- [ ] Read test file to understand AC expectations
- [ ] Create src/lib/types.ts with Challenge, Participant, PointsSystem, Badge types
- [ ] Create src/lib/points.ts with calculateChallengeReward() function
- [ ] Create migrations without financial columns
- [ ] Create seed data without prize pools
- [ ] Run `npm run test` to verify all 14 tests pass
- [ ] Run `npx tsc --noEmit` for type safety
