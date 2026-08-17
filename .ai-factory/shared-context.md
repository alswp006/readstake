# Shared Context (auto-generated — do NOT modify)


## Proven Patterns (from "MealBudgetPlanner" — adapt, don't copy)
  DB: interface MonthlyBudget{month:string;amount:number;createdAt:number;updatedAt:number} key mbp_budget_v1; interface MealRecord{id,date,mealType,categor
  DB: key mbp_meals_v1: MealRecord[]; key mbp_budget_v1: Record<string,MonthlyBudget>; key mbp_checkins_v1: DailyCheckIn[]; key mbp_flags_v1: AppFlags

## Existing Codebase (import and use these — do NOT recreate)
### File Tree (src/)
  components/
  lib/
    challenge.ts
    db.ts
    points.ts
    schema.ts
  pages/
  types/
    index.ts

### Exports (src/lib/)
- challenge.ts: export function calculateChallengeReward(input: ChallengeInput): RewardOutput; export function updateProgress( challenge: Challenge, daysCompleted: number, currentStreak: number ): Challenge; export function awardBadge(challenge: Challenge, badgeId: string): Challenge; export function createChallenge( id: string, title: string, challengeGoal: string, targetDays: number ): Challenge; export const seedChallenges: Challenge[] = [ createChallenge( "ch_morning_run", "Morning Runner", "Run 5km every morning
- db.ts: export const challengeStore =; export const participantStore =; export const pointsSystemStore =; export const badgeStore =
- points.ts: export const POINTS_ARE_NON_REDEEMABLE = true as const; export function createPointsSystem(userId: string): PointsSystem; export function awardPoints( system: PointsSystem, amount: number, reason: string ): PointsSystem; export function calculateCurrentStreak(history: DailyProgress[]): number; export function calculateProgress( completed: number, target: number ):; export function addBadge( badgesEarned: string[], badgeId: string ): string[]; export function hasBadge(badgesEarned: string[], badgeId: string): boolean; export const badgeCatalog: BadgeDefinition[] = [
- schema.ts: export interface TableSchema; export const challengesSchema: TableSchema =; export const participantsSchema: TableSchema =; export const pointsSystemSchema: TableSchema =; export const badgesSchema: TableSchema =; export const allSchemas: TableSchema[] = [ challengesSchema, participantsSchema, pointsSystemSchema, badgesSchema, ]

### Module Dependencies (import graph)
  lib/challenge.ts → imports: types, lib/points
  lib/db.ts → imports: types, lib/schema
  lib/points.ts → imports: types
CRITICAL: Before creating any new function, type, or component, check the list above. If something similar exists, import and use it.

## Already Implemented (do NOT duplicate or overwrite)
- heal-1-01: 금전 예치·재분배 도메인을 비금전 챌린지 모델로 치환 (files: spec/app-spec.md, src/types/index.ts, src/lib/schema.ts, src/lib/db.ts, src/lib/challenge.ts, src/lib/points.ts, migrations/)