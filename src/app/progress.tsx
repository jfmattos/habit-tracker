import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { BarChart } from '@/components/bar-chart';
import { HabitBadge } from '@/components/habit-badge';
import { SegmentedControl } from '@/components/segmented-control';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { addDays, dayLabel, todayKey } from '@/lib/dates';
import { countOn, isDone } from '@/lib/habit-logic';
import {
  bestStreak,
  currentStreak,
  dailyRates,
  firstKey,
  habitPeriod,
  perfectDays,
  totalCheckIns,
} from '@/lib/stats';
import { useHabits, type Habit } from '@/store/habits';

const LOG_DAYS = 14;
const PERFECT = '#30A46C';
const PERIODS = [
  { value: 7, label: 'Last 7 days' },
  { value: 30, label: 'Last 30 days' },
];

export default function ProgressScreen() {
  const theme = useTheme();
  const habits = useHabits();
  const [period, setPeriod] = useState(7);

  if (habits.length === 0) {
    return (
      <ThemedView style={styles.empty}>
        <ThemedText themeColor="textSecondary">Add a habit to start tracking progress.</ThemedText>
      </ThemedView>
    );
  }

  const rates = dailyRates(habits, period);
  const tracked = rates.filter((day) => day.rate !== null);
  const average = tracked.length
    ? Math.round((tracked.reduce((sum, day) => sum + (day.rate ?? 0), 0) / tracked.length) * 100)
    : 0;
  const trophies = habits.reduce((sum, habit) => sum + habit.wins.length, 0);
  const today = todayKey();
  const logDays = Array.from({ length: LOG_DAYS }, (_, index) => addDays(today, -index));

  return (
    <ScrollView
      style={{ backgroundColor: theme.background }}
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={styles.content}>
      <View style={styles.tiles}>
        <Tile label="Perfect days" value={perfectDays(habits)} />
        <Tile label="Check-ins" value={totalCheckIns(habits)} />
        <Tile label="Best streak" value={Math.max(...habits.map(bestStreak))} />
        <Tile label="Trophies" value={trophies} />
      </View>

      <SegmentedControl options={PERIODS} value={period} onChange={setPeriod} />

      <ThemedView type="backgroundElement" style={styles.panel}>
        <View style={styles.panelHeader}>
          <ThemedText type="smallBold" style={styles.panelTitle}>
            Your progress
          </ThemedText>
          <ThemedText type="smallBold" style={{ color: PERFECT }}>
            {average}% avg
          </ThemedText>
        </View>
        <ThemedText type="small" themeColor="textSecondary">
          Share of your habits done each day. Green days are perfect days.
        </ThemedText>
        <BarChart
          bars={rates.map((day) => ({
            value: day.rate,
            color: day.rate === 1 ? PERFECT : undefined,
          }))}
          color={theme.textSecondary}
          height={period === 7 ? 120 : 96}
          startLabel={dayLabel(rates[0].key)}
          endLabel="Today"
        />
      </ThemedView>

      <ThemedView type="backgroundElement" style={styles.panel}>
        <ThemedText type="smallBold" style={styles.panelTitle}>
          By habit
        </ThemedText>
        {habits.map((habit) => (
          <HabitProgress key={habit.id} habit={habit} days={period} />
        ))}
      </ThemedView>

      <ThemedView type="backgroundElement" style={styles.panel}>
        <ThemedText type="smallBold" style={styles.panelTitle}>
          Log
        </ThemedText>
        {logDays.map((key) => (
          <LogDay key={key} day={key} habits={habits} />
        ))}
      </ThemedView>
    </ScrollView>
  );
}

function HabitProgress({ habit, days }: { habit: Habit; days: number }) {
  const stats = habitPeriod(habit, days);
  const streak = currentStreak(habit);
  const details = [
    `${stats.doneDays} of ${stats.trackedDays} days`,
    habit.kind === 'count' ? `${stats.checkIns} check-ins` : null,
    streak > 0 ? `🔥 ${streak} ${streak === 1 ? 'day' : 'days'} in a row` : 'No streak yet',
  ].filter(Boolean);

  return (
    <Pressable
      onPress={() => router.push({ pathname: '/habit/[id]', params: { id: habit.id } })}
      style={({ pressed }) => [styles.habit, pressed && styles.pressed]}>
      <View style={styles.habitHeader}>
        <HabitBadge habit={habit} />
        <View style={styles.habitText}>
          <ThemedText type="smallBold" numberOfLines={1}>
            {habit.name}
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {details.join(' · ')}
          </ThemedText>
        </View>
        <ThemedText style={[styles.habitRate, { color: habit.color }]}>
          {Math.round(stats.rate * 100)}%
        </ThemedText>
      </View>
      <BarChart bars={stats.bars.map((value) => ({ value }))} color={habit.color} height={28} />
    </Pressable>
  );
}

function LogDay({ day, habits }: { day: string; habits: Habit[] }) {
  const theme = useTheme();
  const existing = habits.filter((habit) => firstKey(habit) <= day);
  if (existing.length === 0) return null;

  return (
    <View style={styles.logDay}>
      <ThemedText type="small" themeColor="textSecondary" style={styles.logLabel}>
        {dayLabel(day)}
      </ThemedText>
      <View style={styles.logChips}>
        {existing.map((habit) => {
          const count = countOn(habit, day);
          const done = isDone(habit, day);
          return (
            <View
              key={habit.id}
              style={[
                styles.logChip,
                {
                  backgroundColor: done
                    ? habit.color
                    : count > 0
                      ? `${habit.color}59`
                      : theme.backgroundSelected,
                },
              ]}>
              <ThemedText
                type="small"
                numberOfLines={1}
                style={{ color: done ? '#ffffff' : count > 0 ? theme.text : theme.textSecondary }}>
                {habit.emoji ? `${habit.emoji} ` : done ? '✓ ' : ''}
                {habit.name}
                {habit.kind === 'count' && !done ? ` ${count}/${habit.target}` : ''}
              </ThemedText>
            </View>
          );
        })}
      </View>
    </View>
  );
}

function Tile({ label, value }: { label: string; value: number }) {
  return (
    <ThemedView type="backgroundElement" style={styles.tile}>
      <ThemedText style={styles.tileValue}>{value}</ThemedText>
      <ThemedText type="small" themeColor="textSecondary">
        {label}
      </ThemedText>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.four,
  },
  content: {
    width: '100%',
    maxWidth: 480,
    alignSelf: 'center',
    gap: Spacing.three,
    padding: Spacing.three,
    paddingBottom: Spacing.six,
  },
  tiles: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  tile: {
    flexGrow: 1,
    flexBasis: '40%',
    padding: Spacing.three,
    borderRadius: Spacing.three,
  },
  tileValue: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: 700,
  },
  panel: {
    gap: Spacing.three,
    padding: Spacing.three,
    borderRadius: Spacing.four,
  },
  panelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  panelTitle: {
    fontSize: 17,
  },
  habit: {
    gap: Spacing.two,
  },
  habitHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  habitText: {
    flex: 1,
  },
  habitRate: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: 700,
  },
  logDay: {
    gap: Spacing.one,
  },
  logLabel: {
    fontSize: 13,
  },
  logChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.one,
  },
  logChip: {
    paddingVertical: Spacing.half,
    paddingHorizontal: Spacing.two,
    borderRadius: Spacing.two,
    maxWidth: '100%',
  },
  pressed: {
    opacity: 0.7,
  },
});
