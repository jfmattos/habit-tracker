import { Pressable, StyleSheet, Text, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/hooks/use-theme';
import { monthCells, monthDateKey, todayKey, Weekdays, type Month } from '@/lib/dates';
import type { Habit } from '@/store/habits';

type MonthGridProps = {
  habit: Habit;
  month: Month;
  size?: 'compact' | 'full';
  onToggleDay?: (key: string) => void;
};

export function MonthGrid({ habit, month, size = 'compact', onToggleDay }: MonthGridProps) {
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
          const done = !!habit.days[key];
          const isFuture = key > today;

          return (
            <View key={key} style={cellStyle}>
              <Pressable
                disabled={!onToggleDay || isFuture}
                onPress={() => onToggleDay?.(key)}
                accessibilityLabel={`${key}, ${done ? 'done' : 'not done'}`}
                style={({ pressed }) => [
                  full ? styles.dayFull : styles.dayCompact,
                  { backgroundColor: done ? habit.color : theme.backgroundSelected },
                  key === today && !done && { borderColor: habit.color, borderWidth: full ? 2 : 1.5 },
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
