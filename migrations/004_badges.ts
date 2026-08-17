/**
 * Migration 004 — badges table
 *
 * Achievement catalog. Badges carry no cash value or wallet credit.
 */
export const migration004Badges = {
  version: 4,
  tableName: "badges",
  columns: {
    id: "TEXT PRIMARY KEY",
    name: "TEXT",
    description: "TEXT",
    icon: "TEXT",
    requiredPoints: "INTEGER",
  },
};
