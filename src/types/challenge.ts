// 완독 챌린지 도메인 타입 — 비금전 모델
// 금전 관련 필드는 존재하지 않는다. 보상은 앱 내부 전용 포인트/뱃지뿐이다.

export type ChallengeStatus = "active" | "completed" | "archived";

export interface Challenge {
  id: string;
  title: string;
  description: string;
  startDate: Date;
  endDate: Date;
  maxParticipants: number;
  createdBy: string;
  status: ChallengeStatus;
}

export type ParticipantStatus = "active" | "completed" | "failed" | "withdrew";

export interface Participant {
  id: string;
  userId: string;
  challengeId: string;
  joinedAt: Date;
  completionRate: number; // 0-1
  status: ParticipantStatus;
}

export interface DailyProgress {
  participantId: string;
  date: Date;
  pagesRead: number;
  chaptersCompleted: number;
}

export type PointSource = "challenge_completion" | "bonus" | "referral" | "streak_bonus";

export interface RewardPoint {
  id: string;
  userId: string;
  pointAmount: number;
  awardedAt: Date;
  source: PointSource;
  nonRefundable: boolean; // 항상 true — 현금화 불가
}

// 포인트는 현금화·이체가 불가능한 앱 내부 전용 보상임을 명시하는 고정 정책
export interface RewardPointPolicy {
  nonRefundable: boolean;
  nonCashable: boolean;
  nonTransferable: boolean;
  redemptionEnabled: boolean;
  cashoutEnabled: boolean;
}

// 포인트 지급 규칙 — 고정값만 허용, 동적 계산(formula)이나 타인 상태 참조 금지
export interface PointAwardRule {
  source: PointSource;
  basePoints: number;
  maxPoints: number;
}

export interface AwardPointsParams {
  participantId: string;
  ruleSource: PointSource;
  baseAmount: number;
}

export interface Badge {
  id: string;
  participantId: string;
  challengeId: string;
  label: string;
  awardedAt: Date;
}

// 챌린지 완료/실패 처리 결과 — 실패자는 penalty 없이 status만 변경된다
export interface ChallengeCompletionResult {
  participantId: string;
  status: "completed" | "failed";
  completionRate: number;
  pointsAwarded: number;
  badge?: string;
}

export interface RankingEntry {
  rank: number;
  participantId: string;
  userId: string;
  completionRate: number;
  pointsEarned: number;
}
