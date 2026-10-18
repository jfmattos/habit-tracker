import { router, Stack, useLocalSearchParams } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useState } from 'react';
import { Alert, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { MonthGrid } from '@/components/month-grid';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { addMonths, currentMonth, isSameMonth, monthLabel } from '@/lib/dates';
import {
  countInMonth,
  currentStreak,
  deleteHabit,
  toggleDay,
  useHabit,
  type Habit,
} from '@/store/habits';

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
  const isCurrentMonth = isSameMonth(month, currentMonth());

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
      <Stack.Title>{habit.name}</Stack.Title>

      <ThemedView type="backgroundElement" style={styles.panel}>
        <View style={styles.monthNav}>
          <MonthButton direction="previous" onPress={() => setMonth(addMonths(month, -1))} />
          <ThemedText type="smallBold" style={styles.monthLabel}>
            {monthLabel(month)}
          </ThemedText>
          <MonthButton
            direction="next"
            disabled={isCurrentMonth}
            onPress={() => setMonth(addMonths(month, 1))}
          />
        </View>

        <MonthGrid
          habit={habit}
          month={month}
          size="full"
          onToggleDay={(key) => toggleDay(habit.id, key)}
        />
      </ThemedView>

      <View style={styles.stats}>
        <Stat label="This month" value={countInMonth(habit, month)} color={habit.color} />
        <Stat label="Streak" value={currentStreak(habit)} color={habit.color} />
        <Stat label="Total" value={Object.keys(habit.days).length} color={habit.color} />
      </View>

      <Pressable onPress={confirmDelete} style={({ pressed }) => [styles.delete, pressed && styles.pressed]}>
        <ThemedText type="smallBold" style={styles.deleteText}>
          Delete habit
        </ThemedText>
      </Pressable>
    </ScrollView>
  );
}

function MonthButton({
  direction,
  disabled,
  onPress,
}: {
  direction: 'previous' | 'next';
  disabled?: boolean;
  onPress: () => void;
}) {
  const theme = useTheme();
  const previous = direction === 'previous';

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityLabel={previous ? 'Previous month' : 'Next month'}
      style={({ pressed }) => [
        styles.monthButton,
        { backgroundColor: theme.backgroundSelected },
        disabled && styles.disabled,
        pressed && styles.pressed,
      ]}>
      <SymbolView
        name={
          previous
            ? { ios: 'chevron.left', android: 'chevron_left', web: 'chevron_left' }
            : { ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' }
        }
        size={16}
        tintColor={theme.text}
      />
    </Pressable>
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
  monthNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  monthLabel: {
    fontSize: 17,
  },
  monthButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
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
  delete: {
    alignSelf: 'center',
    padding: Spacing.three,
  },
  deleteText: {
    color: '#E5484D',
  },
  disabled: {
    opacity: 0.3,
  },
  pressed: {
    opacity: 0.7,
  },
});
