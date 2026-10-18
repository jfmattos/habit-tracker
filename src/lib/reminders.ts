import * as Notifications from 'expo-notifications';

import { addDays, daysBetween, parseKey, todayKey } from '@/lib/dates';
import { isSatisfied } from '@/lib/goals';
import { challengeState, countOn } from '@/lib/habit-logic';
import { getHabits, type Habit } from '@/store/habits';
import { getSettings } from '@/store/settings';

// Native only: reminders.web.ts replaces this module in the browser

const DAYS_AHEAD = 7;

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export const remindersSupported = true;

export async function requestReminderPermission() {
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  const requested = await Notifications.requestPermissionsAsync({
    ios: { allowAlert: true, allowSound: true, allowBadge: false },
  });
  return requested.granted;
}

function habitNames(habits: Habit[], key: string, today: string) {
  const names = habits.slice(0, 3).map((habit) => {
    const name = habit.emoji ? `${habit.emoji} ${habit.name}` : habit.name;
    return key === today && habit.kind === 'count'
      ? `${name} (${countOn(habit, key)}/${habit.target})`
      : name;
  });
  const more = habits.length - names.length;
  return names.join(', ') + (more > 0 ? ` +${more} more` : '');
}

/** The habit whose challenge is running on `key`, with that day's number */
function challengeOn(habits: Habit[], key: string) {
  for (const habit of habits) {
    if (!habit.challenge || challengeState(habit)?.status !== 'active') continue;
    const day = daysBetween(habit.challenge.startKey, key) + 1;
    if (day >= 1 && day <= habit.challenge.length) return { habit, day };
  }
  return null;
}

function messages(habits: Habit[], key: string, today: string) {
  // Future days might be done by the time they fire, so only today's list is filtered
  const pending = key === today ? habits.filter((habit) => !isSatisfied(habit, key)) : habits;
  if (pending.length === 0) return null;

  const challenge = challengeOn(pending, key);
  const morning = challenge
    ? `Day ${challenge.day} of your ${challenge.habit.challenge?.length}-day ${challenge.habit.name} challenge. You've got this!`
    : `Today's intention: ${habitNames(pending, key, today)}. Check in when you're done.`;
  const evening = challenge
    ? `Keep your ${challenge.habit.name} challenge alive. Check in before midnight.`
    : `${habitNames(pending, key, today)}. Tap to check in.`;

  return {
    morning: { title: 'Good morning ☀️', body: morning },
    evening: {
      title: key === today ? "Don't forget your habits" : 'Did you show up today?',
      body: evening,
    },
  };
}

async function reschedule() {
  await Notifications.cancelAllScheduledNotificationsAsync();

  const settings = getSettings();
  const habits = getHabits();
  if (!settings.reminders || habits.length === 0) return;
  if (!(await Notifications.getPermissionsAsync()).granted) return;

  const now = Date.now();
  const today = todayKey();
  for (let offset = 0; offset < DAYS_AHEAD; offset++) {
    const key = addDays(today, offset);
    const content = messages(habits, key, today);
    if (!content) continue;

    for (const [slot, hour] of [
      ['morning', settings.morningHour],
      ['evening', settings.eveningHour],
    ] as const) {
      const date = parseKey(key);
      date.setHours(hour, 0, 0, 0);
      if (date.getTime() <= now) continue;
      await Notifications.scheduleNotificationAsync({
        content: content[slot],
        trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date },
      });
    }
  }
}

let queue = Promise.resolve();
let pending: ReturnType<typeof setTimeout> | undefined;

/** Rebuilds the next week of reminders from the current habits and settings (debounced) */
export function syncReminders() {
  clearTimeout(pending);
  pending = setTimeout(() => {
    queue = queue.then(reschedule).catch(() => {});
  }, 500);
}

export async function sendTestReminder() {
  if (!(await requestReminderPermission())) return false;
  await Notifications.scheduleNotificationAsync({
    content: { title: 'Habit check-in 👋', body: 'This is what your reminders will look like.' },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: 5 },
  });
  return true;
}
