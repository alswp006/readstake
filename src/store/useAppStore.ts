import { useSyncExternalStore } from "react";
import type { Goal, DailyLog, UserStats, Badge } from "../types";
import { getGoals, saveGoalRecord, getLogs, saveLog } from "../lib/api";
import { calcStreak, earnedBadges } from "../lib/rewards";
import { LEVEL_XP_TABLE, XP_PER_CHECK } from "../constants";

type AppState = {
  goals: Goal[];
  logs: DailyLog[];
  stats: UserStats;
  loading: boolean;
  error: string | null;
};

function calcLevel(xp: number): number {
  let level = 1;
  LEVEL_XP_TABLE.forEach((threshold, index) => {
    if (xp >= threshold) level = index + 1;
  });
  return level;
}

function todayDate(): string {
  return new Date().toISOString().slice(0, 10);
}

let state: AppState = {
  goals: [],
  logs: [],
  stats: { xp: 0, level: 1, streak: { current: 0, best: 0, lastCheckedDate: null }, badges: [] },
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

async function loadGoals(): Promise<void> {
  setState({ loading: true, error: null });
  try {
    const [goals, logs] = await Promise.all([getGoals(), getLogs()]);
    const streak = calcStreak(logs, todayDate());
    const xp = logs.filter((log) => log.completed).length * XP_PER_CHECK;
    const stats: UserStats = { xp, level: calcLevel(xp), streak, badges: [] };
    setState({ goals, logs, stats: { ...stats, badges: earnedBadges(stats) }, loading: false });
  } catch {
    setState({ loading: false, error: "목표를 불러오지 못했어요" });
  }
}

async function setGoal(goal: Goal): Promise<void> {
  setState({ loading: true, error: null });
  try {
    await saveGoalRecord(goal);
    setState({ goals: [goal], loading: false });
  } catch {
    setState({ loading: false, error: "목표 저장에 실패했어요" });
  }
}

async function checkToday(pagesRead: number): Promise<DailyLog> {
  setState({ loading: true, error: null });
  const goal = state.goals[0];
  const today = todayDate();
  const completed = goal ? pagesRead >= goal.dailyTargetPages : pagesRead > 0;
  const log: DailyLog = { date: today, pagesRead, completed };
  try {
    await saveLog(log);
    const logs = [...state.logs.filter((item) => item.date !== log.date), log];
    const streak = calcStreak(logs, today);
    const xp = state.stats.xp + (completed ? XP_PER_CHECK : 0);
    const nextStats: UserStats = { xp, level: calcLevel(xp), streak, badges: state.stats.badges };
    setState({ logs, stats: { ...nextStats, badges: earnedBadges(nextStats) }, loading: false });
    return log;
  } catch {
    setState({ loading: false, error: "기록 저장에 실패했어요" });
    return log;
  }
}

function resetStreakIfMissed(today: string): void {
  const streak = calcStreak(state.logs, today);
  setState({ stats: { ...state.stats, streak } });
}

function grantBadge(badge: Badge): void {
  if (state.stats.badges.some((existing) => existing.id === badge.id)) return;
  setState({ stats: { ...state.stats, badges: [...state.stats.badges, badge] } });
}

export function useAppStore() {
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  return {
    goals: snapshot.goals,
    logs: snapshot.logs,
    stats: snapshot.stats,
    loading: snapshot.loading,
    error: snapshot.error,
    loadGoals,
    setGoal,
    checkToday,
    resetStreakIfMissed,
    grantBadge,
  };
}
