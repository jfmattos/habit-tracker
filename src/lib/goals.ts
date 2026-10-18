import { addDays, parseKey, todayKey, weekStart } from '@/lib/dates';
import { countOn, isDone } from '@/lib/habit-logic';
import type { Goal, Habit } from '@/store/habits';

/** First and last day of the goal period containing `key` */
function periodRange(period: Goal['period'], key: string) {
  if (period === 'day') return { start: key, end: key };
  if (period === 'week') {
    const start = weekStart(key);
    return { start, end: addDays(start, 6) };
  }
  const date = parseKey(key);
  const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  return { start: `${key.slice(0, 8)}01`, end: `${key.slice(0, 8)}${String(lastDay).padStart(2, '0')}` };
}

/** Progress toward the goal in the period containing `key`, counting days up to today */
export function goalProgress(habit: Habit, key = todayKey()) {
  const { period, target } = habit.goal;
  if (period === 'day') {
    const done = countOn(habit, key);
    return { done, target, met: done >= target };
  }
  const { start, end } = periodRange(period, key);
  const today = todayKey();
  let done = 0;
  for (let day = start; day <= end && day <= today; day = addDays(day, 1)) {
    if (isDone(habit, day)) done++;
  }
  return { done, target, met: done >= target };
}

/** How many times the goal has been met: days for daily goals, weeks or months otherwise */
export function goalsMet(habit: Habit) {
  const doneKeys = Object.keys(habit.log).filter((key) => isDone(habit, key));
  if (habit.goal.period === 'day') return doneKeys.length;

  const perPeriod = new Map<string, number>();
  for (const key of doneKeys) {
    const { start } = periodRange(habit.goal.period, key);
    perPeriod.set(start, (perPeriod.get(start) ?? 0) + 1);
  }
  return [...perPeriod.values()].filter((count) => count >= habit.goal.target).length;
}

/**
 * Whether a habit needs nothing more on `key`: done that day, or the weekly/monthly goal of
 * that period is met. A met week or month covers all of its days, since skipping days is what
 * those goals allow. Used for "done today", perfect days and reminders.
 */
export function isSatisfied(habit: Habit, key: string) {
  return isDone(habit, key) || (habit.goal.period !== 'day' && goalProgress(habit, key).met);
}

export function goalLabel(goal: Goal) {
  if (goal.period === 'day') return goal.target === 1 ? 'Every day' : `${goal.target}× a day`;
  return `${goal.target}× a ${goal.period}`;
}

export function periodLabel(period: Goal['period']) {
  return period === 'day' ? 'today' : `this ${period}`;
}
