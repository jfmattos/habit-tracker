import { StyleSheet, Text, View } from 'react-native';

import type { Habit } from '@/store/habits';

/** The habit's emoji on a tint of its color, or a plain color dot when it has no emoji */
export function HabitBadge({ habit, size = 28 }: { habit: Pick<Habit, 'emoji' | 'color'>; size?: number }) {
  if (!habit.emoji) {
    return <View style={[styles.dot, { backgroundColor: habit.color }]} />;
  }

  return (
    <View
      style={[
        styles.badge,
        { width: size, height: size, borderRadius: size / 3, backgroundColor: `${habit.color}33` },
      ]}>
      <Text style={{ fontSize: size * 0.58 }}>{habit.emoji}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  badge: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
