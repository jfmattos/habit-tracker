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
};

const DEFAULTS: Settings = {
  onboarded: false,
  reminders: false,
  morningHour: 9,
  eveningHour: 20,
  sound: true,
  haptics: true,
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
