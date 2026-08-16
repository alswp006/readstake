import { useSyncExternalStore } from "react";
import type { User, Challenge, ChallengeResult } from "../lib/contract";
import { getChallenges, submitChallengeResult } from "../lib/api";
import { calculateLevel } from "../lib/rewards";
import { STORAGE_KEYS } from "../constants";

type AppState = {
  user: User | null;
  challenges: Challenge[];
  results: ChallengeResult[];
  loading: boolean;
  error: string | null;
};

function loadInitialUser(): User | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.user);
    return raw ? (JSON.parse(raw) as User) : null;
  } catch {
    return null;
  }
}

function persistUser(user: User): void {
  try {
    localStorage.setItem(STORAGE_KEYS.user, JSON.stringify(user));
  } catch {
    // localStorage 접근 불가 시 조용히 무시 (프라이버시 모드 등)
  }
}

let state: AppState = {
  user: loadInitialUser(),
  challenges: [],
  results: [],
  loading: false,
  error: null,
};

const listeners = new Set<() => void>();

function setState(partial: Partial<AppState>): void {
  state = { ...state, ...partial };
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot(): AppState {
  return state;
}

async function loadChallenges(): Promise<void> {
  setState({ loading: true, error: null });
  try {
    const challenges = await getChallenges();
    setState({ challenges, loading: false });
  } catch {
    setState({ loading: false, error: "챌린지를 불러오지 못했어요" });
  }
}

async function completeChallenge(challengeId: string): Promise<void> {
  setState({ loading: true, error: null });
  try {
    const result = await submitChallengeResult(challengeId);
    const results = [...state.results, result];
    const totalXp = results.reduce((sum, item) => sum + item.pointsEarned, 0);
    const user: User | null = state.user
      ? {
          ...state.user,
          points: totalXp,
          level: calculateLevel(totalXp),
          completedChallenges: state.user.completedChallenges + 1,
        }
      : null;
    if (user) persistUser(user);
    setState({ results, user, loading: false });
  } catch {
    setState({ loading: false, error: "완료 처리에 실패했어요" });
  }
}

function setUser(user: User): void {
  persistUser(user);
  setState({ user });
}

export function useAppStore() {
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  return {
    user: snapshot.user,
    challenges: snapshot.challenges,
    results: snapshot.results,
    loading: snapshot.loading,
    error: snapshot.error,
    completeChallenge,
    loadChallenges,
    setUser,
  };
}
