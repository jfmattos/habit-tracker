import { todayKey } from '@/lib/dates';
import { feedback } from '@/lib/feedback';
import { goalProgress, isSatisfied } from '@/lib/goals';
import { countOn } from '@/lib/habit-logic';
import { celebrate } from '@/store/celebration';
import { getHabits, setCount, type Habit, type LogResult } from '@/store/habits';

export function celebrateChallenge(habit: Habit, length: number) {
  feedback.win();
  celebrate({
    kind: 'challenge',
    habitId: habit.id,
    name: habit.name,
    emoji: habit.emoji,
    color: habit.color,
    length,
  });
}

/**
 * Fires the reward for a logged change: sound + haptics, and a celebration for big moments.
 * Priority: challenge won > weekly/monthly goal met > perfect day > daily goal > progress.
 */
function reward(habit: Habit, key: string, result: LogResult) {
  const habits = getHabits();
  const updated = habits.find((item) => item.id === habit.id) ?? habit;
  const { period, target } = updated.goal;
  // The check-in that brings a week or month to exactly its target is the one that met it
  const periodGoalMet =
    result.goalReached && period !== 'day' && goalProgress(updated, key).done === target;
  const perfectDay =
    result.goalReached && key === todayKey() && habits.every((item) => isSatisfied(item, key));

  if (result.wonChallenge) {
    celebrateChallenge(habit, result.wonChallenge);
  } else if (periodGoalMet) {
    feedback.win();
    celebrate({
      kind: 'goal',
      name: habit.name,
      emoji: habit.emoji,
      color: habit.color,
      period,
      target,
    });
  } else if (perfectDay) {
    feedback.win();
    celebrate({ kind: 'perfect-day', count: habits.length });
  } else if (result.goalReached) {
    feedback.goal();
  } else if (result.progressed) {
    feedback.progress();
  } else if (result.undone) {
    feedback.undo();
  }
  return result;
}

/** One more check-in, capped at the daily target */
export function logOnce(habit: Habit, key = todayKey()) {
  return reward(habit, key, setCount(habit.id, key, countOn(habit, key) + 1));
}

export function undoOnce(habit: Habit, key = todayKey()) {
  return reward(habit, key, setCount(habit.id, key, countOn(habit, key) - 1));
}

/** For calendar taps: steps a day through 0..target and back to 0 (a toggle for once-a-day habits) */
export function cycleDay(habit: Habit, key: string) {
  const count = countOn(habit, key);
  return reward(habit, key, setCount(habit.id, key, count >= habit.target ? 0 : count + 1));
}
