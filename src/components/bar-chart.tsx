import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/hooks/use-theme';

type Bar = {
  /** 0 to 1, or null for "no data" (drawn as an empty slot) */
  value: number | null;
  color?: string;
};

type BarChartProps = {
  bars: Bar[];
  color: string;
  height?: number;
  startLabel?: string;
  endLabel?: string;
};

export function BarChart({ bars, color, height = 96, startLabel, endLabel }: BarChartProps) {
  const theme = useTheme();

  return (
    <View style={styles.container}>
      <View style={[styles.bars, { height }]}>
        {bars.map((bar, index) => (
          <View key={index} style={[styles.slot, { backgroundColor: theme.backgroundSelected }]}>
            {bar.value !== null && bar.value > 0 && (
              <View
                style={[
                  styles.bar,
                  { height: `${bar.value * 100}%`, backgroundColor: bar.color ?? color },
                ]}
              />
            )}
          </View>
        ))}
      </View>
      {(startLabel || endLabel) && (
        <View style={styles.labels}>
          <ThemedText type="small" themeColor="textSecondary">
            {startLabel}
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {endLabel}
          </ThemedText>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 6,
  },
  bars: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 3,
  },
  slot: {
    flex: 1,
    height: '100%',
    borderRadius: 3,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  bar: {
    width: '100%',
    borderRadius: 3,
  },
  labels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});
