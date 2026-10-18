import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { BarChart } from '@/components/bar-chart';
import { ChallengeTrack } from '@/components/challenge-track';
import { Stepper } from '@/components/habit-fields';
import { IconButton } from '@/components/icon-button';
import { MonthGrid } from '@/components/month-grid';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { cycleDay, logOnce, undoOnce } from '@/lib/check-in';
import {
  addMonths,
  currentMonth,
  dayLabel,
  isSameMonth,
  monthLabel,
  parseKey,
  todayKey,
} from '@/lib/dates';
import { challengeState, countOn, nextChallengeLength } from '@/lib/habit-logic';
import { bestStreak, currentStreak, doneDaysInMonth, weeklyDone } from '@/lib/stats';
import { deleteHabit, startChallenge, useHabit, type Habit } from '@/store/habits';

const CHART_WEEKS = 12;

export default function HabitScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const habit = useHabit(id);

  if (!habit) {
    return (
      <ThemedView style={styles.notFound}>
        <Stack.Title>Habit</Stack.Title>
        <ThemedText themeColor="textSecondary">This habit no longer exists.</ThemedText>
      </ThemedView>
    );
  }

  return <HabitDetail habit={habit} />;
}

function HabitDetail({ habit }: { habit: Habit }) {
  const theme = useTheme();
  const [month, setMonth] = useState(currentMonth);
  // Multi-check-in habits edit one selected day with − / +; once-a-day habits toggle on tap
  const [selectedDay, setSelectedDay] = useState(todayKey);
  const selectedCount = countOn(habit, selectedDay);
  const isCurrentMonth = isSameMonth(month, currentMonth());
  const weeks = weeklyDone(habit, CHART_WEEKS);

  function confirmDelete() {
    const remove = () => {
      deleteHabit(habit.id);
      router.back();
    };
    const message = `Delete "${habit.name}" and all of its history?`;
    if (Platform.OS === 'web') {
      if (window.confirm(message)) remove();
      return;
    }
    Alert.alert('Delete habit', message, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: remove },
    ]);
  }

  return (
    <ScrollView
      style={{ backgroundColor: theme.background }}
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={styles.content}>
      <Stack.Title>{habit.emoji ? `${habit.emoji} ${habit.name}` : habit.name}</Stack.Title>
      <Stack.Screen
        options={{
          headerRight: () => (
            <IconButton
              icon={{ ios: 'pencil', android: 'edit', web: 'edit' }}
              label="Edit habit"
              onPress={() => router.push({ pathname: '/habit-form', params: { id: habit.id } })}
            />
          ),
        }}
      />

      <ChallengePanel habit={habit} />

      <ThemedView type="backgroundElement" style={styles.panel}>
        <View style={styles.monthNav}>
          <IconButton
            icon={{ ios: 'chevron.left', android: 'chevron_left', web: 'chevron_left' }}
            label="Previous month"
            onPress={() => setMonth(addMonths(month, -1))}
          />
          <ThemedText type="smallBold" style={styles.panelTitle}>
            {monthLabel(month)}
          </ThemedText>
          <IconButton
            icon={{ ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' }}
            label="Next month"
            disabled={isCurrentMonth}
            onPress={() => setMonth(addMonths(month, 1))}
          />
        </View>
        <MonthGrid
          habit={habit}
          month={month}
          size="full"
          selectedKey={habit.kind === 'count' ? selectedDay : undefined}
          onDayPress={(key) => (habit.kind === 'count' ? setSelectedDay(key) : cycleDay(habit, key))}
        />
        {habit.kind === 'count' && (
          <View style={styles.dayEditor}>
            <View>
              <ThemedText type="smallBold">{dayLabel(selectedDay)}</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                Goal: {habit.target} a day
              </ThemedText>
            </View>
            <Stepper
              value={selectedCount}
              min={0}
              max={habit.target}
              onChange={(count) =>
                count > selectedCount ? logOnce(habit, selectedDay) : undoOnce(habit, selectedDay)
              }>
              <ThemedText type="smallBold" style={[styles.dayCount, { color: habit.color }]}>
                {selectedCount}/{habit.target}
              </ThemedText>
            </Stepper>
          </View>
        )}
      </ThemedView>

      <View style={styles.stats}>
        <Stat label="Streak" value={currentStreak(habit)} color={habit.color} />
        <Stat label="Best streak" value={bestStreak(habit)} color={habit.color} />
        <Stat label="This month" value={doneDaysInMonth(habit, month)} color={habit.color} />
      </View>

      <ThemedView type="backgroundElement" style={styles.panel}>
        <ThemedText type="smallBold" style={styles.panelTitle}>
          Days done per week
        </ThemedText>
        <BarChart
          bars={weeks.map((week) => ({ value: week.done / 7 }))}
          color={habit.color}
          startLabel={parseKey(weeks[0].start).toLocaleDateString(undefined, {
            month: 'short',
            day: 'numeric',
          })}
          endLabel="This week"
        />
      </ThemedView>

      <View style={styles.actions}>
        <Pressable
          onPress={() => router.push({ pathname: '/habit-form', params: { id: habit.id } })}
          style={({ pressed }) => [styles.action, pressed && styles.pressed]}>
          <ThemedText type="smallBold">Edit habit</ThemedText>
        </Pressable>
        <Pressable onPress={confirmDelete} style={({ pressed }) => [styles.action, pressed && styles.pressed]}>
          <ThemedText type="smallBold" style={styles.deleteText}>
            Delete habit
          </ThemedText>
        </Pressable>
      </View>
    </ScrollView>
  );
}

function ChallengePanel({ habit }: { habit: Habit }) {
  const challenge = challengeState(habit);
  const next = nextChallengeLength(habit);

  return (
    <ThemedView type="backgroundElement" style={styles.panel}>
      {challenge?.status === 'active' ? (
        <>
          <View style={styles.challengeHeader}>
            <ThemedText type="smallBold" style={styles.panelTitle}>
              🏁 {challenge.length}-day challenge
            </ThemedText>
            <ThemedText type="smallBold" style={{ color: habit.color }}>
              Day {challenge.day} of {challenge.length}
            </ThemedText>
          </View>
          <ChallengeTrack state={challenge} color={habit.color} />
        </>
      ) : (
        <>
          <ThemedText type="smallBold" style={styles.panelTitle}>
            {challenge?.status === 'failed' ? 'Challenge missed' : 'Ready for a challenge?'}
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {challenge?.status === 'failed'
              ? 'A day slipped by. Every streak starts again with one check-in.'
              : `Check in ${next} days in a row to win a trophy.`}
          </ThemedText>
          <Pressable
            onPress={() => startChallenge(habit.id, challenge?.status === 'failed' ? challenge.length : next)}
            style={({ pressed }) => [
              styles.challengeButton,
              { backgroundColor: habit.color },
              pressed && styles.pressed,
            ]}>
            <ThemedText type="smallBold" style={styles.challengeButtonText}>
              {challenge?.status === 'failed'
                ? `Restart ${challenge.length}-day challenge`
                : `Start ${next}-day challenge`}
            </ThemedText>
          </Pressable>
        </>
      )}
      {habit.wins.length > 0 && (
        <ThemedText type="small" themeColor="textSecondary">
          Trophies: {habit.wins.map((length) => `🏆 ${length}`).join('  ')}
        </ThemedText>
      )}
    </ThemedView>
  );
}

function Stat({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <ThemedView type="backgroundElement" style={styles.stat}>
      <ThemedText style={[styles.statValue, { color }]}>{value}</ThemedText>
      <ThemedText type="small" themeColor="textSecondary">
        {label}
      </ThemedText>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  notFound: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    width: '100%',
    maxWidth: 480,
    alignSelf: 'center',
    gap: Spacing.three,
    padding: Spacing.three,
    paddingBottom: Spacing.six,
  },
  panel: {
    gap: Spacing.three,
    padding: Spacing.three,
    borderRadius: Spacing.four,
  },
  panelTitle: {
    fontSize: 17,
  },
  monthNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dayEditor: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dayCount: {
    fontSize: 18,
    minWidth: 44,
    textAlign: 'center',
  },
  challengeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  challengeButton: {
    alignItems: 'center',
    paddingVertical: Spacing.two + Spacing.half,
    borderRadius: Spacing.three,
  },
  challengeButtonText: {
    color: '#ffffff',
  },
  stats: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  stat: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.three,
    borderRadius: Spacing.three,
  },
  statValue: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: 700,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.four,
  },
  action: {
    padding: Spacing.three,
  },
  deleteText: {
    color: '#E5484D',
  },
  pressed: {
    opacity: 0.7,
  },
});
