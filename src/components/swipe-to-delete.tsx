import { SymbolView } from 'expo-symbols';
import { createContext, useContext, useRef, type ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import ReanimatedSwipeable, {
  type SwipeableMethods,
} from 'react-native-gesture-handler/ReanimatedSwipeable';

import { Spacing } from '@/constants/theme';
import { confirmDeleteHabit } from '@/lib/confirm-delete';
import { feedback } from '@/lib/feedback';
import type { Habit } from '@/store/habits';

const DELETE_RED = '#E5484D';
/** Taps right after a swipe are the end of the swipe, not a press on the card */
const TAP_GUARD_MS = 600;

const SwipeGuard = createContext<() => boolean>(() => false);

/** For buttons inside a swipeable card: true while a tap should be ignored */
export function useSwipeGuard() {
  return useContext(SwipeGuard);
}

/** Swipe a habit card to the left to reveal Delete; letting go asks for confirmation */
export function SwipeToDelete({ habit, children }: { habit: Habit; children: ReactNode }) {
  const swipeable = useRef<SwipeableMethods>(null);
  const lastDrag = useRef(0);
  const markDrag = () => {
    lastDrag.current = Date.now();
  };

  return (
    <SwipeGuard.Provider value={() => Date.now() - lastDrag.current < TAP_GUARD_MS}>
      <ReanimatedSwipeable
        ref={swipeable}
        friction={1.5}
        rightThreshold={72}
        overshootRight={false}
        renderRightActions={() => (
          <View style={styles.action}>
            <SymbolView
              name={{ ios: 'trash', android: 'delete', web: 'delete' }}
              size={22}
              tintColor="#ffffff"
            />
            <Text style={styles.actionText}>Delete</Text>
          </View>
        )}
        onSwipeableOpenStartDrag={markDrag}
        onSwipeableCloseStartDrag={markDrag}
        onSwipeableWillOpen={() => {
          markDrag();
          feedback.select();
        }}
        onSwipeableOpen={() => {
          markDrag();
          confirmDeleteHabit(habit, { onCancel: () => swipeable.current?.close() });
        }}
        onSwipeableClose={markDrag}>
        {children}
      </ReanimatedSwipeable>
    </SwipeGuard.Provider>
  );
}

const styles = StyleSheet.create({
  action: {
    width: 96,
    marginLeft: Spacing.two,
    borderRadius: Spacing.four,
    backgroundColor: DELETE_RED,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.one,
  },
  actionText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 700,
  },
});
