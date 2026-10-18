import { todayKey } from '@/lib/dates';
import { challengeState } from '@/lib/habit-logic';

import { createPersistentStore } from './create-store';

/** 'check' habits are done once a day; 'count' habits need `target` check-ins a day */
export type HabitKind = 'check' | 'count';

export type Challenge = { length: number; startKey: string };

/**
 * What counts as meeting the habit's goal, and so earns a trophy:
 * 'day' = `target` check-ins in a day; 'week' / 'month' = `target` done days in a calendar
 * week (Monday to Sunday) or month.
 */
export type Goal = { period: 'day' | 'week' | 'month'; target: number };

/** Daily tracking follows from the goal: only a per-day goal above 1 needs several check-ins a day */
function trackingFor(goal: Goal): Pick<Habit, 'kind' | 'target'> {
  return goal.period === 'day' && goal.target > 1
    ? { kind: 'count', target: goal.target }
    : { kind: 'check', target: 1 };
}

export type Habit = {
  id: string;
  name: string;
  /** May be empty for habits created before emojis existed */
  emoji: string;
  color: string;
  /** Derived from `goal` (see trackingFor); kept for the daily check-in logic */
  kind: HabitKind;
  /** Check-ins needed for a day to count as done */
  target: number;
  goal: Goal;
  /** Check-ins per day, keyed by YYYY-MM-DD */
  log: Record<string, number>;
  challenge: Challenge | null;
  /** Lengths of the challenges won, in order */
  wins: number[];
  createdAt: string;
};

type StoredHabit = Partial<Habit> & Pick<Habit, 'id' | 'name' | 'color' | 'createdAt'> & {
  /** v1 format: completed days only */
  days?: Record<string, true>;
};

function migrate(raw: unknown): Habit[] {
  if (!Array.isArray(raw)) return [];
  return (raw as StoredHabit[]).map((habit) => ({
    id: habit.id,
    name: habit.name,
    emoji: habit.emoji ?? '',
    color: habit.color,
    kind: habit.kind ?? 'check',
    target: habit.target ?? 1,
    goal: habit.goal ?? { period: 'day', target: habit.target ?? 1 },
    log: habit.log ?? Object.fromEntries(Object.keys(habit.days ?? {}).map((key) => [key, 1])),
    challenge: habit.challenge ?? null,
    wins: habit.wins ?? [],
    createdAt: habit.createdAt,
  }));
}

const store = createPersistentStore<Habit[]>('habits', [], migrate);

export const getHabits = store.get;
export const subscribeHabits = store.subscribe;

export function useHabits() {
  return store.useValue();
}

export function useHabit(id: string) {
  return useHabits().find((habit) => habit.id === id);
}

function update(id: string, change: (habit: Habit) => Habit) {
  store.set(store.get().map((habit) => (habit.id === id ? change(habit) : habit)));
}

/** Moves a just-completed challenge into `wins`; returns the length won, if any */
function settle(habit: Habit): { habit: Habit; won: number | null } {
  if (!habit.challenge || challengeState(habit)?.status !== 'completed') {
    return { habit, won: null };
  }
  const won = habit.challenge.length;
  return { habit: { ...habit, challenge: null, wins: [...habit.wins, won] }, won };
}

export type HabitInput = Pick<Habit, 'name' | 'emoji' | 'color' | 'goal'> & {
  /** null for no challenge */
  challengeLength: number | null;
};

export function addHabit({ challengeLength, ...input }: HabitInput) {
  const habit: Habit = {
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    ...input,
    ...trackingFor(input.goal),
    log: {},
    challenge: challengeLength ? { length: challengeLength, startKey: todayKey() } : null,
    wins: [],
    createdAt: new Date().toISOString(),
  };
  store.set([...store.get(), habit]);
  return habit.id;
}

/** Returns the length of a challenge the edit completed (e.g. by shortening it), if any */
export function updateHabit(id: string, { challengeLength, ...input }: HabitInput) {
  const habit = store.get().find((item) => item.id === id);
  if (!habit) return null;

  // Changing the length of a running challenge keeps its progress; otherwise it starts today
  const running = challengeState(habit)?.status === 'active' ? habit.challenge : null;
  const challenge = challengeLength
    ? { length: challengeLength, startKey: running?.startKey ?? todayKey() }
    : null;

  const result = settle({ ...habit, ...input, ...trackingFor(input.goal), challenge });
  update(id, () => result.habit);
  return result.won;
}

export function deleteHabit(id: string) {
  store.set(store.get().filter((habit) => habit.id !== id));
}

export function startChallenge(id: string, length: number) {
  update(id, (habit) => ({ ...habit, challenge: { length, startKey: todayKey() } }));
}

export type LogResult = {
  progressed: boolean;
  undone: boolean;
  goalReached: boolean;
  /** Length of the challenge this check-in completed, if any */
  wonChallenge: number | null;
};

const UNCHANGED: LogResult = { progressed: false, undone: false, goalReached: false, wonChallenge: null };

export function setCount(id: string, key: string, count: number): LogResult {
  const habit = store.get().find((item) => item.id === id);
  if (!habit) return UNCHANGED;

  const before = habit.log[key] ?? 0;
  const after = Math.max(0, Math.min(habit.target, count));
  if (after === before) return UNCHANGED;

  const log = { ...habit.log };
  if (after === 0) {
    delete log[key];
  } else {
    log[key] = after;
  }

  const result = settle({ ...habit, log });
  update(id, () => result.habit);

  return {
    progressed: after > before,
    undone: after < before,
    goalReached: before < habit.target && after >= habit.target,
    wonChallenge: result.won,
  };
}
