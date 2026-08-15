// 완독 챌린지 도메인 타입 — 비금전 모델
// 금전 관련 필드는 존재하지 않는다. 보상은 앱 내부 전용 포인트/뱃지뿐이다.

export interface Challenge {
  id: string;
  title: string;
  targetUnits: number;
  periodStart: Date;
  periodEnd: Date;
}

export interface Participant {
  id: string;
  challengeId: string;
  userId: string;
  joinedAt: Date;
}

export interface DailyProgress {
  participantId: string;
  date: Date;
  unitsRead: number;
}
