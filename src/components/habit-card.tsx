import { router } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { Pressable, StyleSheet, View } from 'react-native';

import { MonthGrid } from '@/components/month-grid';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { currentMonth, todayKey } from '@/lib/dates';
import { countInMonth, toggleDay, type Habit } from '@/store/habits';

export function HabitCard({ habit }: { habit: Habit }) {
  const theme = useTheme();
  const month = currentMonth();
  const today = todayKey();
  const doneToday = !!habit.days[today];
  const count = countInMonth(habit, month);

  return (
    <Pressable
      onPress={() => router.push({ pathname: '/habit/[id]', params: { id: habit.id } })}
      style={({ pressed }) => pressed && styles.pressed}>
      <ThemedView type="backgroundElement" style={styles.card}>
        <View style={styles.info}>
          <View style={styles.titleRow}>
            <View style={[styles.dot, { backgroundColor: habit.color }]} />
            <ThemedText type="smallBold" numberOfLines={1} style={styles.name}>
              {habit.name}
            </ThemedText>
          </View>
          <ThemedText type="small" themeColor="textSecondary">
            {count} {count === 1 ? 'day' : 'days'} this month
          </ThemedText>

          <Pressable
            onPress={() => toggleDay(habit.id, today)}
            accessibilityLabel={doneToday ? 'Unmark today' : 'Mark today as done'}
            style={({ pressed }) => [
              styles.todayButton,
              { backgroundColor: doneToday ? habit.color : theme.backgroundSelected },
              pressed && styles.pressed,
            ]}>
            <SymbolView
              name={{ ios: 'checkmark', android: 'check', web: 'check' }}
              size={14}
              tintColor={doneToday ? '#ffffff' : theme.textSecondary}
            />
            <ThemedText
              type="smallBold"
              style={{ color: doneToday ? '#ffffff' : theme.textSecondary }}>
              {doneToday ? 'Done today' : 'Today'}
            </ThemedText>
          </Pressable>
        </View>

        <View style={styles.grid}>
          <MonthGrid habit={habit} month={month} />
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
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  name: {
    flexShrink: 1,
    fontSize: 17,
  },
  todayButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: Spacing.one,
    marginTop: 'auto',
    paddingVertical: Spacing.one + Spacing.half,
    paddingHorizontal: Spacing.three,
    borderRadius: Spacing.four,
  },
  grid: {
    width: 133,
  },
  pressed: {
    opacity: 0.7,
  },
});
