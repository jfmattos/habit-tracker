import { Pressable, StyleSheet, Text, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/hooks/use-theme';
import { monthCells, monthDateKey, todayKey, Weekdays, type Month } from '@/lib/dates';
import { countOn } from '@/lib/habit-logic';
import type { Habit } from '@/store/habits';

type MonthGridProps = {
  habit: Habit;
  month: Month;
  size?: 'compact' | 'full';
  onDayPress?: (key: string) => void;
  /** Day drawn with a highlight ring */
  selectedKey?: string;
};

export function MonthGrid({ habit, month, size = 'compact', onDayPress, selectedKey }: MonthGridProps) {
  const theme = useTheme();
  const today = todayKey();
  const full = size === 'full';

  return (
    <View>
      {full && (
        <View style={styles.grid}>
          {Weekdays.map((weekday, index) => (
            <View key={index} style={styles.cellFull}>
              <ThemedText type="small" themeColor="textSecondary" style={styles.weekday}>
                {weekday}
              </ThemedText>
            </View>
          ))}
        </View>
      )}

      <View style={styles.grid}>
        {monthCells(month).map((day, index) => {
          const cellStyle = full ? styles.cellFull : styles.cellCompact;
          if (day === null) {
            return <View key={`blank-${index}`} style={cellStyle} />;
          }

          const key = monthDateKey(month, day);
          const count = countOn(habit, key);
          const done = count >= habit.target;
          // Partly done count habits get a tint of the habit color
          const background = done ? habit.color : count > 0 ? `${habit.color}59` : theme.backgroundSelected;
          const isFuture = key > today;

          return (
            <View key={key} style={cellStyle}>
              <Pressable
                disabled={!onDayPress || isFuture}
                onPress={() => onDayPress?.(key)}
                accessibilityLabel={`${key}, ${count} of ${habit.target}`}
                style={({ pressed }) => [
                  full ? styles.dayFull : styles.dayCompact,
                  { backgroundColor: background },
                  key === today && !done && { borderColor: habit.color, borderWidth: full ? 2 : 1.5 },
                  key === selectedKey && { borderColor: theme.text, borderWidth: 2 },
                  isFuture && styles.future,
                  pressed && styles.pressed,
                ]}>
                {full && (
                  <Text style={[styles.dayNumber, { color: done ? '#ffffff' : theme.text }]}>
                    {day}
                  </Text>
                )}
              </Pressable>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  cellCompact: {
    width: `${100 / 7}%`,
    padding: 1.5,
  },
  cellFull: {
    width: `${100 / 7}%`,
    padding: 3,
  },
  dayCompact: {
    aspectRatio: 1,
    borderRadius: 4,
  },
  dayFull: {
    aspectRatio: 1,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayNumber: {
    fontSize: 15,
    fontWeight: 600,
  },
  weekday: {
    textAlign: 'center',
  },
  future: {
    opacity: 0.4,
  },
  pressed: {
    opacity: 0.7,
  },
});
