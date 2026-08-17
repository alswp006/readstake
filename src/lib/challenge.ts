import type { Challenge, ChallengeInput, RewardOutput } from "@/types";
import { addBadge } from "@/lib/points";

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
    "Morning Runner",
    "Run 5km every morning for 30 days",
    30
  ),
  createChallenge(
    "ch_meal_prep",
    "Meal Prep Master",
    "Prep healthy meals 5 days a week for 60 days",
    60
  ),
];
