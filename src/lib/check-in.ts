import { todayKey } from '@/lib/dates';
import { feedback } from '@/lib/feedback';
import { countOn, isDone } from '@/lib/habit-logic';
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

/** Fires the reward for a logged change: sound + haptics, and a celebration for big moments */
function reward(habit: Habit, key: string, result: LogResult) {
  const habits = getHabits();
  const perfectDay =
    result.goalReached && key === todayKey() && habits.every((item) => isDone(item, key));

  if (result.wonChallenge) {
    celebrateChallenge(habit, result.wonChallenge);
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
