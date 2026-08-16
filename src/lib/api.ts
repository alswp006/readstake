import type { Goal, DailyLog } from "../types";
import { STORAGE_KEYS } from "../constants";

function readList<T>(key: string): T[] {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T[]) : [];
  } catch {
    return [];
  }
}

function writeList<T>(key: string, list: T[]): void {
  try {
    localStorage.setItem(key, JSON.stringify(list));
  } catch {
    // localStorage 접근 불가 시 조용히 무시 (프라이버시 모드 등)
  }
}

export async function getGoals(): Promise<Goal[]> {
  return readList<Goal>(STORAGE_KEYS.goals);
}

export async function saveGoalRecord(goal: Goal): Promise<Goal> {
  writeList(STORAGE_KEYS.goals, [goal]);
  return goal;
}

export async function getLogs(): Promise<DailyLog[]> {
  return readList<DailyLog>(STORAGE_KEYS.logs);
}

export async function saveLog(log: DailyLog): Promise<DailyLog> {
  const logs = await getLogs();
  const next = [...logs.filter((item) => item.date !== log.date), log];
  writeList(STORAGE_KEYS.logs, next);
  return log;
}
