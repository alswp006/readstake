import type {
  BadgeDefinition,
  DailyProgress,
  PointsHistoryEntry,
  PointsSystem,
} from "@/types";

/**
 * Points are a non-redeemable, app-internal gamification metric.
 * There is no function anywhere in this codebase that converts points
 * to cash, gift cards, or any other external asset — that pathway does
 * not exist by design.
 */
export const POINTS_ARE_NON_REDEEMABLE = true as const;

export function createPointsSystem(userId: string): PointsSystem {
  return {
    userId,
    totalPoints: 0,
    isRedeemable: false,
    lastUpdated: Date.now(),
    history: [],
  };
}

export function awardPoints(
  system: PointsSystem,
  amount: number,
  reason: string
): PointsSystem {
  const entry: PointsHistoryEntry = {
    action: "earned",
    amount,
    reason,
    timestamp: Date.now(),
  };

  return {
    ...system,
    totalPoints: system.totalPoints + amount,
    lastUpdated: entry.timestamp,
    history: [...system.history, entry],
  };
}

export function calculateCurrentStreak(history: DailyProgress[]): number {
  const sorted = [...history].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  let streak = 0;
  for (const entry of sorted) {
    if (entry.completed) {
      streak++;
    } else {
      break;
    }
  }
  return streak;
}

export function calculateProgress(
  completed: number,
  target: number
): { percentage: number; daysRemaining: number } {
  return {
    percentage: Math.round((completed / target) * 100),
    daysRemaining: Math.max(0, target - completed),
  };
}

export function addBadge(
  badgesEarned: string[],
  badgeId: string
): string[] {
  if (badgesEarned.includes(badgeId)) {
    return badgesEarned;
  }
  return [...badgesEarned, badgeId];
}

export function hasBadge(badgesEarned: string[], badgeId: string): boolean {
  return badgesEarned.includes(badgeId);
}

export const badgeCatalog: BadgeDefinition[] = [
  {
    id: "first-join",
    name: "첫 참여",
    description: "챌린지에 처음 참여했어요",
    icon: "🎯",
  },
  {
    id: "week-warrior",
    name: "일주일 개근",
    description: "7일 연속 기록을 달성했어요",
    icon: "⚡",
  },
  {
    id: "consistency-king",
    name: "꾸준왕",
    description: "5일 연속으로 진행 상황을 기록했어요",
    icon: "👑",
  },
  {
    id: "legendary",
    name: "전설의 기록",
    description: "30일 연속 기록을 달성했어요",
    icon: "🏆",
  },
];
