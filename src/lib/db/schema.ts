// localStorage 저장 스키마 — 비금전 완독 챌린지 모델
// 이 앱은 서버 DB/ORM을 쓰지 않는다 (standalone Vite app, src/lib/storage.ts의 localStorage 헬퍼로 영속화).

import type { Badge, Challenge, DailyProgress, Participant, RewardPoint } from "../../types/challenge";

export const STORAGE_KEYS = {
  challenges: "reading-challenge:challenges",
  participants: "reading-challenge:participants",
  dailyProgress: "reading-challenge:dailyProgress",
  rewardPoints: "reading-challenge:rewardPoints",
  badges: "reading-challenge:badges",
} as const;

export interface AppSchema {
  challenges: Challenge[];
  participants: Participant[];
  dailyProgress: DailyProgress[];
  rewardPoints: RewardPoint[];
  badges: Badge[];
}
