/**
 * Migration 003 — points_system table
 *
 * Points are a non-redeemable, app-internal gamification metric.
 * isRedeemable is always stored as false; there is no column here
 * for a conversion rate, currency code, or external wallet id.
 */
export const migration003PointsSystem = {
  version: 3,
  tableName: "points_system",
  columns: {
    userId: "TEXT PRIMARY KEY",
    totalPoints: "INTEGER",
    isRedeemable: "BOOLEAN", // always false
    lastUpdated: "INTEGER",
    history: "TEXT", // JSON-encoded PointsHistoryEntry[]
  },
};
