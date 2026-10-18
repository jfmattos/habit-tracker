import { addDays, daysBetween, todayKey } from '@/lib/dates';
import type { Habit } from '@/store/habits';

/** Challenge lengths, unlocked in order: winning one suggests the next */
export const ChallengeTiers = [3, 7, 14, 30];

/** Lengths offered when setting a challenge by hand */
export const ChallengeLengths = [3, 7, 14, 21, 30];

export function countOn(habit: Habit, key: string) {
  return habit.log[key] ?? 0;
}

export function isDone(habit: Habit, key: string) {
  return countOn(habit, key) >= habit.target;
}

export type ChallengeState = {
  length: number;
  /** 1-based day of the challenge that today falls on, capped at its length */
  day: number;
  /** One entry per challenge day: whether it's done (future days are false) */
  days: boolean[];
  status: 'active' | 'completed' | 'failed';
};

export function challengeState(habit: Habit, today = todayKey()): ChallengeState | null {
  if (!habit.challenge) return null;
  const { length, startKey } = habit.challenge;

  const days = Array.from({ length }, (_, index) => {
    const key = addDays(startKey, index);
    return key <= today && isDone(habit, key);
  });
  const missedPastDay = days.some((done, index) => !done && addDays(startKey, index) < today);

  return {
    length,
    day: Math.min(length, daysBetween(startKey, today) + 1),
    days,
    status: days.every(Boolean) ? 'completed' : missedPastDay ? 'failed' : 'active',
  };
}

export function nextChallengeLength(habit: Habit) {
  const best = Math.max(0, ...habit.wins);
  return ChallengeTiers.find((length) => length > best) ?? ChallengeTiers[ChallengeTiers.length - 1];
}
