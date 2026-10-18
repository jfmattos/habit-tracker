import { SymbolView } from 'expo-symbols';
import type { ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';

import { SegmentedControl } from '@/components/segmented-control';
import { ThemedText } from '@/components/themed-text';
import { HabitColors } from '@/constants/habit-colors';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { feedback } from '@/lib/feedback';
import { ChallengeLengths } from '@/lib/habit-logic';
import type { HabitKind } from '@/store/habits';

export function ColorPicker({ value, onChange }: { value: string; onChange: (color: string) => void }) {
  return (
    <View style={styles.colors}>
      {HabitColors.map((option) => (
        <Pressable
          key={option}
          onPress={() => {
            feedback.select();
            onChange(option);
          }}
          accessibilityLabel={`Color ${option}`}
          accessibilityState={{ selected: option === value }}
          style={[styles.swatchRing, option === value && { borderColor: option }]}>
          <View style={[styles.swatch, { backgroundColor: option }]}>
            {option === value && (
              <SymbolView
                name={{ ios: 'checkmark', android: 'check', web: 'check' }}
                size={16}
                tintColor="#ffffff"
              />
            )}
          </View>
        </Pressable>
      ))}
    </View>
  );
}

const EMOJIS = [
  '📚', '💧', '💪', '🧘', '✍️', '🚶', '🏃', '🥗', '😴', '💊', '🎸', '🎨',
  '🧹', '💻', '🙏', '🌱', '🍎', '🚭', '📵', '💰', '🧠', '☀️', '🦷', '🎯',
];

/** A scrollable row of common emojis, plus a field to type any other emoji */
export function EmojiPicker({
  value,
  color,
  onChange,
}: {
  value: string;
  color: string;
  onChange: (emoji: string) => void;
}) {
  const theme = useTheme();
  const custom = value && !EMOJIS.includes(value) ? value : '';

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.emojis}>
      <TextInput
        value={custom}
        onChangeText={(text) => {
          // Keep only the last character typed (emoji can be several code units long)
          const last = Array.from(text.trim()).slice(-1)[0] ?? '';
          onChange(last);
        }}
        placeholder="✏️"
        placeholderTextColor={theme.textSecondary}
        accessibilityLabel="Type your own emoji"
        style={[
          styles.emoji,
          styles.emojiInput,
          { backgroundColor: custom ? `${color}33` : theme.backgroundElement },
          custom ? { borderColor: color } : null,
        ]}
      />
      {EMOJIS.map((emoji) => (
        <Pressable
          key={emoji}
          onPress={() => {
            feedback.select();
            onChange(emoji);
          }}
          accessibilityLabel={`Emoji ${emoji}`}
          accessibilityState={{ selected: emoji === value }}
          style={[
            styles.emoji,
            { backgroundColor: emoji === value ? `${color}33` : theme.backgroundElement },
            emoji === value && { borderColor: color },
          ]}>
          <Text style={styles.emojiText}>{emoji}</Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}

export function KindPicker({ value, onChange }: { value: HabitKind; onChange: (kind: HabitKind) => void }) {
  return (
    <SegmentedControl
      options={[
        { value: 'check', label: 'Once a day' },
        { value: 'count', label: 'Several times' },
      ]}
      value={value}
      onChange={onChange}
    />
  );
}

export function TargetStepper({ value, onChange }: { value: number; onChange: (target: number) => void }) {
  return (
    <View style={styles.row}>
      <ThemedText type="small" themeColor="textSecondary">
        Times per day
      </ThemedText>
      <Stepper value={value} min={2} max={20} onChange={onChange} />
    </View>
  );
}

/** − value + buttons; `children` replaces the plain number label */
export function Stepper({
  value,
  min,
  max,
  onChange,
  children,
}: {
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
  children?: ReactNode;
}) {
  const theme = useTheme();
  const step = (amount: number) => {
    feedback.select();
    onChange(Math.max(min, Math.min(max, value + amount)));
  };

  return (
    <View style={styles.stepperControls}>
      <Pressable
        onPress={() => step(-1)}
        disabled={value <= min}
        accessibilityLabel="Decrease"
        style={[styles.stepButton, { backgroundColor: theme.backgroundSelected }, value <= min && styles.disabled]}>
        <SymbolView name={{ ios: 'minus', android: 'remove', web: 'remove' }} size={16} tintColor={theme.text} />
      </Pressable>
      {children ?? (
        <ThemedText type="smallBold" style={styles.stepValue}>
          {value}
        </ThemedText>
      )}
      <Pressable
        onPress={() => step(1)}
        disabled={value >= max}
        accessibilityLabel="Increase"
        style={[styles.stepButton, { backgroundColor: theme.backgroundSelected }, value >= max && styles.disabled]}>
        <SymbolView name={{ ios: 'plus', android: 'add', web: 'add' }} size={16} tintColor={theme.text} />
      </Pressable>
    </View>
  );
}

/** Challenge on/off and its length in days */
export function ChallengePicker({
  value,
  color,
  onChange,
}: {
  value: number | null;
  color: string;
  onChange: (length: number | null) => void;
}) {
  const theme = useTheme();

  return (
    <View style={styles.challenge}>
      <View style={styles.row}>
        <View style={styles.rowText}>
          <ThemedText type="smallBold">Challenge</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {value ? `Check in ${value} days in a row to win a trophy.` : 'No challenge for this habit.'}
          </ThemedText>
        </View>
        <Switch
          value={value !== null}
          onValueChange={(enabled) => onChange(enabled ? ChallengeLengths[0] : null)}
          trackColor={{ true: color }}
          thumbColor="#ffffff"
        />
      </View>
      {value !== null && (
        <View style={styles.lengths}>
          {ChallengeLengths.map((length) => (
            <Pressable
              key={length}
              onPress={() => {
                feedback.select();
                onChange(length);
              }}
              accessibilityState={{ selected: length === value }}
              style={[
                styles.length,
                { backgroundColor: length === value ? color : theme.backgroundElement },
              ]}>
              <ThemedText type="smallBold" style={{ color: length === value ? '#ffffff' : theme.text }}>
                {length} days
              </ThemedText>
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  colors: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: Spacing.two,
  },
  swatchRing: {
    padding: 3,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  swatch: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emojis: {
    gap: Spacing.two,
  },
  emoji: {
    width: 44,
    height: 44,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emojiInput: {
    fontSize: 22,
    textAlign: 'center',
    padding: 0,
  },
  emojiText: {
    fontSize: 22,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.three,
  },
  rowText: {
    flex: 1,
  },
  stepperControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  stepButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepValue: {
    fontSize: 18,
    minWidth: 24,
    textAlign: 'center',
  },
  challenge: {
    gap: Spacing.three,
  },
  lengths: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  length: {
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    borderRadius: Spacing.four,
  },
  disabled: {
    opacity: 0.3,
  },
});
