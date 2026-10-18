import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { BarChart } from '@/components/bar-chart';
import { HabitBadge } from '@/components/habit-badge';
import { SegmentedControl } from '@/components/segmented-control';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { addDays, dayLabel, daysBetween, parseKey, todayKey, weekStart } from '@/lib/dates';
import { countOn, isDone } from '@/lib/habit-logic';
import {
  bestStreak,
  currentStreak,
  firstKey,
  habitPeriod,
  lastDays,
  perfectDays,
  periodTotals,
  totalCheckIns,
} from '@/lib/stats';
import { useHabits, type Habit } from '@/store/habits';

/** Days added to the history each time "Show older days" is tapped */
const HISTORY_PAGE = 14;
const TABS = [
  { value: 'overview', label: '📊 Overview' },
  { value: 'history', label: '🗓️ History' },
] as const;
const PERIODS = [
  { value: 7, label: 'Last 7 days' },
  { value: 30, label: 'Last 30 days' },
];

type Tab = (typeof TABS)[number]['value'];

export default function ProgressScreen() {
  const theme = useTheme();
  const habits = useHabits();
  const [tab, setTab] = useState<Tab>('overview');

  if (habits.length === 0) {
    return (
      <ThemedView style={styles.empty}>
        <ThemedText themeColor="textSecondary">Add a habit to start tracking progress.</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ScrollView
      style={{ backgroundColor: theme.background }}
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={styles.content}>
      <SegmentedControl options={[...TABS]} value={tab} onChange={setTab} />
      {tab === 'overview' ? <Overview habits={habits} /> : <History habits={habits} />}
    </ScrollView>
  );
}

function Overview({ habits }: { habits: Habit[] }) {
  const [period, setPeriod] = useState(7);
  const totals = periodTotals(habits, period);
  const perfect = perfectDays(habits);
  const challengesWon = habits.reduce((sum, habit) => sum + habit.wins.length, 0);

  return (
    <>
      <View style={styles.tiles}>
        <Tile emoji="🌟" label="Perfect days" value={perfect} color="#30A46C" />
        <Tile emoji="✅" label="Check-ins" value={totalCheckIns(habits)} color="#3E63DD" />
        <Tile emoji="🔥" label="Best streak" value={Math.max(...habits.map(bestStreak))} color="#F76B15" />
        <Tile
          emoji="🏆"
          label="Trophies"
          value={challengesWon + perfect}
          detail={`${challengesWon} ${challengesWon === 1 ? 'challenge' : 'challenges'} + ${perfect} perfect ${perfect === 1 ? 'day' : 'days'}`}
          color="#D99A00"
        />
      </View>

      <SegmentedControl options={PERIODS} value={period} onChange={setPeriod} />

      <ThemedView type="backgroundElement" style={styles.panel}>
        <View style={styles.panelHeader}>
          <View style={styles.panelHeading}>
            <ThemedText type="smallBold" style={styles.panelTitle}>
              📈 Your progress
            </ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              {totals.done} of {totals.possible} habit days completed
            </ThemedText>
          </View>
          <ThemedText style={styles.bigRate}>{Math.round(totals.rate * 100)}%</ThemedText>
        </View>
        <DayChart habits={habits} days={period} />
        <View style={styles.legend}>
          {habits.map((habit) => (
            <View key={habit.id} style={styles.legendItem}>
              <View style={[styles.legendSwatch, { backgroundColor: habit.color }]} />
              <ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>
                {habit.emoji ? `${habit.emoji} ` : ''}
                {habit.name}
              </ThemedText>
            </View>
          ))}
        </View>
      </ThemedView>

      <ThemedView type="backgroundElement" style={styles.panel}>
        <ThemedText type="smallBold" style={styles.panelTitle}>
          🎯 By habit
        </ThemedText>
        {habits.map((habit) => (
          <HabitProgress key={habit.id} habit={habit} days={period} />
        ))}
      </ThemedView>
    </>
  );
}

function weekTitle(start: string) {
  const thisWeek = weekStart(todayKey());
  if (start === thisWeek) return 'This week';
  if (start === addDays(thisWeek, -7)) return 'Last week';
  const short = (key: string) =>
    parseKey(key).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  return `${short(start)} – ${short(addDays(start, 6))}`;
}

/** Every logged day, newest first, grouped into Monday-to-Sunday weeks */
function History({ habits }: { habits: Habit[] }) {
  const [shown, setShown] = useState(HISTORY_PAGE);
  const today = todayKey();
  const first = habits.map(firstKey).sort()[0];
  const total = Math.max(1, daysBetween(first, today) + 1);
  const days = Array.from({ length: Math.min(shown, total) }, (_, index) => addDays(today, -index));

  const weeks: { start: string; days: string[] }[] = [];
  for (const day of days) {
    const start = weekStart(day);
    if (weeks[weeks.length - 1]?.start !== start) weeks.push({ start, days: [] });
    weeks[weeks.length - 1].days.push(day);
  }

  return (
    <>
      {weeks.map((week) => {
        const done = week.days.reduce(
          (sum, day) => sum + habits.filter((habit) => isDone(habit, day)).length,
          0
        );
        const possible = week.days.reduce(
          (sum, day) => sum + habits.filter((habit) => firstKey(habit) <= day).length,
          0
        );
        return (
          <ThemedView key={week.start} type="backgroundElement" style={styles.panel}>
            <View style={styles.panelHeader}>
              <ThemedText type="smallBold" style={styles.panelTitle}>
                {weekTitle(week.start)}
              </ThemedText>
              <ThemedText type="smallBold" themeColor="textSecondary">
                {done}/{possible} done
              </ThemedText>
            </View>
            {week.days.map((key) => (
              <LogDay key={key} day={key} habits={habits} />
            ))}
          </ThemedView>
        );
      })}

      {shown < total ? (
        <Pressable
          onPress={() => setShown(shown + HISTORY_PAGE)}
          style={({ pressed }) => [styles.more, pressed && styles.pressed]}>
          <ThemedText type="smallBold" style={styles.moreText}>
            Show older days
          </ThemedText>
        </Pressable>
      ) : (
        <ThemedText type="small" themeColor="textSecondary" style={styles.historyEnd}>
          That&apos;s where your journey started 🌱
        </ThemedText>
      )}
    </>
  );
}

/**
 * One stacked bar per day with a block per habit in its color: full blocks are habits done
 * that day, short tinted blocks are partly done multi-check-in habits.
 */
function DayChart({ habits, days }: { habits: Habit[]; days: number }) {
  const theme = useTheme();
  const today = todayKey();
  const week = days <= 7;
  const keys = lastDays(days);
  // Bottom-up stacking: the first habit sits at the bottom of each bar
  const stack = [...habits].reverse();

  return (
    <View>
      <View style={[styles.chart, { gap: week ? Spacing.two : 2 }]}>
        {keys.map((key) => {
          const done = habits.filter((habit) => isDone(habit, key)).length;
          const perfect = done === habits.length;

          return (
            <View key={key} style={styles.column}>
              {week && (
                <Text style={[styles.columnTop, { color: perfect ? '#30A46C' : theme.textSecondary }]}>
                  {perfect ? '⭐' : `${done}/${habits.length}`}
                </Text>
              )}
              <View
                style={[
                  styles.slot,
                  { height: week ? 140 : 110, backgroundColor: theme.backgroundSelected },
                  perfect && !week && styles.perfectSlot,
                ]}>
                {stack.map((habit) => {
                  const fraction = Math.min(1, countOn(habit, key) / habit.target);
                  if (fraction === 0) return null;
                  return (
                    <View
                      key={habit.id}
                      style={{
                        height: `${(fraction / habits.length) * 100}%`,
                        backgroundColor: fraction === 1 ? habit.color : `${habit.color}59`,
                      }}
                    />
                  );
                })}
              </View>
              {week && (
                <View style={styles.columnLabel}>
                  <Text style={[styles.labelText, labelColor(key)]}>
                    {parseKey(key).toLocaleDateString(undefined, { weekday: 'short' })}
                  </Text>
                  <Text style={[styles.labelText, labelColor(key)]}>{parseKey(key).getDate()}</Text>
                </View>
              )}
            </View>
          );
        })}
      </View>

      {!week && (
        // Bars are too narrow for their own labels, so every 5th date (counting back from
        // today) is centered under its bar on a separate row
        <View style={styles.monthLabels}>
          {keys.map((key, index) =>
            (days - 1 - index) % 5 === 0 ? (
              <Text
                key={key}
                style={[
                  styles.labelText,
                  styles.monthLabel,
                  { left: `${((index + 0.5) / days) * 100}%` },
                  labelColor(key),
                ]}>
                {parseKey(key).getDate()}
              </Text>
            ) : null
          )}
        </View>
      )}
    </View>
  );

  function labelColor(key: string) {
    return key === today
      ? [{ color: theme.text }, styles.labelToday]
      : { color: theme.textSecondary };
  }
}

function HabitProgress({ habit, days }: { habit: Habit; days: number }) {
  const theme = useTheme();
  const stats = habitPeriod(habit, days);
  const streak = currentStreak(habit);
  const details = [
    `${stats.doneDays} of ${days} days`,
    habit.kind === 'count' ? `${stats.checkIns} check-ins` : null,
  ].filter(Boolean);

  return (
    <Pressable
      onPress={() => router.push({ pathname: '/habit/[id]', params: { id: habit.id } })}
      style={({ pressed }) => [styles.habit, pressed && styles.pressed]}>
      <View style={styles.habitHeader}>
        <HabitBadge habit={habit} size={36} />
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

      <View style={[styles.rateTrack, { backgroundColor: theme.backgroundSelected }]}>
        <View style={[styles.rateFill, { width: `${stats.rate * 100}%`, backgroundColor: habit.color }]} />
      </View>

      <View style={styles.habitFooter}>
        <ThemedText type="small" themeColor={streak > 0 ? 'text' : 'textSecondary'}>
          {streak > 0
            ? `🔥 ${streak} ${streak === 1 ? 'day' : 'days'} in a row`
            : '💤 No streak yet. Check in today!'}
        </ThemedText>
      </View>
      <BarChart bars={stats.bars.map((value) => ({ value }))} color={habit.color} height={24} />
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

function Tile({
  emoji,
  label,
  value,
  color,
  detail,
}: {
  emoji: string;
  label: string;
  value: number;
  color: string;
  detail?: string;
}) {
  return (
    <ThemedView type="backgroundElement" style={styles.tile}>
      <View style={[styles.tileIcon, { backgroundColor: `${color}2E` }]}>
        <Text style={styles.tileEmoji}>{emoji}</Text>
      </View>
      <View style={styles.tileText}>
        <Text style={[styles.tileValue, { color }]}>{value}</Text>
        <ThemedText type="small" themeColor="textSecondary">
          {label}
        </ThemedText>
        {detail && (
          <ThemedText themeColor="textSecondary" style={styles.tileDetail}>
            {detail}
          </ThemedText>
        )}
      </View>
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    padding: Spacing.three,
    borderRadius: Spacing.three,
  },
  tileIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tileEmoji: {
    fontSize: 22,
  },
  tileText: {
    flexShrink: 1,
  },
  tileDetail: {
    fontSize: 11,
    lineHeight: 14,
  },
  more: {
    alignItems: 'center',
    padding: Spacing.three,
  },
  moreText: {
    color: '#3E63DD',
  },
  historyEnd: {
    textAlign: 'center',
    padding: Spacing.three,
  },
  tileValue: {
    fontSize: 26,
    lineHeight: 30,
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
    gap: Spacing.three,
  },
  panelHeading: {
    flex: 1,
  },
  panelTitle: {
    fontSize: 17,
  },
  bigRate: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: 700,
    color: '#30A46C',
  },
  chart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  column: {
    flex: 1,
    alignItems: 'stretch',
    gap: Spacing.one,
  },
  columnTop: {
    fontSize: 11,
    fontWeight: 600,
    textAlign: 'center',
  },
  slot: {
    borderRadius: 6,
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  perfectSlot: {
    borderTopWidth: 2,
    borderColor: '#30A46C',
  },
  columnLabel: {
    alignItems: 'center',
  },
  labelText: {
    fontSize: 11,
    lineHeight: 14,
    textAlign: 'center',
  },
  monthLabels: {
    height: 18,
    marginTop: Spacing.one,
  },
  monthLabel: {
    position: 'absolute',
    width: 30,
    marginLeft: -15,
  },
  labelToday: {
    fontWeight: 700,
  },
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.three,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    maxWidth: '100%',
  },
  legendSwatch: {
    width: 10,
    height: 10,
    borderRadius: 3,
  },
  habit: {
    gap: Spacing.two,
    paddingVertical: Spacing.one,
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
    fontSize: 24,
    lineHeight: 30,
    fontWeight: 700,
  },
  rateTrack: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  rateFill: {
    height: '100%',
    borderRadius: 4,
  },
  habitFooter: {
    flexDirection: 'row',
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
