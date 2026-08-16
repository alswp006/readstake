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
