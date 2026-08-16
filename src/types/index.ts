export type Goal = {
  id: string;
  title: string;
  dailyTargetPages: number;
};

export type DailyLog = {
  date: string;
  pagesRead: number;
  completed: boolean;
};

export type Progress = {
  percent: number;
  totalDays: number;
};

export type Streak = {
  current: number;
  best: number;
  lastCheckedDate: string | null;
};

export type Badge = {
  id: string;
  name: string;
  description: string;
  achievedAt: string;
};

export type UserStats = {
  xp: number;
  level: number;
  streak: Streak;
  badges: Badge[];
};
