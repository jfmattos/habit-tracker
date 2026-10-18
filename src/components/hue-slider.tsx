import { LinearGradient } from 'expo-linear-gradient';
import { useRef, useState } from 'react';
import { StyleSheet, View, type GestureResponderEvent } from 'react-native';

import { colorToHue, hueToColor } from '@/lib/colors';
import { feedback } from '@/lib/feedback';

const STOPS = Array.from({ length: 13 }, (_, index) => hueToColor(index * 30)) as [
  string,
  string,
  ...string[],
];
const THUMB = 28;
/** Haptic tick every this many degrees while dragging */
const TICK_DEGREES = 20;

type HueSliderProps = {
  /** The selected color, or null to hide the thumb (e.g. when a preset is selected) */
  value: string | null;
  onChange: (color: string) => void;
};

/** A drag-to-pick rainbow bar for custom habit colors */
export function HueSlider({ value, onChange }: HueSliderProps) {
  const [width, setWidth] = useState(0);
  const lastTick = useRef<number | null>(null);

  function pick(event: GestureResponderEvent) {
    if (width === 0) return;
    const hue = Math.max(0, Math.min(1, event.nativeEvent.locationX / width)) * 359;
    const tick = Math.round(hue / TICK_DEGREES);
    if (tick !== lastTick.current) {
      lastTick.current = tick;
      feedback.select();
    }
    onChange(hueToColor(hue));
  }

  const position = value === null ? null : (colorToHue(value) / 359) * width;

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
      accessibilityLabel="Custom color"
      style={styles.container}>
      <LinearGradient
        colors={STOPS}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        pointerEvents="none"
        style={styles.bar}
      />
      {position !== null && value && (
        <View
          pointerEvents="none"
          style={[styles.thumb, { left: position - THUMB / 2, backgroundColor: value }]}
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
