/**
 * Storage schema definitions.
 *
 * This app persists data in localStorage (no server database). Each
 * table below describes the shape of a stored collection and its
 * localStorage key. No column here represents money — challenges are
 * goal definitions, participants track progress, and points/badges
 * are non-redeemable gamification state.
 */

export interface TableSchema {
  tableName: string;
  storageKey: string;
  columns: Record<string, string>;
}

export const challengesSchema: TableSchema = {
  tableName: "challenges",
  storageKey: "rs_challenges_v1",
  columns: {
    id: "string",
    title: "string",
    challengeGoal: "string",
    targetDays: "number",
    progress: "number",
    streak: "number",
    badgesEarned: "string[]",
    createdAt: "number",
    updatedAt: "number",
  },
};

export const participantsSchema: TableSchema = {
  tableName: "participants",
  storageKey: "rs_participants_v1",
  columns: {
    id: "string",
    challengeId: "string",
    userId: "string",
    completionStatus: "string",
    currentStreak: "number",
    dailyProgress: "json",
    pointsEarned: "number",
    badgesEarned: "string[]",
    createdAt: "number",
    updatedAt: "number",
  },
};

export const pointsSystemSchema: TableSchema = {
  tableName: "points_system",
  storageKey: "rs_points_system_v1",
  columns: {
    userId: "string",
    totalPoints: "number",
    isRedeemable: "boolean",
    lastUpdated: "number",
    history: "json",
  },
};

export const badgesSchema: TableSchema = {
  tableName: "badges",
  storageKey: "rs_badges_v1",
  columns: {
    id: "string",
    name: "string",
    description: "string",
    icon: "string",
    requiredPoints: "number",
  },
};

export const allSchemas: TableSchema[] = [
  challengesSchema,
  participantsSchema,
  pointsSystemSchema,
  badgesSchema,
];
