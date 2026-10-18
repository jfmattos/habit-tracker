import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { HabitBadge } from '@/components/habit-badge';
import { SegmentedControl } from '@/components/segmented-control';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { textOn } from '@/lib/colors';
import { addDays, dayLabel, daysBetween, parseKey, todayKey, weekStart } from '@/lib/dates';
import { goalLabel, goalsMet, isSatisfied } from '@/lib/goals';
import { countOn, isDone } from '@/lib/habit-logic';
import {
  activeDays,
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
const PERFECT = '#30A46C';
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
  const goals = habits.reduce((sum, habit) => sum + goalsMet(habit), 0);

  return (
    <>
      <TrophyCase challenges={challengesWon} perfectDays={perfect} goals={goals} />

      <View style={styles.tiles}>
        <Tile emoji="📅" label="Active days" value={activeDays(habits)} color="#30A46C" />
        <Tile emoji="✅" label="Check-ins" value={totalCheckIns(habits)} color="#3E63DD" />
        <Tile emoji="🔥" label="Best streak" value={Math.max(...habits.map(bestStreak))} color="#F76B15" />
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
        <DayGrid habits={habits} days={period} />
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
 * A habit-by-day grid: one row per habit (emoji, name and days done), one column per day.
 * Filled cells are days done, tinted cells are partly done multi-check-in habits, and blank
 * cells are days before the habit existed. Rows keep habits apart even when colors are alike.
 */
function DayGrid({ habits, days }: { habits: Habit[]; days: number }) {
  const theme = useTheme();
  const today = todayKey();
  const week = days <= 7;
  const keys = lastDays(days);
  const gap = week ? Spacing.one : 2;
  const nameStyle = week ? styles.gridNameWeek : styles.gridNameMonth;

  const labelStyle = (key: string) => [
    styles.gridLabel,
    key === today ? [{ color: theme.text }, styles.labelToday] : { color: theme.textSecondary },
  ];

  return (
    <View style={styles.grid}>
      {/* Day header: weekday + date for a week; every 5th date (counting back from today) for a month */}
      <View style={styles.gridRow}>
        <View style={nameStyle} />
        {week ? (
          <View style={[styles.gridCells, { gap }]}>
            {keys.map((key) => (
              <View key={key} style={styles.gridHeaderCell}>
                <Text style={labelStyle(key)}>
                  {parseKey(key).toLocaleDateString(undefined, { weekday: 'narrow' })}
                </Text>
                <Text style={labelStyle(key)}>{parseKey(key).getDate()}</Text>
              </View>
            ))}
          </View>
        ) : (
          // Month columns are too narrow for their own labels, so each label is centered
          // over its column on a free-standing row
          <View style={[styles.gridCells, styles.gridMonthLabels]}>
            {keys.map((key, index) =>
              (days - 1 - index) % 5 === 0 ? (
                <Text
                  key={key}
                  style={[
                    labelStyle(key),
                    styles.gridMonthLabel,
                    { left: `${((index + 0.5) / days) * 100}%` },
                  ]}>
                  {parseKey(key).getDate()}
                </Text>
              ) : null
            )}
          </View>
        )}
        <View style={styles.gridCount} />
      </View>

      {habits.map((habit) => {
        const first = firstKey(habit);
        const done = keys.filter((key) => isDone(habit, key)).length;
        return (
          <View key={habit.id} style={styles.gridRow}>
            <View style={[nameStyle, styles.gridName]}>
              <HabitBadge habit={habit} size={22} />
              {week && (
                <ThemedText type="small" numberOfLines={1} style={styles.gridNameText}>
                  {habit.name}
                </ThemedText>
              )}
            </View>
            <View style={[styles.gridCells, { gap }]}>
              {keys.map((key) => {
                const fraction = Math.min(1, countOn(habit, key) / habit.target);
                const before = key < first;
                return (
                  <View
                    key={key}
                    style={[
                      week ? styles.gridCellWeek : styles.gridCellMonth,
                      {
                        backgroundColor: before
                          ? 'transparent'
                          : fraction === 1
                            ? habit.color
                            : fraction > 0
                              ? `${habit.color}59`
                              : theme.backgroundSelected,
                      },
                      key === today && fraction < 1 && !before && { borderWidth: 1.5, borderColor: habit.color },
                    ]}>
                    {week && fraction === 1 && (
                      <Text style={[styles.gridCheck, { color: textOn(habit.color) }]}>✓</Text>
                    )}
                  </View>
                );
              })}
            </View>
            <Text style={[styles.gridCount, styles.gridCountText, { color: habit.color }]}>
              {done}/{days}
            </Text>
          </View>
        );
      })}

      {/* Daily totals: how many habits were done, with a star for perfect days. The month view
          only marks perfect days, so it hides the row when there are none */}
      {(week || keys.some((key) => habits.every((habit) => isSatisfied(habit, key)))) && (
      <View style={[styles.gridRow, styles.gridTotals, { borderTopColor: theme.backgroundSelected }]}>
        <ThemedText type="small" themeColor="textSecondary" style={nameStyle}>
          {week ? 'Done' : '⭐'}
        </ThemedText>
        <View style={[styles.gridCells, { gap }]}>
          {keys.map((key) => {
            const done = habits.filter((habit) => isDone(habit, key)).length;
            const perfect = habits.every((habit) => isSatisfied(habit, key));
            return (
              <View key={key} style={styles.gridHeaderCell}>
                {week ? (
                  <Text style={[styles.gridLabel, { color: perfect ? PERFECT : theme.textSecondary }]}>
                    {perfect ? '⭐' : `${done}/${habits.length}`}
                  </Text>
                ) : perfect ? (
                  <View style={styles.perfectDot} />
                ) : null}
              </View>
            );
          })}
        </View>
        <View style={styles.gridCount} />
      </View>
      )}
    </View>
  );
}

function HabitProgress({ habit, days }: { habit: Habit; days: number }) {
  const theme = useTheme();
  const stats = habitPeriod(habit, days);
  const streak = currentStreak(habit);
  const met = goalsMet(habit);
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
        <ThemedText type="small" themeColor="textSecondary">
          🎯 {goalLabel(habit.goal)} · met {met}×
        </ThemedText>
      </View>
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
                style={{ color: done ? textOn(habit.color) : count > 0 ? theme.text : theme.textSecondary }}>
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

function Tile({ emoji, label, value, color }: { emoji: string; label: string; value: number; color: string }) {
  return (
    <ThemedView type="backgroundElement" style={styles.tile}>
      <View style={[styles.tileIcon, { backgroundColor: `${color}2E` }]}>
        <Text style={styles.tileEmoji}>{emoji}</Text>
      </View>
      <Text style={[styles.tileValue, { color }]}>{value}</Text>
      <ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>
        {label}
      </ThemedText>
    </ThemedView>
  );
}

const TROPHY_GOLD = '#D99A00';

/** Total trophies, broken down by where they came from */
function TrophyCase({
  challenges,
  perfectDays,
  goals,
}: {
  challenges: number;
  perfectDays: number;
  goals: number;
}) {
  const theme = useTheme();
  const sources = [
    { emoji: '🏁', label: 'Challenges', value: challenges },
    { emoji: '🌟', label: 'Perfect days', value: perfectDays },
    { emoji: '🎯', label: 'Goals met', value: goals },
  ];

  return (
    <ThemedView type="backgroundElement" style={styles.panel}>
      <View style={styles.trophyHeader}>
        <View style={[styles.tileIcon, { backgroundColor: `${TROPHY_GOLD}2E` }]}>
          <Text style={styles.tileEmoji}>🏆</Text>
        </View>
        <View style={styles.panelHeading}>
          <ThemedText type="smallBold" style={styles.panelTitle}>
            Trophies
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            Every win counts
          </ThemedText>
        </View>
        <Text style={[styles.trophyTotal, { color: TROPHY_GOLD }]}>{challenges + perfectDays + goals}</Text>
      </View>
      <View style={styles.trophySources}>
        {sources.map((source) => (
          <View key={source.label} style={[styles.trophySource, { backgroundColor: theme.backgroundSelected }]}>
            <Text style={styles.trophySourceValue}>
              {source.emoji} <Text style={{ color: theme.text }}>{source.value}</Text>
            </Text>
            <ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>
              {source.label}
            </ThemedText>
          </View>
        ))}
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
    gap: Spacing.two,
  },
  tile: {
    flex: 1,
    alignItems: 'center',
    gap: Spacing.one,
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.two,
    borderRadius: Spacing.three,
  },
  tileIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tileEmoji: {
    fontSize: 20,
  },
  tileValue: {
    fontSize: 24,
    lineHeight: 28,
    fontWeight: 700,
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
  trophyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  trophyTotal: {
    fontSize: 34,
    lineHeight: 40,
    fontWeight: 800,
  },
  trophySources: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  trophySource: {
    flex: 1,
    alignItems: 'center',
    gap: Spacing.half,
    paddingVertical: Spacing.two,
    borderRadius: Spacing.three,
  },
  trophySourceValue: {
    fontSize: 18,
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
  grid: {
    gap: Spacing.two,
  },
  gridRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  gridNameWeek: {
    width: 104,
  },
  gridNameMonth: {
    width: 22,
  },
  gridName: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
  },
  gridNameText: {
    flexShrink: 1,
    fontSize: 13,
  },
  gridCells: {
    flex: 1,
    flexDirection: 'row',
  },
  gridHeaderCell: {
    flex: 1,
    alignItems: 'center',
  },
  gridLabel: {
    fontSize: 11,
    lineHeight: 14,
    textAlign: 'center',
  },
  gridMonthLabels: {
    height: 14,
  },
  gridMonthLabel: {
    position: 'absolute',
    width: 24,
    marginLeft: -12,
  },
  gridCellWeek: {
    flex: 1,
    aspectRatio: 1,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gridCellMonth: {
    flex: 1,
    height: 16,
    borderRadius: 2,
  },
  gridCheck: {
    fontSize: 12,
    fontWeight: 700,
  },
  gridCount: {
    width: 38,
  },
  gridCountText: {
    fontSize: 12,
    fontWeight: 700,
    textAlign: 'right',
  },
  gridTotals: {
    borderTopWidth: 1,
    paddingTop: Spacing.two,
  },
  perfectDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: PERFECT,
  },
  labelToday: {
    fontWeight: 700,
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
    gap: Spacing.half,
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
