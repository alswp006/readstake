import { describe, it, expect } from "vitest";
import { calcProgress, calcStreak, earnedBadges } from "../lib/rewards";
import type { DailyLog, Goal, UserStats } from "../types";

const goal: Goal = { id: "daily-reading", title: "매일 읽기", dailyTargetPages: 20 };

describe("calcProgress", () => {
  it("returns 0 percent and 0 totalDays for no logs", () => {
    expect(calcProgress([], goal)).toEqual({ percent: 0, totalDays: 0 });
  });

  it("computes percent of days that met the daily target", () => {
    const logs: DailyLog[] = [
      { date: "2026-08-14", pagesRead: 20, completed: true },
      { date: "2026-08-15", pagesRead: 10, completed: false },
      { date: "2026-08-16", pagesRead: 25, completed: true },
      { date: "2026-08-17", pagesRead: 5, completed: false },
    ];
    expect(calcProgress(logs, goal)).toEqual({ percent: 50, totalDays: 4 });
  });
});

describe("calcStreak", () => {
  it("returns zero streak for no logs", () => {
    expect(calcStreak([], "2026-08-17")).toEqual({ current: 0, best: 0, lastCheckedDate: null });
  });

  it("counts consecutive completed days as the current streak", () => {
    const logs: DailyLog[] = [
      { date: "2026-08-14", pagesRead: 20, completed: true },
      { date: "2026-08-15", pagesRead: 20, completed: true },
      { date: "2026-08-16", pagesRead: 20, completed: true },
    ];
    expect(calcStreak(logs, "2026-08-16")).toEqual({ current: 3, best: 3, lastCheckedDate: "2026-08-16" });
  });

  it("resets the current streak to 0 when the last completed day was missed", () => {
    const logs: DailyLog[] = [
      { date: "2026-08-10", pagesRead: 20, completed: true },
      { date: "2026-08-11", pagesRead: 20, completed: true },
    ];
    expect(calcStreak(logs, "2026-08-17")).toEqual({ current: 0, best: 2, lastCheckedDate: "2026-08-11" });
  });

  it("ignores days that did not meet the target", () => {
    const logs: DailyLog[] = [
      { date: "2026-08-15", pagesRead: 20, completed: true },
      { date: "2026-08-16", pagesRead: 5, completed: false },
      { date: "2026-08-17", pagesRead: 20, completed: true },
    ];
    expect(calcStreak(logs, "2026-08-17")).toEqual({ current: 1, best: 1, lastCheckedDate: "2026-08-17" });
  });
});

describe("earnedBadges", () => {
  it("returns no badges when thresholds are not met", () => {
    const stats: UserStats = {
      xp: 10,
      level: 1,
      streak: { current: 1, best: 1, lastCheckedDate: "2026-08-17" },
      badges: [],
    };
    expect(earnedBadges(stats)).toEqual([]);
  });

  it("awards the streak badge once the best streak reaches the threshold", () => {
    const stats: UserStats = {
      xp: 10,
      level: 1,
      streak: { current: 7, best: 7, lastCheckedDate: "2026-08-17" },
      badges: [],
    };
    const badges = earnedBadges(stats);
    expect(badges.map((badge) => badge.id)).toContain("streak-week");
  });

  it("awards the xp badge once accumulated xp reaches the threshold", () => {
    const stats: UserStats = {
      xp: 500,
      level: 4,
      streak: { current: 0, best: 0, lastCheckedDate: null },
      badges: [],
    };
    const badges = earnedBadges(stats);
    expect(badges.map((badge) => badge.id)).toContain("xp-milestone");
  });
});
