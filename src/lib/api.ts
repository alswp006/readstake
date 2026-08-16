import type { Challenge, ChallengeResult, LeaderboardEntry } from "./contract";
import { STORAGE_KEYS } from "../constants";
import { calculateLevel } from "./rewards";

const SEED_CHALLENGES: Challenge[] = [
  {
    id: "c1",
    title: "독서 습관 21일",
    description: "매일 20쪽씩 21일 동안 읽기",
    category: "habit",
    difficulty: "easy",
    durationDays: 21,
    pointsReward: 210,
  },
  {
    id: "c2",
    title: "완독 챌린지",
    description: "책 한 권을 2주 안에 완독하기",
    category: "reading",
    difficulty: "medium",
    durationDays: 14,
    pointsReward: 280,
  },
  {
    id: "c3",
    title: "몰입 독서 마라톤",
    description: "30일 동안 매일 40쪽 이상 읽기",
    category: "habit",
    difficulty: "hard",
    durationDays: 30,
    pointsReward: 600,
  },
];

function readList<T>(key: string): T[] {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T[]) : [];
  } catch {
    return [];
  }
}

function writeList<T>(key: string, list: T[]): void {
  try {
    localStorage.setItem(key, JSON.stringify(list));
  } catch {
    // localStorage 접근 불가 시 조용히 무시 (프라이버시 모드 등)
  }
}

export async function getChallenges(): Promise<Challenge[]> {
  const stored = readList<Challenge>(STORAGE_KEYS.challenges);
  if (stored.length > 0) return stored;
  writeList(STORAGE_KEYS.challenges, SEED_CHALLENGES);
  return SEED_CHALLENGES;
}

export async function submitChallengeResult(challengeId: string): Promise<ChallengeResult> {
  const challenges = await getChallenges();
  const challenge = challenges.find((item) => item.id === challengeId);
  if (!challenge) {
    throw new Error("존재하지 않는 챌린지예요");
  }
  const results = readList<ChallengeResult>(STORAGE_KEYS.results);
  const result: ChallengeResult = {
    id: `result_${challengeId}_${results.length + 1}`,
    challengeId,
    userId: "me",
    completedAt: new Date().toISOString(),
    pointsEarned: challenge.pointsReward,
  };
  writeList(STORAGE_KEYS.results, [...results, result]);
  return result;
}

export async function getLeaderboard(): Promise<LeaderboardEntry[]> {
  const results = readList<ChallengeResult>(STORAGE_KEYS.results);
  const totals = new Map<string, number>();
  results.forEach((result) => {
    totals.set(result.userId, (totals.get(result.userId) ?? 0) + result.pointsEarned);
  });
  return Array.from(totals.entries())
    .map(([userId, points]) => ({
      userId,
      userName: userId === "me" ? "나" : userId,
      points,
      level: calculateLevel(points),
    }))
    .sort((a, b) => b.points - a.points);
}
