import { addDays, dateKey, parseKey, todayKey, type Month } from '@/lib/dates';
import { isDone } from '@/lib/habit-logic';
import type { Habit } from '@/store/habits';

export function doneDaysInMonth(habit: Habit, { year, month }: Month) {
  const prefix = `${year}-${String(month + 1).padStart(2, '0')}-`;
  return Object.keys(habit.log).filter((key) => key.startsWith(prefix) && isDone(habit, key))
    .length;
}

/** Consecutive done days up to today; a streak is still alive if today isn't done yet */
export function currentStreak(habit: Habit) {
  let key = todayKey();
  if (!isDone(habit, key)) key = addDays(key, -1);
  let streak = 0;
  while (isDone(habit, key)) {
    streak++;
    key = addDays(key, -1);
  }
  return streak;
}

export function bestStreak(habit: Habit) {
  const doneKeys = Object.keys(habit.log)
    .filter((key) => isDone(habit, key))
    .sort();
  let best = 0;
  let run = 0;
  doneKeys.forEach((key, index) => {
    run = index > 0 && addDays(doneKeys[index - 1], 1) === key ? run + 1 : 1;
    best = Math.max(best, run);
  });
  return best;
}

/** Done days per week (Sunday to Saturday) for the last `weeks` weeks, oldest first */
export function weeklyDone(habit: Habit, weeks: number) {
  const today = todayKey();
  const thisWeek = addDays(today, -parseKey(today).getDay());
  return Array.from({ length: weeks }, (_, index) => {
    const start = addDays(thisWeek, -7 * (weeks - 1 - index));
    let done = 0;
    for (let day = 0; day < 7; day++) {
      const key = addDays(start, day);
      if (key <= today && isDone(habit, key)) done++;
    }
    return { start, done };
  });
}

/** The first day a habit counts: when it was created, or its earliest back-filled check-in */
export function firstKey(habit: Habit) {
  return [dateKey(new Date(habit.createdAt)), ...Object.keys(habit.log)].sort()[0];
}

/** A habit's consistency over the last `days` days, only counting days since it existed */
export function habitPeriod(habit: Habit, days: number) {
  const today = todayKey();
  const first = firstKey(habit);
  const keys = Array.from({ length: days }, (_, index) => addDays(today, index - (days - 1)));
  const tracked = keys.filter((key) => key >= first);
  const doneDays = tracked.filter((key) => isDone(habit, key)).length;

  return {
    trackedDays: tracked.length,
    doneDays,
    rate: tracked.length ? doneDays / tracked.length : 0,
    checkIns: tracked.reduce((sum, key) => sum + (habit.log[key] ?? 0), 0),
    /** Daily fraction of the target, oldest first; null before the habit existed */
    bars: keys.map((key) => (key < first ? null : Math.min(1, (habit.log[key] ?? 0) / habit.target))),
  };
}

/** Share of habits done each day for the last `days` days, oldest first; null before any habit existed */
export function dailyRates(habits: Habit[], days: number) {
  const today = todayKey();
  return Array.from({ length: days }, (_, index) => {
    const key = addDays(today, index - (days - 1));
    const existing = habits.filter((habit) => firstKey(habit) <= key);
    const rate: number | null = existing.length
      ? existing.filter((habit) => isDone(habit, key)).length / existing.length
      : null;
    return { key, rate };
  });
}

export function perfectDays(habits: Habit[]) {
  if (habits.length === 0) return 0;
  const today = todayKey();
  const start = habits.map(firstKey).sort()[0];
  let count = 0;
  for (let key = start; key <= today; key = addDays(key, 1)) {
    const existing = habits.filter((habit) => firstKey(habit) <= key);
    if (existing.length && existing.every((habit) => isDone(habit, key))) count++;
  }
  return count;
}

export function totalCheckIns(habits: Habit[]) {
  return habits.reduce(
    (sum, habit) => sum + Object.values(habit.log).reduce((total, count) => total + count, 0),
    0
  );
}
