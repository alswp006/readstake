# Shared Context (auto-generated — do NOT modify)


## 패킷 간 계약 (src/lib/contract.ts — 자동 생성, 수정 금지)
여기 선언된 이름·인자·반환 타입은 확정이다. 기반 패킷은 이대로 구현하고,
화면 패킷은 이대로 호출하라. 다르게 만들지 마라.

```typescript
/**
 * 패킷 간 인터페이스 계약 — 자동 생성. **수정하지 마라.**
 *
 * 기반 패킷은 여기 선언된 모양 그대로 구현하고, 화면 패킷은 여기 적힌 이름·인자·반환
 * 타입을 그대로 가정해도 된다. 추측이 어긋나 병합에서 무너지는 것을 막기 위한 파일이다.
 */

/** 챌린지 엔티티. heal-1-02 UI에서 표시/관리 (구현: 패킷 heal-1-01) */
export type Challenge = { id: string; name: string; description: string; targetPoints: number; startDate: string; endDate: string; status: 'active' | 'completed' | 'draft' };

/** 사용자 포인트 현황. heal-1-02 결과 화면에서 표시 (구현: 패킷 heal-1-01) */
export type UserPoints = { userId: string; totalPoints: number; currentRank: number; lastUpdatedAt: string };

/** 챌린지별 진행상황. heal-1-02에서 UI 갱신에 사용 (구현: 패킷 heal-1-01) */
export type ChallengeProgress = { challengeId: string; userId: string; pointsEarned: number; completedAt?: string; status: 'pending' | 'completed' };

/** heal-1-02의 challenge/[id]/page.tsx에서 상세 조회 (구현: 패킷 heal-1-01) */
export type getChallengeByIdFn = (id: string) => Promise<Challenge | null>;

/** heal-1-02의 챌린지 목록 페이지에서 조회 (구현: 패킷 heal-1-01) */
export type listChallengesFn = (filters?: { status?: string; limit?: number }) => Promise<Challenge[]>;

/** heal-1-02의 result/page.tsx에서 포인트 표시 (구현: 패킷 heal-1-01) */
export type getUserPointsFn = (userId: string) => Promise<UserPoints | null>;

/** heal-1-02 UI에서 챌린지 완료 기록 (구현: 패킷 heal-1-01) */
export type recordChallengeCompletionFn = (userId: string, challengeId: string, pointsEarned: number) => Promise<void>;

/** heal-1-02에서 포인트 계산/표시용 (구현: 패킷 heal-1-01) */
export type calculatePointsFn = (challengeId: string) => number;

/** heal-1-02에서 포인트 UI 포맷팅 (예: '1,250 점') (구현: 패킷 heal-1-01) */
export type formatPointsDisplayFn = (points: number) => string;

/** 정책 위반 사항. heal-1-03/heal-2-03 검증 결과 타입 (구현: 패킷 heal-1-03) */
export type PolicyViolation = { code: string; message: string; severity: 'error' | 'warning'; context?: Record<string, any> };

/** 정책 준수 검증. heal-2-03에서 통합 검증에 포함 (구현: 패킷 heal-1-03) */
export type validatePoliciesFn = () => Promise<PolicyViolation[]>;

/** 통합 준수 검증 결과. CI/CD 워크플로우에서 사용 (구현: 패킷 heal-2-03) */
export type ComplianceCheckResult = { passed: boolean; violations: PolicyViolation[]; timestamp: string };

/** .github/workflows/ci.yml에서 호출. 정책+의존성 통합 검증 (구현: 패킷 heal-2-03) */
export type verifyComplianceFn = () => Promise<ComplianceCheckResult>;

```

## Proven Patterns (from "MealBudgetPlanner" — adapt, don't copy)
  DB: interface MonthlyBudget{month:string;amount:number;createdAt:number;updatedAt:number} key mbp_budget_v1; interface MealRecord{id,date,mealType,categor
  DB: key mbp_meals_v1: MealRecord[]; key mbp_budget_v1: Record<string,MonthlyBudget>; key mbp_checkins_v1: DailyCheckIn[]; key mbp_flags_v1: AppFlags

## Existing Codebase (import and use these — do NOT recreate)
### File Tree (src/)
  App.tsx
  app/
    challenge/
    result/
  components/
    OnboardingNotice.tsx
  lib/
    challenge.ts
    db.ts
    points.ts
    schema.ts
  pages/
    ChallengeDetail.tsx
    Home.tsx
    Result.tsx
  types/
    index.ts

### Exports (src/lib/)
- challenge.ts: export function calculateChallengeReward(input: ChallengeInput): RewardOutput; export function updateProgress( challenge: Challenge, daysCompleted: number, currentStreak: number ): Challenge; export function awardBadge(challenge: Challenge, badgeId: string): Challenge; export function createChallenge( id: string, title: string, challengeGoal: string, targetDays: number ): Challenge; export const seedChallenges: Challenge[] = [ createChallenge( "ch_morning_run", "Morning Runner", "Run 5km every morning
- db.ts: export const challengeStore =; export const participantStore =; export const pointsSystemStore =; export const badgeStore =
- points.ts: export const POINTS_ARE_NON_REDEEMABLE = true as const; export function createPointsSystem(userId: string): PointsSystem; export function awardPoints( system: PointsSystem, amount: number, reason: string ): PointsSystem; export function calculateCurrentStreak(history: DailyProgress[]): number; export function calculateProgress( completed: number, target: number ):; export function addBadge( badgesEarned: string[], badgeId: string ): string[]; export function hasBadge(badgesEarned: string[], badgeId: string): boolean; export const badgeCatalog: BadgeDefinition[] = [
- schema.ts: export interface TableSchema; export const challengesSchema: TableSchema =; export const participantsSchema: TableSchema =; export const pointsSystemSchema: TableSchema =; export const badgesSchema: TableSchema =; export const allSchemas: TableSchema[] = [ challengesSchema, participantsSchema, pointsSystemSchema, badgesSchema, ]

### Components (src/components/)
- OnboardingNotice.tsx: OnboardingNotice

### Module Dependencies (import graph)
  lib/challenge.ts → imports: types, lib/points
  lib/db.ts → imports: types, lib/schema
  lib/points.ts → imports: types
  pages/ChallengeDetail.tsx → imports: lib/challenge
  pages/Home.tsx → imports: lib/challenge, components/OnboardingNotice
  pages/Result.tsx → imports: lib/challenge, lib/points
CRITICAL: Before creating any new function, type, or component, check the list above. If something similar exists, import and use it.

## Already Implemented (do NOT duplicate or overwrite)
- heal-1-01: 금전 예치·재분배 도메인을 비금전 챌린지 모델로 치환 (files: spec/app-spec.md, src/types/index.ts, src/lib/schema.ts, src/lib/db.ts, src/lib/challenge.ts, src/lib/points.ts, migrations/)
- heal-1-02: 결제·정산 관련 화면과 카피를 비금전 UI로 전환 (files: src/app/, src/components/, src/app/challenge/[id]/page.tsx, src/app/result/page.tsx, src/components/OnboardingNotice.tsx)
- heal-1-03: 정책 준수 자체검증 가드 추가 (files: scripts/policy-check.mjs, package.json, README.md)