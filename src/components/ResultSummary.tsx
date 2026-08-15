// 완독 리포트 데이터 — 달성률, 연속 기록, 획득 뱃지만 담는다.

import type { ChallengeCompletionResult } from "../types/challenge";

export interface StreakInfo {
  currentStreakDays: number; // 연속 완독일
  longestStreakDays: number;
}

export interface ResultSummaryData {
  completionRate: number; // 달성률 0-1
  streak: StreakInfo;
  badges: string[]; // 획득 뱃지
  pointsAwarded: number;
}

export function buildResultSummary(
  outcome: ChallengeCompletionResult,
  streak: StreakInfo
): ResultSummaryData {
  return {
    completionRate: outcome.completionRate,
    streak,
    badges: outcome.badge ? [outcome.badge] : [],
    pointsAwarded: outcome.pointsAwarded,
  };
}
