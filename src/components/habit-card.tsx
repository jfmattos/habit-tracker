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
import { useSwipeGuard } from '@/components/swipe-to-delete';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { cycleDay, logOnce, undoOnce } from '@/lib/check-in';
import { textOn } from '@/lib/colors';
import { currentMonth, todayKey } from '@/lib/dates';
import { goalLabel, goalProgress } from '@/lib/goals';
import { challengeState, countOn } from '@/lib/habit-logic';
import { currentStreak, doneDaysInMonth } from '@/lib/stats';
import { startChallenge, type Habit, type LogResult } from '@/store/habits';

export function HabitCard({ habit }: { habit: Habit }) {
  const theme = useTheme();
  const justSwiped = useSwipeGuard();
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
    if (justSwiped()) return;
    // Once-a-day habits toggle; multi-check-in habits count up to their target
    celebrateIfDone(habit.kind === 'check' ? cycleDay(habit, today) : logOnce(habit, today));
  }

  // Plain "once a day" needs no label; any other goal is shown under the name
  const hasGoal = !(habit.goal.period === 'day' && habit.goal.target === 1);
  const periodGoal = habit.goal.period !== 'day';

  return (
    <Pressable
      onPress={() => {
        if (!justSwiped()) router.push({ pathname: '/habit/[id]', params: { id: habit.id } });
      }}
      style={({ pressed }) => pressed && styles.pressed}>
      <ThemedView type="backgroundElement" style={styles.card}>
        <View style={styles.info}>
          <View style={styles.titleRow}>
            <HabitBadge habit={habit} />
            <ThemedText type="smallBold" numberOfLines={1} style={styles.name}>
              {habit.name}
            </ThemedText>
          </View>
          {hasGoal && (
            <ThemedText type="smallBold" numberOfLines={1} style={[styles.goal, { color: habit.color }]}>
              🎯 {goalLabel(habit.goal)}
              {periodGoal &&
                ` · ${Math.min(goal.done, goal.target)}/${goal.target}${goal.met ? ' ✓' : ''}`}
            </ThemedText>
          )}
          <ThemedText type="small" themeColor="textSecondary">
            {streak > 1
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

          <View style={styles.actions}>
            {habit.kind === 'count' ? (
              // − count +: the count sits between the buttons, so it never reads as a label
              <View style={styles.counter}>
                <Pressable
                  onPress={() => {
                    if (!justSwiped()) undoOnce(habit, today);
                  }}
                  disabled={count === 0}
                  accessibilityLabel="Remove one check-in"
                  hitSlop={4}
                  style={({ pressed }) => [
                    styles.roundButton,
                    { backgroundColor: theme.backgroundSelected },
                    count === 0 && styles.disabled,
                    pressed && styles.pressed,
                  ]}>
                  <SymbolView
                    name={{ ios: 'minus', android: 'remove', web: 'remove' }}
                    size={16}
                    tintColor={theme.text}
                  />
                </Pressable>
                <View style={styles.counterValue}>
                  <ThemedText style={[styles.counterNumber, { color: done ? habit.color : theme.text }]}>
                    {count}
                  </ThemedText>
                  <ThemedText type="small" themeColor="textSecondary">
                    /{habit.target}
                  </ThemedText>
                </View>
                <View>
                  <Burst color={habit.color} trigger={burst} />
                  <Animated.View style={buttonStyle}>
                    <Pressable
                      onPress={checkIn}
                      disabled={done}
                      accessibilityLabel={done ? 'Done for today' : 'Add one check-in'}
                      hitSlop={4}
                      style={({ pressed }) => [
                        styles.roundButton,
                        styles.plusButton,
                        { backgroundColor: habit.color },
                        pressed && styles.pressed,
                      ]}>
                      <SymbolView
                        name={
                          done
                            ? { ios: 'checkmark', android: 'check', web: 'check' }
                            : { ios: 'plus', android: 'add', web: 'add' }
                        }
                        size={18}
                        tintColor={textOn(habit.color)}
                      />
                    </Pressable>
                  </Animated.View>
                </View>
              </View>
            ) : (
              <View>
                <Burst color={habit.color} trigger={burst} />
                <Animated.View style={buttonStyle}>
                  <Pressable
                    onPress={checkIn}
                    accessibilityLabel={done ? 'Done today' : 'Check in'}
                    style={({ pressed }) => [
                      styles.todayButton,
                      { backgroundColor: done ? habit.color : theme.backgroundSelected },
                      pressed && styles.pressed,
                    ]}>
                    <SymbolView
                      name={{ ios: 'checkmark', android: 'check', web: 'check' }}
                      size={14}
                      tintColor={done ? textOn(habit.color) : theme.textSecondary}
                    />
                    <ThemedText type="smallBold" style={{ color: done ? textOn(habit.color) : theme.text }}>
                      {done ? 'Done today' : 'Check in'}
                    </ThemedText>
                  </Pressable>
                </Animated.View>
              </View>
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
  goal: {
    fontSize: 13,
  },
  actions: {
    flexDirection: 'row',
    alignSelf: 'flex-start',
    marginTop: 'auto',
    paddingTop: Spacing.two,
  },
  counter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  counterValue: {
    flexDirection: 'row',
    alignItems: 'baseline',
    minWidth: 40,
    justifyContent: 'center',
  },
  counterNumber: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: 700,
  },
  roundButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  plusButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  todayButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    borderRadius: Spacing.four,
  },
  disabled: {
    opacity: 0.35,
  },
  grid: {
    width: 133,
  },
  pressed: {
    opacity: 0.7,
  },
});
