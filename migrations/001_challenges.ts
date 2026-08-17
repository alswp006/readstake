/**
 * Migration 001 — challenges table
 *
 * Goal-based activity definitions. There is no pooled or shared
 * amount here — targetDays is a duration, not a currency value.
 */
export const migration001Challenges = {
  version: 1,
  tableName: "challenges",
  columns: {
    id: "TEXT PRIMARY KEY",
    title: "TEXT",
    challengeGoal: "TEXT",
    targetDays: "INTEGER",
    progress: "INTEGER",
    streak: "INTEGER",
    badgesEarned: "TEXT", // JSON-encoded string[]
    createdAt: "INTEGER",
    updatedAt: "INTEGER",
  },
};
