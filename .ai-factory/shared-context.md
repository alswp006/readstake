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

/** 사용자 프로필 (금전 제거됨) (구현: 패킷 heal-1-01) */
export type User = { id: string; email: string; pointBalance: number; totalPointsEarned: number };

/** 습관 추적 엔티티 (구현: 패킷 heal-1-01) */
export type Habit = { id: string; userId: string; name: string; category: string; targetDays: number; completedDays: number; currentStreak: number; createdAt: string };

/** 목표 엔티티 (구현: 패킷 heal-1-01) */
export type Goal = { id: string; userId: string; title: string; habitIds: string[]; status: 'active' | 'completed' | 'paused'; progress: number; createdAt: string };

/** 배지/업적 엔티티 (구현: 패킷 heal-1-01) */
export type Badge = { id: string; name: string; description: string; icon: string; pointsRequired: number };

/** 습관 체크인 기록 (구현: 패킷 heal-1-01) */
export type HabitCheckIn = { id: string; habitId: string; date: string; completed: boolean };

/** 스토어 상태 + 액션 (구현: 패킷 heal-1-01) */
export type AppState = { user: User; habits: Habit[]; goals: Goal[]; badges: Badge[]; checkHabit: (habitId: string, date: string) => Promise<HabitCheckIn>; saveGoal: (goal: Goal) => Promise<Goal>; addPoints: (userId: string, amount: number) => Promise<void>; awardBadge: (userId: string, badgeId: string) => Promise<void> };

/** Zustand 스토어 훅 (구현: 패킷 heal-1-01) */
export type useAppStoreFn = () => AppState;

/** 포인트 포맷팅 (UI 표시용) (구현: 패킷 heal-1-01) */
export type formatPointsFn = (points: number) => string;

/** 진행률 계산 (0-100) (구현: 패킷 heal-1-01) */
export type calculateProgressFn = (completed: number, target: number) => number;

/** 연속 기록 계산 (구현: 패킷 heal-1-01) */
export type getStreakFn = (habit: Habit) => number;

/** 습관 체크인당 포인트 (구현: 패킷 heal-1-01) */
export type POINTS_PER_CHECKIN = number;

/** 하루 최대 획득 포인트 (구현: 패킷 heal-1-01) */
export type MAX_DAILY_POINTS = number;

/** 정책 위반 항목 검사 (구현: 패킷 heal-1-03) */
export type getPolicyViolationsFn = (content: string) => { type: 'gambling' | 'financial-transfer' | 'competitive-money'; message: string }[];

```