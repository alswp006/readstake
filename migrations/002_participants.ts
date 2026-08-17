/**
 * Migration 002 — participants table
 *
 * Tracks an individual's own progress and gamification rewards.
 * A participant's row never references another participant's data.
 */
export const migration002Participants = {
  version: 2,
  tableName: "participants",
  columns: {
    id: "TEXT PRIMARY KEY",
    challengeId: "TEXT",
    userId: "TEXT",
    completionStatus: "TEXT",
    currentStreak: "INTEGER",
    dailyProgress: "TEXT", // JSON-encoded Record<string, boolean>
    pointsEarned: "INTEGER",
    badgesEarned: "TEXT", // JSON-encoded string[]
    createdAt: "INTEGER",
    updatedAt: "INTEGER",
  },
};
