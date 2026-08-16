import type { Challenge, ChallengeResult } from "./contract";
import type { Badge, Streak } from "../types";
import {
  XP_BY_DIFFICULTY,
  LEVEL_XP_STEP,
  STREAK_BADGE_THRESHOLD,
  COMPLETION_BADGE_THRESHOLD,
} from "../constants";

export function calculateXpEarned(challenge: Challenge): number {
  return challenge.pointsReward > 0 ? challenge.pointsReward : XP_BY_DIFFICULTY[challenge.difficulty];
}

export function calculateLevel(totalXp: number): number {
  return Math.max(1, Math.floor(totalXp / LEVEL_XP_STEP) + 1);
}

export function updateStreak(streak: Streak, completedAt: string): Streak {
  const oneDayMs = 24 * 60 * 60 * 1000;
  const isConsecutiveDay =
    streak.lastCompletedAt !== null &&
    Math.round((new Date(completedAt).getTime() - new Date(streak.lastCompletedAt).getTime()) / oneDayMs) === 1;
  const currentStreak = isConsecutiveDay ? streak.currentStreak + 1 : 1;
  return {
    currentStreak,
    longestStreak: Math.max(streak.longestStreak, currentStreak),
    lastCompletedAt: completedAt,
  };
}

export function calculateGoalAchievementRate(completedCount: number, goalCount: number): number {
  if (goalCount <= 0) return 0;
  return Math.min(1, completedCount / goalCount);
}

export function isPersonalBest(pastResults: ChallengeResult[], candidate: ChallengeResult): boolean {
  const previousBest = pastResults.reduce((best, result) => Math.max(best, result.pointsEarned), 0);
  return candidate.pointsEarned > previousBest;
}

export function checkEarnedBadges(streak: Streak, totalCompleted: number): Badge[] {
  const earnedAt = new Date().toISOString();
  const badges: Badge[] = [];
  if (streak.currentStreak >= STREAK_BADGE_THRESHOLD) {
    badges.push({
      id: "streak-week",
      name: "일주일 연속 완독",
      description: `${STREAK_BADGE_THRESHOLD}일 연속으로 챌린지를 완료했어요`,
      earnedAt,
    });
  }
  if (totalCompleted >= COMPLETION_BADGE_THRESHOLD) {
    badges.push({
      id: "completed-milestone",
      name: "완독 마스터",
      description: `챌린지를 ${COMPLETION_BADGE_THRESHOLD}회 완료했어요`,
      earnedAt,
    });
  }
  return badges;
}
