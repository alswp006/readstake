# Shared Context (auto-generated — do NOT modify)


## Existing Codebase (import and use these — do NOT recreate)
### File Tree (src/)
  lib/
    challenge/
    db/
  types/
    challenge.ts

### Exports (src/lib/)
- challenge/rules.ts: export const POINT_RULES: Record<PointSource, PointAwardRule> =; export const REWARD_POINT_POLICY: RewardPointPolicy =; export const COMPLETION_BADGE_LABEL = "완독뱃지"; export const COMPLETION_THRESHOLD = 1; export function computeCompletionRate(totalUnits: number, completedUnits: number): number; export function awardPoints(params: AwardPointsParams):; export function resolveChallengeOutcome( participant: Pick<Participant, "id" | "completionRate"> ): ChallengeCompletionR; export function rankParticipants( entries: Array<Pick<RankingEntry, "participantId" | "userId" | "completionRate" | "poi
- db/schema.ts: export const STORAGE_KEYS =; export interface AppSchema
CRITICAL: Before creating any new function, type, or component, check the list above. If something similar exists, import and use it.