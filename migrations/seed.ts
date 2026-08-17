import type { BadgeDefinition } from "@/types";
import { seedChallenges } from "@/lib/challenge";

export { seedChallenges };

export const seedBadges: BadgeDefinition[] = [
  {
    id: "first-join",
    name: "First Join",
    description: "Join your first challenge",
    icon: "🎯",
  },
  {
    id: "week-warrior",
    name: "Week Warrior",
    description: "Complete a 7-day streak",
    icon: "⚡",
  },
  {
    id: "legendary",
    name: "Legendary",
    description: "Complete a 30-day streak",
    icon: "🏆",
  },
];
