# Shared Context (auto-generated — do NOT modify)


## Shared Types Contract (IMPORT these, do NOT redefine)
```typescript
// 완독 챌린지 도메인 타입 — 비금전 모델
// 금전 관련 필드는 존재하지 않는다. 보상은 앱 내부 전용 포인트/뱃지뿐이다.

export interface Challenge {
  id: string;
  title: string;
  targetUnits: number;
  periodStart: Date;
  periodEnd: Date;
}

export interface Participant {
  id: string;
  challengeId: string;
  userId: string;
  joinedAt: Date;
}

export interface DailyProgress {
  participantId: string;
  date: Date;
  unitsRead: number;
}

```

## Existing Codebase (import and use these — do NOT recreate)
### File Tree (src/)
  app/
    api/
    challenge/
  components/
    ChallengeForm.tsx
    ResultSummary.tsx
  constants/
    copy.ts
  lib/
    challenge/
    db/
    types.ts
    validation/
  types/
    challenge.ts

### Exports (src/lib/)
- challenge/rules.ts: export const POINT_RULES: Record<PointSource, PointAwardRule> =; export const REWARD_POINT_POLICY: RewardPointPolicy =; export const COMPLETION_BADGE_LABEL = "완독뱃지"; export const COMPLETION_THRESHOLD = 1; export function computeCompletionRate(totalUnits: number, completedUnits: number): number; export function awardPoints(params: AwardPointsParams):; export function resolveChallengeOutcome( participant: Pick<Participant, "id" | "completionRate"> ): ChallengeCompletionR; export function calculateCompletion( unitsRead: number, targetUnits: number ):
- db/schema.ts: export const STORAGE_KEYS =; export interface AppSchema
- types.ts: export interface Challenge; export interface Participant; export interface DailyProgress
- validation/policyGuard.ts: export type PolicyCategory = "gambling" | "financial"; export interface PolicyViolation; export const GAMBLING_KEYWORDS: string[] = ["배팅", "베팅", "판돈", "도박", "추첨경품"]; export const FINANCIAL_KEYWORDS: string[] = [ "예치금", "송금", "출금", "환전", "정산", "에스크로", "선불충전", ]; export function getPolicyViolations(text: string | null | undefined): PolicyViolation[]; export function validatePolicyKeywords(text: string | null | undefined): boolean

### Components (src/components/)
- ChallengeForm.tsx: buildChallengeDraft
- ResultSummary.tsx: buildResultSummary

### API Routes
- POST /api/challenge
CRITICAL: Before creating any new function, type, or component, check the list above. If something similar exists, import and use it.

## Already Implemented (do NOT duplicate or overwrite)
- heal-2-01: 타입체크 그린 베이스라인 복구(게이트 자체를 먼저 살린다) (files: package.json, tsconfig.json, src/types/index.ts, next-env.d.ts)
- heal-2-02: 비금전 챌린지 도메인 전환을 참조 정리까지 한 커밋에 원자적으로 수행 (files: spec/app-spec.md, src/types/challenge.ts, src/lib/db/schema.ts, src/lib/challenge/rules.ts, src/app/api/challenge/route.ts, src/lib/payment/)