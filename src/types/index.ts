/**
 * Domain types — Challenge Gamification Model
 *
 * Points are a non-redeemable, app-internal gamification metric.
 * They cannot be converted to cash, gift cards, or any external asset.
 * A participant's reward depends only on their own progress — never on
 * other participants' outcomes (no zero-sum mechanics).
 */

export interface Challenge {
  id: string;
  title: string;
  challengeGoal: string; // e.g. "30-day running streak"
  targetDays: number;
  progress: number; // days completed, 0..targetDays
  streak: number; // current consecutive days
  badgesEarned: string[];
  createdAt: number;
  updatedAt: number;
}

export interface Participant {
  id: string;
  challengeId: string;
  userId: string;
  completionStatus: "completed" | "in-progress" | "failed";
  currentStreak: number;
  dailyProgress: Record<string, boolean>; // "YYYY-MM-DD" -> completed
  pointsEarned: number;
  badgesEarned: string[];
  createdAt: number;
  updatedAt: number;
}

/**
 * Points: Non-redeemable gamification metric
 * - Earned through challenge completion and streak achievements
 * - Cannot be converted to cash, gift cards, or external assets
 * - Visible only within the app for progression tracking
 */
export interface PointsSystem {
  userId: string;
  totalPoints: number;
  isRedeemable: false; // always false — points are internal only
  lastUpdated: number;
  history: PointsHistoryEntry[];
}

export interface PointsHistoryEntry {
  action: "earned" | "spent";
  amount: number;
  reason: string;
  timestamp: number;
}

export interface BadgeDefinition {
  id: string;
  name: string;
  description: string;
  icon: string;
  requiredPoints?: number;
  unlockedAt?: number;
}

export interface DailyProgress {
  date: string; // "YYYY-MM-DD"
  completed: boolean;
}

/** Input to the reward calculation — individual participant data only. */
export interface ChallengeInput {
  participantId: string;
  completed: boolean;
  streak: number;
  badgesEarned: string[];
}

export interface RewardOutput {
  pointsAwarded: number;
  badgesUnlocked: string[];
  isSuccessful: boolean;
}
