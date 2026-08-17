import type { Challenge, ChallengeInput, RewardOutput } from "@/types";
import { addBadge } from "@/lib/points";
import { challengeStore } from "@/lib/db";

/**
 * Calculates the reward for a single participant.
 *
 * Pure function: the output depends only on this participant's own
 * completion status, streak, and badges — never on any other
 * participant's result. There is no shared pool, no redistribution,
 * and no dependency on how many other people succeeded or failed.
 */
export function calculateChallengeReward(input: ChallengeInput): RewardOutput {
  const pointsAwarded = input.completed ? 100 + input.streak * 10 : 0;

  let badgesUnlocked = [...input.badgesEarned];
  if (input.streak >= 7) {
    badgesUnlocked = addBadge(badgesUnlocked, "week-warrior");
  }
  if (input.completed && input.streak >= 30) {
    badgesUnlocked = addBadge(badgesUnlocked, "legendary");
  }

  return {
    pointsAwarded,
    badgesUnlocked,
    isSuccessful: input.completed,
  };
}

export function updateProgress(
  challenge: Challenge,
  daysCompleted: number,
  currentStreak: number
): Challenge {
  return {
    ...challenge,
    progress: Math.min(daysCompleted, challenge.targetDays),
    streak: currentStreak,
    updatedAt: Date.now(),
  };
}

export function awardBadge(challenge: Challenge, badgeId: string): Challenge {
  return {
    ...challenge,
    badgesEarned: addBadge(challenge.badgesEarned, badgeId),
    updatedAt: Date.now(),
  };
}

export function createChallenge(
  id: string,
  title: string,
  challengeGoal: string,
  targetDays: number
): Challenge {
  const now = Date.now();
  return {
    id,
    title,
    challengeGoal,
    targetDays,
    progress: 0,
    streak: 0,
    badgesEarned: [],
    createdAt: now,
    updatedAt: now,
  };
}

export const seedChallenges: Challenge[] = [
  createChallenge(
    "ch_morning_run",
    "아침 러닝 챌린지",
    "매일 아침 5km씩, 30일 동안 달려요",
    30
  ),
  createChallenge(
    "ch_meal_prep",
    "건강 식단 챌린지",
    "일주일에 5일, 60일 동안 건강한 식사를 준비해요",
    60
  ),
];

/**
 * Challenges live in localStorage so progress/streak survive between visits.
 * On first use the store is empty, so it's seeded from seedChallenges once.
 */
export function getStoredChallenges(): Challenge[] {
  const stored = challengeStore.getAll();
  if (stored.length > 0) {
    return stored;
  }
  seedChallenges.forEach((challenge) => challengeStore.upsert(challenge));
  return seedChallenges;
}
