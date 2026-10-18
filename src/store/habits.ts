import './install-storage';

import { useSyncExternalStore } from 'react';

import { dateKey, type Month } from '@/lib/dates';

export type Habit = {
  id: string;
  name: string;
  color: string;
  /** Completed days, keyed by YYYY-MM-DD */
  days: Record<string, true>;
  createdAt: string;
};

const STORAGE_KEY = 'habits';
const EMPTY: Habit[] = [];

let habits = load();
const listeners = new Set<() => void>();

function load(): Habit[] {
  try {
    const raw = globalThis.localStorage?.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : EMPTY;
  } catch {
    return EMPTY;
  }
}

function commit(next: Habit[]) {
  habits = next;
  globalThis.localStorage?.setItem(STORAGE_KEY, JSON.stringify(next));
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useHabits() {
  // Server snapshot is empty so static web rendering matches the first client render
  return useSyncExternalStore(
    subscribe,
    () => habits,
    () => EMPTY
  );
}

export function useHabit(id: string) {
  return useHabits().find((habit) => habit.id === id);
}

export function addHabit(name: string, color: string) {
  const habit: Habit = {
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    name,
    color,
    days: {},
    createdAt: new Date().toISOString(),
  };
  commit([...habits, habit]);
}

export function deleteHabit(id: string) {
  commit(habits.filter((habit) => habit.id !== id));
}

export function toggleDay(id: string, key: string) {
  commit(
    habits.map((habit) => {
      if (habit.id !== id) return habit;
      const days = { ...habit.days };
      if (days[key]) {
        delete days[key];
      } else {
        days[key] = true;
      }
      return { ...habit, days };
    })
  );
}

export function countInMonth(habit: Habit, { year, month }: Month) {
  const prefix = `${year}-${String(month + 1).padStart(2, '0')}-`;
  return Object.keys(habit.days).filter((key) => key.startsWith(prefix)).length;
}

/** Consecutive days up to today; a streak is still alive if today isn't checked yet */
export function currentStreak(habit: Habit) {
  const date = new Date();
  if (!habit.days[dateKey(date)]) {
    date.setDate(date.getDate() - 1);
  }
  let streak = 0;
  while (habit.days[dateKey(date)]) {
    streak++;
    date.setDate(date.getDate() - 1);
  }
  return streak;
}
