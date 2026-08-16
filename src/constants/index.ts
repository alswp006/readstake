export type BadgeDef = {
  id: string;
  name: string;
  description: string;
  streakThreshold?: number;
  xpThreshold?: number;
};

export const BADGE_DEFS: BadgeDef[] = [
  { id: "streak-week", name: "일주일 연속 기록", description: "7일 연속으로 읽었어요", streakThreshold: 7 },
  { id: "streak-month", name: "한 달 연속 기록", description: "30일 연속으로 읽었어요", streakThreshold: 30 },
  { id: "xp-milestone", name: "누적 경험치 마스터", description: "경험치 500을 모았어요", xpThreshold: 500 },
];

export const LEVEL_XP_TABLE = [0, 100, 250, 450, 700, 1000];

export const XP_PER_CHECK = 10;

export const STORAGE_KEYS = {
  goals: "reading_goals",
  logs: "reading_logs",
} as const;
