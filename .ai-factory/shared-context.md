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

export type User = { id: string; name: string; points: number; level: number; completedChallenges: number; createdAt: string };

export type Challenge = { id: string; title: string; description: string; category: string; difficulty: 'easy' | 'medium' | 'hard'; durationDays: number; pointsReward: number };

export type ChallengeResult = { id: string; challengeId: string; userId: string; completedAt: string; pointsEarned: number };

export type LeaderboardEntry = { userId: string; userName: string; points: number; level: number };

export type useAppStoreFn = () => { user: User | null; challenges: Challenge[]; results: ChallengeResult[]; loading: boolean; error: string | null; completeChallenge: (challengeId: string) => Promise<void>; loadChallenges: () => Promise<void>; setUser: (user: User) => void };

export type getChallengesFn = () => Promise<Challenge[]>;

export type submitChallengeResultFn = (challengeId: string) => Promise<ChallengeResult>;

export type getLeaderboardFn = () => Promise<LeaderboardEntry[]>;

export type validatePolicyComplianceFn = (text: string) => { valid: boolean; violations?: string[] };

```

## Existing Codebase (import and use these — do NOT recreate)
### File Tree (src/)
  components/
    Card.tsx
    PageShell.tsx
    ScreenScaffold.tsx
    StateView.tsx
  constants/
    index.ts
  lib/
    api.ts
    contract.ts
    rewards.ts
  pages/
    Challenge.tsx
    Home.tsx
    Ranking.tsx
    Result.tsx
  store/
    useAppStore.ts
  types/
    index.ts

### Exports (src/lib/)
- api.ts: export async function getChallenges(): Promise<Challenge[]>; export async function submitChallengeResult(challengeId: string): Promise<ChallengeResult>; export async function getLeaderboard(): Promise<LeaderboardEntry[]>
- contract.ts: export type User =; export type Challenge =; export type ChallengeResult =; export type LeaderboardEntry =; export type useAppStoreFn = () =>; export type getChallengesFn = () => Promise<Challenge[]>; export type submitChallengeResultFn = (challengeId: string) => Promise<ChallengeResult>; export type getLeaderboardFn = () => Promise<LeaderboardEntry[]>
- rewards.ts: export function calculateXpEarned(challenge: Challenge): number; export function calculateLevel(totalXp: number): number; export function updateStreak(streak: Streak, completedAt: string): Streak; export function calculateGoalAchievementRate(completedCount: number, goalCount: number): number; export function isPersonalBest(pastResults: ChallengeResult[], candidate: ChallengeResult): boolean; export function checkEarnedBadges(streak: Streak, totalCompleted: number): Badge[]

### Components (src/components/)
- Card.tsx: Card
- PageShell.tsx: PageShell
- ScreenScaffold.tsx: ScreenScaffold
- StateView.tsx: EmptyState
CRITICAL: Before creating any new function, type, or component, check the list above. If something similar exists, import and use it.