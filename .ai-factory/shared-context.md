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

/** 독서 목표 엔티티 (금전 없음) (구현: 패킷 heal-2-01) */
export type Goal = { id: string; title: string; dailyTargetPages: number };

/** 하루 독서 기록 (구현: 패킷 heal-2-01) */
export type DailyLog = { date: string; pagesRead: number; completed: boolean };

/** 진행률 (구현: 패킷 heal-2-01) */
export type Progress = { percent: number; totalDays: number };

/** 연속 기록 (구현: 패킷 heal-2-01) */
export type Streak = { current: number; best: number; lastCheckedDate: string | null };

/** 배지/업적 (구현: 패킷 heal-2-01) */
export type Badge = { id: string; name: string; description: string; achievedAt: string };

/** 비금전 사용자 보상 요약 (구현: 패킷 heal-2-01) */
export type UserStats = { xp: number; level: number; streak: Streak; badges: Badge[] };

/** 스토어 상태 + 액션 (구현: 패킷 heal-2-01) */
export type AppState = {
  goals: Goal[];
  logs: DailyLog[];
  stats: UserStats;
  setGoal: (goal: Goal) => Promise<void>;
  checkToday: (pagesRead: number) => Promise<DailyLog>;
  resetStreakIfMissed: (today: string) => void;
  grantBadge: (badge: Badge) => void;
};

/** Zustand 스타일 스토어 훅 (구현: 패킷 heal-2-01) */
export type useAppStoreFn = () => AppState;

/** 진행률 계산 순수 함수 (구현: 패킷 heal-2-01) */
export type calcProgressFn = (logs: DailyLog[], goal: Goal) => Progress;

/** 연속 기록 계산 순수 함수 (구현: 패킷 heal-2-01) */
export type calcStreakFn = (logs: DailyLog[], today: string) => Streak;

/** 획득 배지 계산 순수 함수 (구현: 패킷 heal-2-01) */
export type earnedBadgesFn = (stats: UserStats) => Badge[];

/** 정책 위반 항목 검사 (구현: 패킷 heal-1-03) */
export type getPolicyViolationsFn = (content: string) => { type: 'gambling' | 'financial-transfer' | 'competitive-money'; message: string }[];

```

## Existing Codebase (import and use these — do NOT recreate)
### File Tree (src/)
  App.tsx
  components/
    Card.tsx
    PageShell.tsx
    ProgressBar.tsx
    ScreenScaffold.tsx
    StateView.tsx
  constants/
    index.ts
  lib/
    api.ts
    contract.ts
    rewards.ts
  main.tsx
  pages/
    Badges.tsx
    Challenge.tsx
    Goal.tsx
    Home.tsx
    Ranking.tsx
    Result.tsx
    Settings.tsx
    Stats.tsx
  store/
    useAppStore.ts
  types/
    index.ts

### Exports (src/lib/)
- api.ts: export async function getGoals(): Promise<Goal[]>; export async function saveGoalRecord(goal: Goal): Promise<Goal>; export async function getLogs(): Promise<DailyLog[]>; export async function saveLog(log: DailyLog): Promise<DailyLog>
- contract.ts: export type Goal =; export type DailyLog =; export type Progress =; export type Streak =; export type Badge =; export type UserStats =; export type AppState =; export type useAppStoreFn = () => AppState
- rewards.ts: export function calcProgress(logs: DailyLog[], goal: Goal): Progress; export function calcStreak(logs: DailyLog[], today: string): Streak; export function earnedBadges(stats: UserStats): Badge[]

### Components (src/components/)
- Card.tsx: Card
- PageShell.tsx: PageShell
- ProgressBar.tsx: ProgressBar
- ScreenScaffold.tsx: ScreenScaffold
- StateView.tsx: EmptyState, LoadingState
CRITICAL: Before creating any new function, type, or component, check the list above. If something similar exists, import and use it.

## Already Implemented (do NOT duplicate or overwrite)
- heal-2-01: 금전 도메인 원자적 제거: 타입·스토어·lib·모든 참조·테스트를 한 패킷에서 동시에 GREEN화 (files: src/types/index.ts, src/store/useAppStore.ts, src/lib/rewards.ts, src/lib/api.ts, src/constants/index.ts, src/__tests__/rewards.test.ts)
- heal-2-03: 정책 셀프체크 스크립트 추가(순수 정적 검사, 실행 범위 최소화) (files: scripts/policy-check.mjs, package.json, src/pages/Settings.tsx)
- heal-2-02: 습관 트래커 화면 재구성: 금전 UI 제거 후 목표→체크→진행률→배지 흐름 완성 (files: src/pages/Home.tsx, src/pages/Goal.tsx, src/pages/Stats.tsx, src/pages/Badges.tsx, src/App.tsx, src/components)