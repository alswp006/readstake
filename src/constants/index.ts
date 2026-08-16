import type { Challenge } from "../lib/contract";

export const XP_BY_DIFFICULTY: Record<Challenge["difficulty"], number> = {
  easy: 10,
  medium: 20,
  hard: 35,
};

export const LEVEL_XP_STEP = 100;
export const STREAK_BADGE_THRESHOLD = 7;
export const COMPLETION_BADGE_THRESHOLD = 10;

export const STORAGE_KEYS = {
  user: "challenge_user",
  challenges: "challenge_challenges",
  results: "challenge_results",
} as const;
