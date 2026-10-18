import { router } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { Burst } from '@/components/burst';
import { ChallengeTrack } from '@/components/challenge-track';
import { HabitBadge } from '@/components/habit-badge';
import { MonthGrid } from '@/components/month-grid';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { cycleDay, logOnce, undoOnce } from '@/lib/check-in';
import { currentMonth, todayKey } from '@/lib/dates';
import { goalProgress, periodLabel } from '@/lib/goals';
import { challengeState, countOn } from '@/lib/habit-logic';
import { currentStreak, doneDaysInMonth } from '@/lib/stats';
import { startChallenge, type Habit, type LogResult } from '@/store/habits';

export function HabitCard({ habit }: { habit: Habit }) {
  const theme = useTheme();
  const [burst, setBurst] = useState(0);
  const scale = useSharedValue(1);
  const buttonStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.get() }] }));

  const today = todayKey();
  const count = countOn(habit, today);
  const done = count >= habit.target;
  const streak = currentStreak(habit);
  const challenge = challengeState(habit);
  const goal = goalProgress(habit);

  function celebrateIfDone(result: LogResult) {
    if (result.goalReached) {
      setBurst((value) => value + 1);
      scale.set(withSequence(withTiming(1.15, { duration: 110 }), withSpring(1, { damping: 8 })));
    } else if (result.progressed) {
      scale.set(withSequence(withTiming(1.06, { duration: 80 }), withSpring(1)));
    }
  }

  function checkIn() {
    // Once-a-day habits toggle; multi-check-in habits count up to their target
    celebrateIfDone(habit.kind === 'check' ? cycleDay(habit, today) : logOnce(habit, today));
  }

  const label =
    habit.kind === 'check'
      ? done
        ? 'Done today'
        : 'Check in'
      : done
        ? `Done ${count}/${habit.target}`
        : `+1   ${count}/${habit.target}`;

  return (
    <Pressable
      onPress={() => router.push({ pathname: '/habit/[id]', params: { id: habit.id } })}
      style={({ pressed }) => pressed && styles.pressed}>
      <ThemedView type="backgroundElement" style={styles.card}>
        <View style={styles.info}>
          <View style={styles.titleRow}>
            <HabitBadge habit={habit} />
            <ThemedText type="smallBold" numberOfLines={1} style={styles.name}>
              {habit.name}
            </ThemedText>
          </View>
          <ThemedText type="small" themeColor="textSecondary">
            {habit.goal.period !== 'day'
              ? `🎯 ${Math.min(goal.done, goal.target)}/${goal.target} ${periodLabel(habit.goal.period)}${goal.met ? ' ✓' : ''}`
              : streak > 1
                ? `🔥 ${streak}-day streak`
                : `${doneDaysInMonth(habit, currentMonth())} days this month`}
          </ThemedText>

          {challenge?.status === 'active' && (
            <View style={styles.challenge}>
              <ThemedText type="small" style={{ color: habit.color }}>
                🏁 Day {challenge.day} of {challenge.length}
              </ThemedText>
              <ChallengeTrack state={challenge} color={habit.color} />
            </View>
          )}
          {challenge?.status === 'failed' && (
            <Pressable
              onPress={() => startChallenge(habit.id, challenge.length)}
              hitSlop={6}
              style={({ pressed }) => pressed && styles.pressed}>
              <ThemedText type="small" themeColor="textSecondary">
                Challenge missed ·{' '}
                <ThemedText type="smallBold" style={{ color: habit.color }}>
                  Restart
                </ThemedText>
              </ThemedText>
            </Pressable>
          )}

          <View style={styles.buttonRow}>
          <View>
            <Burst color={habit.color} trigger={burst} />
            <Animated.View style={buttonStyle}>
              <Pressable
                onPress={checkIn}
                onLongPress={habit.kind === 'count' && count > 0 ? () => undoOnce(habit, today) : undefined}
                accessibilityLabel={label}
                accessibilityHint={habit.kind === 'count' ? 'Long press to undo one check-in' : undefined}
                style={({ pressed }) => [
                  styles.todayButton,
                  { backgroundColor: done ? habit.color : theme.backgroundSelected },
                  pressed && styles.pressed,
                ]}>
                {habit.kind === 'count' && !done && (
                  <View
                    style={[
                      styles.partial,
                      { width: `${(count / habit.target) * 100}%`, backgroundColor: `${habit.color}59` },
                    ]}
                  />
                )}
                {(habit.kind === 'check' || done) && (
                  <SymbolView
                    name={{ ios: 'checkmark', android: 'check', web: 'check' }}
                    size={14}
                    tintColor={done ? '#ffffff' : theme.textSecondary}
                  />
                )}
                <ThemedText type="smallBold" style={{ color: done ? '#ffffff' : theme.text }}>
                  {label}
                </ThemedText>
              </Pressable>
            </Animated.View>
          </View>
          {habit.kind === 'count' && count > 0 && (
            <Pressable
              onPress={() => undoOnce(habit, today)}
              accessibilityLabel="Remove one check-in"
              hitSlop={4}
              style={({ pressed }) => [
                styles.minusButton,
                { backgroundColor: theme.backgroundSelected },
                pressed && styles.pressed,
              ]}>
              <SymbolView
                name={{ ios: 'minus', android: 'remove', web: 'remove' }}
                size={14}
                tintColor={theme.text}
              />
            </Pressable>
          )}
          </View>
        </View>

        <View style={styles.grid}>
          <MonthGrid habit={habit} month={currentMonth()} />
        </View>
      </ThemedView>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    gap: Spacing.three,
    padding: Spacing.three,
    borderRadius: Spacing.four,
  },
  info: {
    flex: 1,
    gap: Spacing.one,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  name: {
    flexShrink: 1,
    fontSize: 17,
  },
  challenge: {
    gap: Spacing.one,
    maxWidth: 160,
  },
  buttonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: Spacing.two,
    marginTop: 'auto',
    paddingTop: Spacing.two,
  },
  minusButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  todayButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    borderRadius: Spacing.four,
    overflow: 'hidden',
  },
  partial: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
  },
  grid: {
    width: 133,
  },
  pressed: {
    opacity: 0.7,
  },
});
