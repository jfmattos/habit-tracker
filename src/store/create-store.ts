import './install-storage';

import { useSyncExternalStore } from 'react';

/** A tiny module-level store: no provider needed, components subscribe through useValue */
export function createStore<T>(initial: T) {
  let state = initial;
  const listeners = new Set<() => void>();

  const get = () => state;
  const subscribe = (listener: () => void) => {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  };

  return {
    get,
    subscribe,
    set(next: T) {
      state = next;
      listeners.forEach((listener) => listener());
    },
    useValue() {
      return useSyncExternalStore(subscribe, get, () => initial);
    },
  };
}

/** Same as createStore, but loads from and saves to localStorage under `key` */
export function createPersistentStore<T>(key: string, initial: T, migrate: (raw: unknown) => T) {
  const store = createStore(initial);

  try {
    const raw = globalThis.localStorage?.getItem(key);
    if (raw) store.set(migrate(JSON.parse(raw)));
  } catch {
    // Corrupt or unavailable storage: start from the initial value
  }

  return {
    ...store,
    set(next: T) {
      store.set(next);
      globalThis.localStorage?.setItem(key, JSON.stringify(next));
    },
  };
}
