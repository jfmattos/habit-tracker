import { createPersistentStore } from './create-store';

export type Settings = {
  onboarded: boolean;
  reminders: boolean;
  /** Hour (0-23) of the morning check-in notification */
  morningHour: number;
  /** Hour (0-23) of the evening nudge for habits not done yet */
  eveningHour: number;
  sound: boolean;
  haptics: boolean;
  /** Emojis typed from the keyboard, most recent first, offered first in the emoji picker */
  customEmojis: string[];
};

const MAX_CUSTOM_EMOJIS = 12;

const DEFAULTS: Settings = {
  onboarded: false,
  reminders: false,
  morningHour: 9,
  eveningHour: 20,
  sound: true,
  haptics: true,
  customEmojis: [],
};

const store = createPersistentStore<Settings>('settings', DEFAULTS, (raw) => ({
  ...DEFAULTS,
  ...(raw as Partial<Settings>),
}));

export const getSettings = store.get;
export const subscribeSettings = store.subscribe;

export function useSettings() {
  return store.useValue();
}

export function updateSettings(patch: Partial<Settings>) {
  store.set({ ...store.get(), ...patch });
}

export function rememberEmoji(emoji: string) {
  const { customEmojis } = store.get();
  updateSettings({
    customEmojis: [emoji, ...customEmojis.filter((item) => item !== emoji)].slice(0, MAX_CUSTOM_EMOJIS),
  });
}
