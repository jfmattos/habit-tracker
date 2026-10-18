import { StyleSheet, View } from 'react-native';

import { useTheme } from '@/hooks/use-theme';
import type { ChallengeState } from '@/lib/habit-logic';

/** One segment per challenge day, filled when done; long challenges collapse into a progress bar */
export function ChallengeTrack({ state, color }: { state: ChallengeState; color: string }) {
  const theme = useTheme();

  if (state.length > 14) {
    const done = state.days.filter(Boolean).length;
    return (
      <View style={[styles.bar, { backgroundColor: theme.backgroundSelected }]}>
        <View style={[styles.fill, { width: `${(done / state.length) * 100}%`, backgroundColor: color }]} />
      </View>
    );
  }

  return (
    <View style={styles.segments}>
      {state.days.map((done, index) => (
        <View
          key={index}
          style={[
            styles.segment,
            { backgroundColor: done ? color : theme.backgroundSelected },
            index + 1 === state.day && !done && { borderWidth: 1.5, borderColor: color },
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  segments: {
    flexDirection: 'row',
    gap: 4,
  },
  segment: {
    flex: 1,
    height: 6,
    borderRadius: 3,
  },
  bar: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 3,
  },
});
