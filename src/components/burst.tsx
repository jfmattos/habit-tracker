import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

const PARTICLES = 12;

/** A ring of particles that bursts out from the center each time `trigger` changes */
export function Burst({ color, trigger }: { color: string; trigger: number }) {
  if (trigger === 0) return null;

  return (
    <View pointerEvents="none" style={styles.container}>
      {Array.from({ length: PARTICLES }, (_, index) => (
        <Particle key={`${trigger}-${index}`} index={index} color={color} />
      ))}
    </View>
  );
}

function Particle({ index, color }: { index: number; color: string }) {
  const progress = useSharedValue(0);
  const angle = (index / PARTICLES) * 2 * Math.PI;
  const distance = index % 2 === 0 ? 70 : 52;

  useEffect(() => {
    progress.set(withTiming(1, { duration: 650, easing: Easing.out(Easing.cubic) }));
  }, [progress]);

  const style = useAnimatedStyle(() => ({
    opacity: 1 - progress.get(),
    transform: [
      { translateX: Math.cos(angle) * distance * progress.get() },
      { translateY: Math.sin(angle) * distance * 0.6 * progress.get() },
      { scale: 1 - progress.get() * 0.6 },
    ],
  }));

  return <Animated.View style={[styles.particle, { backgroundColor: color }, style]} />;
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  particle: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});
