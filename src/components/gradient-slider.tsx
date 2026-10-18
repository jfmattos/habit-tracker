import { LinearGradient } from 'expo-linear-gradient';
import { useRef, useState } from 'react';
import { StyleSheet, View, type GestureResponderEvent } from 'react-native';

import { feedback } from '@/lib/feedback';

const THUMB = 28;
/** Haptic ticks per full drag across the bar */
const TICKS = 18;

type GradientSliderProps = {
  /** At least two gradient colors, left to right */
  stops: readonly [string, string, ...string[]];
  /** Thumb position from 0 to 1, or null to hide the thumb */
  position: number | null;
  thumbColor: string;
  label: string;
  onChange: (position: number) => void;
};

/** A drag-to-pick gradient bar; reports the touch position from 0 (left) to 1 (right) */
export function GradientSlider({ stops, position, thumbColor, label, onChange }: GradientSliderProps) {
  const [width, setWidth] = useState(0);
  const lastTick = useRef<number | null>(null);

  function pick(event: GestureResponderEvent) {
    if (width === 0) return;
    const value = Math.max(0, Math.min(1, event.nativeEvent.locationX / width));
    const tick = Math.round(value * TICKS);
    if (tick !== lastTick.current) {
      lastTick.current = tick;
      feedback.select();
    }
    onChange(value);
  }

  return (
    <View
      onLayout={(event) => setWidth(event.nativeEvent.layout.width)}
      onStartShouldSetResponder={() => true}
      onMoveShouldSetResponder={() => true}
      // Keep the drag even if it drifts vertically inside a ScrollView
      onResponderTerminationRequest={() => false}
      onResponderGrant={pick}
      onResponderMove={pick}
      onResponderRelease={() => {
        lastTick.current = null;
      }}
      accessibilityRole="adjustable"
      accessibilityLabel={label}
      style={styles.container}>
      <LinearGradient
        colors={stops}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        pointerEvents="none"
        style={styles.bar}
      />
      {position !== null && (
        <View
          pointerEvents="none"
          style={[styles.thumb, { left: position * width - THUMB / 2, backgroundColor: thumbColor }]}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: THUMB + 8,
    justifyContent: 'center',
  },
  bar: {
    height: 20,
    borderRadius: 10,
  },
  thumb: {
    position: 'absolute',
    width: THUMB,
    height: THUMB,
    borderRadius: THUMB / 2,
    borderWidth: 3,
    borderColor: '#ffffff',
    shadowColor: '#000000',
    shadowOpacity: 0.3,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 3,
  },
});
