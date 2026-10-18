import { useEffect } from 'react';
import { Modal, Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { HabitColors } from '@/constants/habit-colors';
import { Spacing } from '@/constants/theme';
import { nextChallengeLength } from '@/lib/habit-logic';
import { dismissCelebration, useCelebration, type Celebration } from '@/store/celebration';
import { startChallenge, useHabit } from '@/store/habits';

const CONFETTI = 36;

/** Full-screen reward for big moments: a challenge won, or every habit done today */
export function CelebrationOverlay() {
  const celebration = useCelebration();
  if (!celebration) return null;

  return (
    <Modal transparent animationType="fade" visible onRequestClose={dismissCelebration}>
      <View style={styles.backdrop}>
        {Array.from({ length: CONFETTI }, (_, index) => (
          <ConfettiPiece
            key={index}
            index={index}
            color={
              celebration.kind === 'challenge' && index % 3 === 0
                ? celebration.color
                : HabitColors[index % HabitColors.length]
            }
          />
        ))}

        <ThemedView type="backgroundElement" style={styles.card}>
          {celebration.kind === 'challenge' ? (
            <ChallengeWon celebration={celebration} />
          ) : (
            <PerfectDay count={celebration.count} />
          )}
        </ThemedView>
      </View>
    </Modal>
  );
}

function ChallengeWon({ celebration }: { celebration: Extract<Celebration, { kind: 'challenge' }> }) {
  const habit = useHabit(celebration.habitId);
  const next = habit ? nextChallengeLength(habit) : null;

  function startNext() {
    if (habit && next) startChallenge(habit.id, next);
    dismissCelebration();
  }

  return (
    <>
      <PopIn symbol="🏆" />
      <ThemedText type="subtitle" style={styles.center}>
        {celebration.length}-day challenge complete!
      </ThemedText>
      <ThemedText themeColor="textSecondary" style={styles.center}>
        You showed up {celebration.length} days in a row for{' '}
        {celebration.emoji ? `${celebration.emoji} ` : ''}
        {celebration.name}. That&apos;s how habits are built.
      </ThemedText>
      {habit && (
        <ThemedText type="smallBold" style={[styles.center, { color: habit.color }]}>
          {habit.wins.map((length) => `🏆 ${length}`).join('   ')}
        </ThemedText>
      )}

      {next && (
        <Pressable
          onPress={startNext}
          style={({ pressed }) => [
            styles.primary,
            { backgroundColor: celebration.color },
            pressed && styles.pressed,
          ]}>
          <ThemedText type="smallBold" style={styles.primaryText}>
            Start {next}-day challenge
          </ThemedText>
        </Pressable>
      )}
      <Pressable onPress={dismissCelebration} hitSlop={8}>
        <ThemedText type="small" themeColor="textSecondary">
          Not now
        </ThemedText>
      </Pressable>
    </>
  );
}

function PerfectDay({ count }: { count: number }) {
  return (
    <>
      <PopIn symbol="🎉" />
      <ThemedText type="subtitle" style={styles.center}>
        Perfect day!
      </ThemedText>
      <ThemedText themeColor="textSecondary" style={styles.center}>
        {count === 1
          ? 'Your habit is done for today.'
          : `All ${count} habits done today.`}{' '}
        Come back tomorrow to keep it going.
      </ThemedText>
      <Pressable
        onPress={dismissCelebration}
        style={({ pressed }) => [styles.primary, styles.perfect, pressed && styles.pressed]}>
        <ThemedText type="smallBold" style={styles.primaryText}>
          Keep it up
        </ThemedText>
      </Pressable>
    </>
  );
}

function PopIn({ symbol }: { symbol: string }) {
  const scale = useSharedValue(0);
  useEffect(() => {
    scale.set(withDelay(150, withSpring(1, { damping: 7, stiffness: 120 })));
  }, [scale]);
  const style = useAnimatedStyle(() => ({ transform: [{ scale: scale.get() }] }));

  return <Animated.Text style={[styles.trophy, style]}>{symbol}</Animated.Text>;
}

function ConfettiPiece({ index, color }: { index: number; color: string }) {
  const { width, height } = useWindowDimensions();
  const fall = useSharedValue(0);

  // Deterministic spread so every piece gets its own lane, speed and spin
  const x = ((index * 37) % 100) / 100;
  const delay = (index * 53) % 600;
  const duration = 1800 + ((index * 71) % 1200);
  const spin = index % 2 === 0 ? 1 : -1;

  useEffect(() => {
    fall.set(withDelay(delay, withTiming(1, { duration, easing: Easing.in(Easing.quad) })));
  }, [fall, delay, duration]);

  const style = useAnimatedStyle(() => ({
    opacity: 1 - fall.get() * 0.3,
    transform: [
      { translateX: x * width + Math.sin(fall.get() * 6 + index) * 20 },
      { translateY: -40 + fall.get() * (height + 80) },
      { rotate: `${fall.get() * 720 * spin}deg` },
    ],
  }));

  return (
    <Animated.View
      pointerEvents="none"
      style={[styles.confetti, { backgroundColor: color }, index % 2 === 0 && styles.confettiRound, style]}
    />
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.four,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  card: {
    width: '100%',
    maxWidth: 380,
    alignItems: 'center',
    gap: Spacing.three,
    padding: Spacing.four,
    borderRadius: Spacing.four,
  },
  trophy: {
    fontSize: 72,
    lineHeight: 84,
  },
  center: {
    textAlign: 'center',
  },
  primary: {
    alignSelf: 'stretch',
    alignItems: 'center',
    paddingVertical: Spacing.three,
    borderRadius: Spacing.three,
  },
  perfect: {
    backgroundColor: '#30A46C',
  },
  primaryText: {
    color: '#ffffff',
    fontSize: 16,
  },
  confetti: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 8,
    height: 14,
    borderRadius: 2,
  },
  confettiRound: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  pressed: {
    opacity: 0.7,
  },
});
