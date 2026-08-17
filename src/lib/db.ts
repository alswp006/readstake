import type { BadgeDefinition, Challenge, Participant, PointsSystem } from "@/types";
import {
  badgesSchema,
  challengesSchema,
  participantsSchema,
  pointsSystemSchema,
} from "@/lib/schema";

function readCollection<T>(storageKey: string): T[] {
  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as T[]) : [];
  } catch {
    return [];
  }
}

/** Returns false (instead of throwing) when storage is unavailable or full — callers surface this to the user. */
function writeCollection<T>(storageKey: string, items: T[]): boolean {
  try {
    localStorage.setItem(storageKey, JSON.stringify(items));
    return true;
  } catch {
    return false;
  }
}

export const challengeStore = {
  getAll(): Challenge[] {
    return readCollection<Challenge>(challengesSchema.storageKey);
  },
  getById(id: string): Challenge | undefined {
    return this.getAll().find((challenge) => challenge.id === id);
  },
  upsert(challenge: Challenge): boolean {
    const all = this.getAll();
    const index = all.findIndex((c) => c.id === challenge.id);
    if (index >= 0) {
      all[index] = challenge;
    } else {
      all.push(challenge);
    }
    return writeCollection(challengesSchema.storageKey, all);
  },
};

export const participantStore = {
  getAll(): Participant[] {
    return readCollection<Participant>(participantsSchema.storageKey);
  },
  getByChallengeId(challengeId: string): Participant[] {
    return this.getAll().filter((p) => p.challengeId === challengeId);
  },
  upsert(participant: Participant): boolean {
    const all = this.getAll();
    const index = all.findIndex((p) => p.id === participant.id);
    if (index >= 0) {
      all[index] = participant;
    } else {
      all.push(participant);
    }
    return writeCollection(participantsSchema.storageKey, all);
  },
};

export const pointsSystemStore = {
  get(userId: string): PointsSystem | undefined {
    return readCollection<PointsSystem>(pointsSystemSchema.storageKey).find(
      (p) => p.userId === userId
    );
  },
  upsert(system: PointsSystem): boolean {
    const all = readCollection<PointsSystem>(pointsSystemSchema.storageKey);
    const index = all.findIndex((p) => p.userId === system.userId);
    if (index >= 0) {
      all[index] = system;
    } else {
      all.push(system);
    }
    return writeCollection(pointsSystemSchema.storageKey, all);
  },
};

export const badgeStore = {
  getAll(): BadgeDefinition[] {
    return readCollection<BadgeDefinition>(badgesSchema.storageKey);
  },
  seed(badges: BadgeDefinition[]): boolean {
    return writeCollection(badgesSchema.storageKey, badges);
  },
};
