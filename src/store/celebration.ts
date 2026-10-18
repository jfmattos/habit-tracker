import { createStore } from './create-store';

export type Celebration =
  | {
      kind: 'challenge';
      habitId: string;
      name: string;
      emoji: string;
      color: string;
      /** Length of the challenge just won */
      length: number;
    }
  | {
      kind: 'goal';
      name: string;
      emoji: string;
      color: string;
      period: 'week' | 'month';
      target: number;
    }
  | {
      kind: 'perfect-day';
      /** How many habits were completed */
      count: number;
    };

const store = createStore<Celebration | null>(null);

export function useCelebration() {
  return store.useValue();
}

export function celebrate(celebration: Celebration) {
  store.set(celebration);
}

export function dismissCelebration() {
  store.set(null);
}
