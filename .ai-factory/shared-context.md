# Shared Context (auto-generated — do NOT modify)


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
    validation/
  types/
    challenge.ts

### Exports (src/lib/)
- challenge/rules.ts: export const POINT_RULES: Record<PointSource, PointAwardRule> =; export const REWARD_POINT_POLICY: RewardPointPolicy =; export const COMPLETION_BADGE_LABEL = "완독뱃지"; export const COMPLETION_THRESHOLD = 1; export function computeCompletionRate(totalUnits: number, completedUnits: number): number; export function awardPoints(params: AwardPointsParams):; export function resolveChallengeOutcome( participant: Pick<Participant, "id" | "completionRate"> ): ChallengeCompletionR; export function rankParticipants( entries: Array<Pick<RankingEntry, "participantId" | "userId" | "completionRate" | "poi
- db/schema.ts: export const STORAGE_KEYS =; export interface AppSchema
- validation/policyGuard.ts: export type PolicyCategory = "gambling" | "financial"; export interface PolicyViolation; export const GAMBLING_KEYWORDS: string[] = ["배팅", "베팅", "판돈", "도박", "추첨경품"]; export const FINANCIAL_KEYWORDS: string[] = [ "예치금", "송금", "출금", "환전", "정산", "에스크로", "선불충전", ]; export function getPolicyViolations(text: string | null | undefined): PolicyViolation[]; export function validatePolicyKeywords(text: string | null | undefined): boolean

### Components (src/components/)
- ChallengeForm.tsx: buildChallengeDraft
- ResultSummary.tsx: buildResultSummary

### API Routes
- POST /api/challenge
CRITICAL: Before creating any new function, type, or component, check the list above. If something similar exists, import and use it.

## Already Implemented (do NOT duplicate or overwrite)
- heal-2-01: 타입체크 그린 베이스라인 복구(게이트 자체를 먼저 살린다) (files: package.json, tsconfig.json, src/types/index.ts, next-env.d.ts)