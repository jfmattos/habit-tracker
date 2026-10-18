// Scheduled local notifications only exist on iOS and Android; on web reminders are a no-op
// so expo-notifications isn't loaded in the browser at all.

export const remindersSupported = false;

export async function requestReminderPermission() {
  return false;
}

export function syncReminders() {}

export async function sendTestReminder() {
  return false;
}
