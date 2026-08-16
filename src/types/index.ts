export type { User, Challenge, ChallengeResult, LeaderboardEntry } from "../lib/contract";

export type Badge = {
  id: string;
  name: string;
  description: string;
  earnedAt: string;
};

export type Streak = {
  currentStreak: number;
  longestStreak: number;
  lastCompletedAt: string | null;
};

export type Progress = {
  challengeId: string;
  percentComplete: number;
  updatedAt: string;
};

export type UserRewardSummary = {
  xp: number;
  level: number;
  streak: Streak;
  badges: Badge[];
};
