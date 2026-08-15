// 챌린지 상세/진행 화면 — 참가자 완독 진행률을 보여준다.

import { JOIN_CHALLENGE_CTA, VIEW_RESULT_CTA } from "../../../constants/copy";
import { computeCompletionRate } from "../../../lib/challenge/rules";
import type { Challenge, DailyProgress } from "../../../types/challenge";

export interface ChallengeDetailContent {
  challenge: Pick<Challenge, "title" | "description" | "startDate" | "endDate">;
  completionRate: number;
  joinCtaLabel: string;
  resultCtaLabel: string;
}

export function buildChallengeDetailContent(
  challenge: Pick<Challenge, "title" | "description" | "startDate" | "endDate">,
  progress: Array<Pick<DailyProgress, "chaptersCompleted">>,
  totalUnits: number
): ChallengeDetailContent {
  const completedUnits = progress.reduce((sum, p) => sum + p.chaptersCompleted, 0);

  return {
    challenge,
    completionRate: computeCompletionRate(totalUnits, completedUnits),
    joinCtaLabel: JOIN_CHALLENGE_CTA,
    resultCtaLabel: VIEW_RESULT_CTA,
  };
}
