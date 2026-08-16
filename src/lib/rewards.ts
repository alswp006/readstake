import type { DailyLog, Goal, Progress, Streak, Badge, UserStats } from "../types";
import { BADGE_DEFS } from "../constants";

export function calcProgress(logs: DailyLog[], goal: Goal): Progress {
  const totalDays = logs.length;
  if (totalDays === 0) return { percent: 0, totalDays: 0 };
  const completedDays = logs.filter((log) => log.pagesRead >= goal.dailyTargetPages).length;
  return { percent: Math.round((completedDays / totalDays) * 100), totalDays };
}

export function calcStreak(logs: DailyLog[], today: string): Streak {
  const oneDayMs = 24 * 60 * 60 * 1000;
  const completedDates = logs
    .filter((log) => log.completed)
    .map((log) => log.date)
    .sort();

  let current = 0;
  let best = 0;
  let lastCheckedDate: string | null = null;

  completedDates.forEach((date) => {
    const isConsecutiveDay =
      lastCheckedDate !== null &&
      Math.round((new Date(date).getTime() - new Date(lastCheckedDate).getTime()) / oneDayMs) === 1;
    current = isConsecutiveDay ? current + 1 : 1;
    best = Math.max(best, current);
    lastCheckedDate = date;
  });

  const missedSinceToday =
    lastCheckedDate !== null &&
    Math.round((new Date(today).getTime() - new Date(lastCheckedDate).getTime()) / oneDayMs) > 1;

  return { current: missedSinceToday ? 0 : current, best, lastCheckedDate };
}

export function earnedBadges(stats: UserStats): Badge[] {
  const achievedAt = stats.streak.lastCheckedDate ?? "";
  return BADGE_DEFS.filter((def) =>
    def.streakThreshold !== undefined
      ? stats.streak.best >= def.streakThreshold
      : def.xpThreshold !== undefined
        ? stats.xp >= def.xpThreshold
        : false
  ).map((def) => ({
    id: def.id,
    name: def.name,
    description: def.description,
    achievedAt,
  }));
}
