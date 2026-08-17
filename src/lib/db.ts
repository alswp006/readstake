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
    return raw ? (JSON.parse(raw) as T[]) : [];
  } catch {
    return [];
  }
}

function writeCollection<T>(storageKey: string, items: T[]): void {
  localStorage.setItem(storageKey, JSON.stringify(items));
}

export const challengeStore = {
  getAll(): Challenge[] {
    return readCollection<Challenge>(challengesSchema.storageKey);
  },
  getById(id: string): Challenge | undefined {
    return this.getAll().find((challenge) => challenge.id === id);
  },
  upsert(challenge: Challenge): void {
    const all = this.getAll();
    const index = all.findIndex((c) => c.id === challenge.id);
    if (index >= 0) {
      all[index] = challenge;
    } else {
      all.push(challenge);
    }
    writeCollection(challengesSchema.storageKey, all);
  },
};

export const participantStore = {
  getAll(): Participant[] {
    return readCollection<Participant>(participantsSchema.storageKey);
  },
  getByChallengeId(challengeId: string): Participant[] {
    return this.getAll().filter((p) => p.challengeId === challengeId);
  },
  upsert(participant: Participant): void {
    const all = this.getAll();
    const index = all.findIndex((p) => p.id === participant.id);
    if (index >= 0) {
      all[index] = participant;
    } else {
      all.push(participant);
    }
    writeCollection(participantsSchema.storageKey, all);
  },
};

export const pointsSystemStore = {
  get(userId: string): PointsSystem | undefined {
    return readCollection<PointsSystem>(pointsSystemSchema.storageKey).find(
      (p) => p.userId === userId
    );
  },
  upsert(system: PointsSystem): void {
    const all = readCollection<PointsSystem>(pointsSystemSchema.storageKey);
    const index = all.findIndex((p) => p.userId === system.userId);
    if (index >= 0) {
      all[index] = system;
    } else {
      all.push(system);
    }
    writeCollection(pointsSystemSchema.storageKey, all);
  },
};

export const badgeStore = {
  getAll(): BadgeDefinition[] {
    return readCollection<BadgeDefinition>(badgesSchema.storageKey);
  },
  seed(badges: BadgeDefinition[]): void {
    writeCollection(badgesSchema.storageKey, badges);
  },
};
