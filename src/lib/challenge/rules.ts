// 완독 챌린지 규칙 엔진 — 비금전 모델
// 실패자에게 어떤 차감/불이익도 주지 않는다. 성공자는 고정 포인트+뱃지만 획득한다.
// 포인트 지급은 참가자 개인 상태에만 의존하며 타인 상태(총량, 순위)를 참조하지 않는다.

import type {
  AwardPointsParams,
  ChallengeCompletionResult,
  Participant,
  PointAwardRule,
  PointSource,
  RankingEntry,
  RewardPointPolicy,
} from "../../types/challenge";

export const POINT_RULES: Record<PointSource, PointAwardRule> = {
  challenge_completion: { source: "challenge_completion", basePoints: 500, maxPoints: 500 },
  streak_bonus: { source: "streak_bonus", basePoints: 100, maxPoints: 100 },
  bonus: { source: "bonus", basePoints: 100, maxPoints: 100 },
  referral: { source: "referral", basePoints: 100, maxPoints: 100 },
};

export const REWARD_POINT_POLICY: RewardPointPolicy = {
  nonRefundable: true,
  nonCashable: true,
  nonTransferable: true,
  redemptionEnabled: false,
  cashoutEnabled: false,
};

export const COMPLETION_BADGE_LABEL = "완독뱃지";

// 완독 기준: 완료 처리에는 100% completionRate가 필요하다
export const COMPLETION_THRESHOLD = 1;

export function computeCompletionRate(totalUnits: number, completedUnits: number): number {
  if (totalUnits <= 0) return 0;
  return Math.min(1, completedUnits / totalUnits);
}

// 고정 규칙 기반 포인트 지급 — 매개변수는 본인 상태만 참조한다
export function awardPoints(params: AwardPointsParams): { participantId: string; points: number } {
  const rule = POINT_RULES[params.ruleSource];
  return { participantId: params.participantId, points: rule.basePoints };
}

// 완독 성공/실패 판정. 실패자는 아무런 불이익 없이 points=0, badge 없음으로만 처리한다.
export function resolveChallengeOutcome(
  participant: Pick<Participant, "id" | "completionRate">
): ChallengeCompletionResult {
  if (participant.completionRate >= COMPLETION_THRESHOLD) {
    const award = awardPoints({
      participantId: participant.id,
      ruleSource: "challenge_completion",
      baseAmount: POINT_RULES.challenge_completion.basePoints,
    });
    return {
      participantId: participant.id,
      status: "completed",
      completionRate: participant.completionRate,
      pointsAwarded: award.points,
      badge: COMPLETION_BADGE_LABEL,
    };
  }

  return {
    participantId: participant.id,
    status: "failed",
    completionRate: participant.completionRate,
    pointsAwarded: 0,
  };
}

// 누적 읽은 분량과 목표 분량만으로 완독 여부·지급 포인트를 계산한다. 실패해도 points는 0일 뿐 음수로 내려가지 않는다.
export function calculateCompletion(
  unitsRead: number,
  targetUnits: number
): { completed: boolean; points: number } {
  const completed = unitsRead >= targetUnits;
  return {
    completed,
    points: completed ? POINT_RULES.challenge_completion.basePoints : 0,
  };
}

// completionRate → points 순으로 정렬해 순위를 매긴다. 현금/우위 필드는 포함하지 않는다.
export function rankParticipants(
  entries: Array<Pick<RankingEntry, "participantId" | "userId" | "completionRate" | "pointsEarned">>
): RankingEntry[] {
  return [...entries]
    .sort((a, b) => b.completionRate - a.completionRate || b.pointsEarned - a.pointsEarned)
    .map((entry, index) => ({ ...entry, rank: index + 1 }));
}
