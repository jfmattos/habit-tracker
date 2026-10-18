import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { ChallengeTrack } from '@/components/challenge-track';
import { Stepper } from '@/components/habit-fields';
import { IconButton } from '@/components/icon-button';
import { MonthGrid } from '@/components/month-grid';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { cycleDay, logOnce, undoOnce } from '@/lib/check-in';
import { textOn } from '@/lib/colors';
import { confirmDeleteHabit } from '@/lib/confirm-delete';
import {
  addMonths,
  currentMonth,
  daysBetween,
  dayLabel,
  isSameMonth,
  monthLabel,
  parseKey,
  todayKey,
  weekStart,
} from '@/lib/dates';
import { goalLabel, goalProgress, goalsMet, periodLabel } from '@/lib/goals';
import { challengeState, countOn, nextChallengeLength } from '@/lib/habit-logic';
import { bestStreak, currentStreak, doneDaysInMonth, firstKey, weeklyDone } from '@/lib/stats';
import { startChallenge, useHabit, type Habit } from '@/store/habits';

/** The weekly chart shows the weeks since the habit started, within these bounds */
const MIN_WEEKS = 4;
const MAX_WEEKS = 8;
const WEEK_CHART_HEIGHT = 120;

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

  function confirmDelete() {
    confirmDeleteHabit(habit, {
      onDeleted: () => (router.canGoBack() ? router.back() : router.replace('/')),
    });
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
            <View style={styles.headerActions}>
              <IconButton
                icon={{ ios: 'trash', android: 'delete', web: 'delete' }}
                label="Delete habit"
                onPress={confirmDelete}
              />
              <IconButton
                icon={{ ios: 'pencil', android: 'edit', web: 'edit' }}
                label="Edit habit"
                onPress={() => router.push({ pathname: '/habit-form', params: { id: habit.id } })}
              />
            </View>
          ),
        }}
      />

      <GoalPanel habit={habit} />
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

      <WeekChart habit={habit} />
    </ScrollView>
  );
}

/** Done days in each Monday-to-Sunday week, with the count on each bar and the weekly goal line */
function WeekChart({ habit }: { habit: Habit }) {
  const theme = useTheme();
  const today = todayKey();
  const sinceStart = Math.floor(daysBetween(weekStart(firstKey(habit)), weekStart(today)) / 7) + 1;
  const weeks = weeklyDone(habit, Math.max(MIN_WEEKS, Math.min(MAX_WEEKS, sinceStart)));
  const weeklyGoal = habit.goal.period === 'week' ? habit.goal.target : null;
  // Past weeks only, so the week in progress doesn't drag the average down
  const finished = sinceStart > 1 ? weeks.slice(0, -1).slice(-(sinceStart - 1)) : [];
  const average = finished.length
    ? finished.reduce((sum, week) => sum + week.done, 0) / finished.length
    : weeks[weeks.length - 1].done;
  const summary = weeklyGoal
    ? `Goal met in ${weeks.filter((week) => week.done >= weeklyGoal).length} of the last ${weeks.length} weeks`
    : `Average ${average.toFixed(1)} days a week`;

  return (
    <ThemedView type="backgroundElement" style={styles.panel}>
      <View>
        <ThemedText type="smallBold" style={styles.panelTitle}>
          📊 Days done per week
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          {summary}
        </ThemedText>
      </View>

      <View style={[styles.weekBars, { height: WEEK_CHART_HEIGHT + 18 }]}>
        {weeklyGoal && (
          <View
            pointerEvents="none"
            style={[
              styles.goalLine,
              { bottom: (weeklyGoal / 7) * WEEK_CHART_HEIGHT, borderColor: theme.textSecondary },
            ]}>
            <ThemedText themeColor="textSecondary" style={styles.goalLineLabel}>
              Goal {weeklyGoal}
            </ThemedText>
          </View>
        )}
        {weeks.map((week) => {
          const current = week.start === weekStart(today);
          const reached = weeklyGoal !== null && week.done >= weeklyGoal;
          return (
            <View key={week.start} style={styles.weekColumn}>
              <ThemedText
                type="smallBold"
                style={[styles.weekCount, { color: week.done > 0 ? habit.color : theme.textSecondary }]}>
                {reached ? `✓${week.done}` : week.done}
              </ThemedText>
              <View style={[styles.weekSlot, { height: WEEK_CHART_HEIGHT, backgroundColor: theme.backgroundSelected }]}>
                <View
                  style={{
                    height: `${(week.done / 7) * 100}%`,
                    backgroundColor: current && !reached ? `${habit.color}B3` : habit.color,
                  }}
                />
              </View>
            </View>
          );
        })}
      </View>

      <View style={styles.weekLabels}>
        {weeks.map((week) => (
          <ThemedText
            key={week.start}
            themeColor={week.start === weekStart(today) ? 'text' : 'textSecondary'}
            style={styles.weekLabel}>
            {week.start === weekStart(today)
              ? 'This\nweek'
              : parseKey(week.start).toLocaleDateString(undefined, { day: 'numeric', month: 'short' }).replace(' ', '\n')}
          </ThemedText>
        ))}
      </View>
    </ThemedView>
  );
}

function GoalPanel({ habit }: { habit: Habit }) {
  const theme = useTheme();
  const progress = goalProgress(habit);
  const met = goalsMet(habit);
  // One segment per time needed, capped so long monthly goals still fit as a bar
  const segments = Math.min(progress.target, 14);

  return (
    <ThemedView type="backgroundElement" style={styles.panel}>
      <View style={styles.challengeHeader}>
        <ThemedText type="smallBold" style={styles.panelTitle}>
          🎯 Goal: {goalLabel(habit.goal)}
        </ThemedText>
        <ThemedText type="smallBold" style={{ color: habit.color }}>
          {progress.met ? '✓ ' : ''}
          {Math.min(progress.done, progress.target)}/{progress.target} {periodLabel(habit.goal.period)}
        </ThemedText>
      </View>
      <View style={styles.goalTrack}>
        {Array.from({ length: segments }, (_, index) => {
          const filled = (index + 1) / segments <= progress.done / progress.target;
          return (
            <View
              key={index}
              style={[
                styles.goalSegment,
                { backgroundColor: filled ? habit.color : theme.backgroundSelected },
              ]}
            />
          );
        })}
      </View>
      <ThemedText type="small" themeColor="textSecondary">
        {met > 0
          ? `🏆 Goal met ${met} ${met === 1 ? 'time' : 'times'}. Each one is a trophy.`
          : 'Meet your goal to earn your first trophy 🏆'}
      </ThemedText>
    </ThemedView>
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
            <ThemedText type="smallBold" style={{ color: textOn(habit.color) }}>
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
  weekBars: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: Spacing.two,
  },
  weekColumn: {
    flex: 1,
    gap: Spacing.one,
  },
  weekCount: {
    fontSize: 13,
    lineHeight: 14,
    textAlign: 'center',
  },
  weekSlot: {
    borderRadius: 6,
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  goalLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    borderTopWidth: 1,
    borderStyle: 'dashed',
    zIndex: 1,
  },
  goalLineLabel: {
    position: 'absolute',
    right: 0,
    top: -16,
    fontSize: 11,
    lineHeight: 14,
  },
  weekLabels: {
    flexDirection: 'row',
    gap: Spacing.two,
    marginTop: -Spacing.two,
  },
  weekLabel: {
    flex: 1,
    fontSize: 11,
    lineHeight: 14,
    textAlign: 'center',
  },
  headerActions: {
    flexDirection: 'row',
    gap: Spacing.four,
  },
  goalTrack: {
    flexDirection: 'row',
    gap: 4,
  },
  goalSegment: {
    flex: 1,
    height: 8,
    borderRadius: 4,
  },
  pressed: {
    opacity: 0.7,
  },
});
