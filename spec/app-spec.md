# App Spec — Challenge Gamification

## Overview
Users join challenges (goal-based daily activities, e.g. "run 5km every
morning for 30 days") and log daily completion. Consistency is tracked as
a streak; finishing a challenge awards points and badges. This is a pure
gamification app — there is no money or pooled reward of any kind
anywhere in the product.

## Core Concepts

- **Challenge** — a goal definition: title, `challengeGoal` (what "done"
  looks like), and `targetDays` (how many days to complete it).
- **Progress** — how many days of a challenge a participant has completed
  so far (`0..targetDays`), shown as a percentage and days remaining.
- **Streak** — the participant's current run of consecutive completed
  days, computed from their own daily log only.
- **Points** — a non-redeemable, in-app gamification number awarded on
  challenge completion. See "Points" below.
- **Badges** — achievement markers unlocked by streak/completion
  milestones (e.g. `week-warrior` at a 7-day streak).

## Reward Rules

Rewards are computed by a pure function of the participant's own data:

```
pointsAwarded = completed ? 100 + streak * 10 : 0
badgesUnlocked = badgesEarned
  + "week-warrior" if streak >= 7
  + "legendary" if completed && streak >= 30
```

This function takes **only** `{ participantId, completed, streak,
badgesEarned }` as input. It never receives other participants' results,
a shared pool, or a count of who succeeded/failed. One participant's
reward is identical regardless of how many other people completed or
missed the same challenge — there is no zero-sum redistribution.

## Points — Non-Redeemable

Points are a gamification metric internal to the app:

- Earned only through challenge completion and streak milestones.
- Displayed with the unit `P` (e.g. `250P`), never a currency symbol.
- `PointsSystem.isRedeemable` is always `false`.
- No function anywhere converts points to cash, gift cards, coupons, or
  any external asset — that conversion path does not exist by design.
  The constant `POINTS_ARE_NON_REDEEMABLE = true` documents this
  invariant in code (see `src/lib/points.ts`).

## Data Model

See `src/types/index.ts` for the full type definitions (`Challenge`,
`Participant`, `PointsSystem`, `BadgeDefinition`) and `src/lib/schema.ts`
/ `migrations/` for the storage schema. All persistence is local
(`localStorage`) via `src/lib/db.ts` — there is no server-side
settlement, payment, or wallet integration.

## Explicitly Out of Scope

- Any amount a user puts up to join a challenge.
- Any pooled amount collected from participants.
- Any transfer of value from participants who miss a challenge to
  participants who complete it.
- Any currency display or conversion.
- Any payment-related SDK call tied to challenge outcomes.
