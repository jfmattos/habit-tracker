import { SymbolView } from 'expo-symbols';
import type { ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';

import { GradientSlider } from '@/components/gradient-slider';
import { SegmentedControl } from '@/components/segmented-control';
import { ThemedText } from '@/components/themed-text';
import { HabitColors } from '@/constants/habit-colors';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { colorToHue, colorToShade, hueToColor, textOn } from '@/lib/colors';
import { feedback } from '@/lib/feedback';
import { ChallengeLengths } from '@/lib/habit-logic';
import type { Goal } from '@/store/habits';
import { rememberEmoji, useSettings } from '@/store/settings';

const HUE_STOPS = Array.from({ length: 13 }, (_, index) => index * 30);
const SHADE_STOPS = [0, 0.25, 0.5, 0.75, 1];

function stops<T>(values: T[], toColor: (value: T) => string) {
  return values.map(toColor) as [string, string, ...string[]];
}

/** The preset colors, plus hue and shade bars for any other color */
export function ColorPicker({ value, onChange }: { value: string; onChange: (color: string) => void }) {
  const theme = useTheme();
  const hue = colorToHue(value);
  const shade = colorToShade(value);

  return (
    <View style={styles.colorPicker}>
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
            style={[styles.swatchRing, option === value && { borderColor: theme.text }]}>
            <View style={[styles.swatch, { backgroundColor: option }]}>
              {option === value && (
                <SymbolView
                  name={{ ios: 'checkmark', android: 'check', web: 'check' }}
                  size={16}
                  tintColor={textOn(option)}
                />
              )}
            </View>
          </Pressable>
        ))}
      </View>
      <GradientSlider
        label="Color"
        stops={stops(HUE_STOPS, (stop) => hueToColor(stop, shade))}
        position={hue / 360}
        thumbColor={value}
        onChange={(position) => onChange(hueToColor(position * 359, shade))}
      />
      <GradientSlider
        label="Shade"
        stops={stops(SHADE_STOPS, (stop) => hueToColor(hue, stop))}
        position={shade}
        thumbColor={value}
        onChange={(position) => onChange(hueToColor(hue, position))}
      />
    </View>
  );
}

const EMOJIS = [
  '🎯', '📚', '💧', '💪', '🧘', '✍️', '🚶', '🏃', '🚴', '🏊', '🥗', '🍎',
  '🥦', '☕', '😴', '💊', '🦷', '🧴', '🧠', '📖', '🗣️', '🎸', '🎹', '🎨',
  '📷', '🧹', '🧺', '🪴', '🌱', '🐶', '💻', '📝', '📵', '🚭', '🍷', '💰',
  '🙏', '❤️', '☀️', '🌙',
];

/**
 * The last emoji in `text`, keeping multi-part emoji whole (skin tones, flags, 👩‍💻 sequences),
 * or null when it has none, e.g. when letters were typed.
 */
function lastEmoji(text: string) {
  try {
    // Built at runtime so an engine without \p{} support throws here instead of at load time
    const emoji = new RegExp(
      '\\p{Regional_Indicator}{2}|\\p{Extended_Pictographic}(?:\\uFE0F|\\p{Emoji_Modifier})?(?:\\u200D\\p{Extended_Pictographic}(?:\\uFE0F|\\p{Emoji_Modifier})?)*',
      'gu'
    );
    const matches = text.match(emoji);
    return matches?.[matches.length - 1] ?? null;
  } catch {
    // Engines without Unicode property escapes: fall back to the last code point
    return Array.from(text.trim()).slice(-1)[0] ?? null;
  }
}

/**
 * A scrollable row of emojis, starting with the ones you typed before, plus a field to add any
 * emoji from the keyboard. Typed emojis are remembered for next time.
 */
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
  const { customEmojis } = useSettings();
  // The current emoji always shows, even if it was typed on another device or before saving
  const options = [...new Set([value, ...customEmojis, ...EMOJIS].filter(Boolean))];

  function addTyped(text: string) {
    const emoji = lastEmoji(text);
    if (!emoji) return;
    feedback.select();
    rememberEmoji(emoji);
    onChange(emoji);
  }

  return (
    <View style={styles.emojiPicker}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.emojis}>
        {options.map((emoji) => (
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
      <View style={[styles.emojiField, { backgroundColor: theme.backgroundElement }]}>
        <Text style={styles.emojiText}>⌨️</Text>
        <TextInput
          value=""
          onChangeText={addTyped}
          placeholder="Add from keyboard: tap, then 😀 or 🌐"
          placeholderTextColor={theme.textSecondary}
          accessibilityLabel="Add an emoji from the keyboard"
          style={[styles.emojiFieldInput, { color: theme.text }]}
        />
      </View>
    </View>
  );
}

type GoalMode = 'once' | Goal['period'];

const GOAL_MODES: { value: GoalMode; label: string }[] = [
  { value: 'once', label: 'Once a day' },
  { value: 'day', label: 'Per day' },
  { value: 'week', label: 'Per week' },
  { value: 'month', label: 'Per month' },
];

const GOAL_LIMITS: Record<Goal['period'], { min: number; max: number; initial: number }> = {
  day: { min: 2, max: 20, initial: 3 },
  week: { min: 1, max: 7, initial: 3 },
  month: { min: 1, max: 31, initial: 20 },
};

/** The habit's goal: how often, and how many times per day, week or month */
export function GoalPicker({ value, onChange }: { value: Goal; onChange: (goal: Goal) => void }) {
  const mode: GoalMode = value.period === 'day' && value.target === 1 ? 'once' : value.period;

  function changeMode(next: GoalMode) {
    // Re-tapping the current option keeps the chosen count instead of resetting it
    if (next === mode) return;
    onChange(
      next === 'once'
        ? { period: 'day', target: 1 }
        : { period: next, target: GOAL_LIMITS[next].initial }
    );
  }

  const description =
    mode === 'once'
      ? 'Check in once a day. Every day you do it earns a trophy.'
      : mode === 'day'
        ? `Check in ${value.target} times a day. Every day you reach ${value.target} earns a trophy.`
        : `Check in on ${value.target} ${value.target === 1 ? 'day' : 'days'} each ${mode === 'week' ? 'week (Monday to Sunday)' : 'month'}. Every ${mode} you reach it earns a trophy.`;

  return (
    <View style={styles.goal}>
      <SegmentedControl options={GOAL_MODES} value={mode} onChange={changeMode} />
      {mode !== 'once' && (
        <View style={styles.row}>
          <ThemedText type="small" themeColor="textSecondary">
            {mode === 'day' ? 'Times per day' : `Days per ${mode}`}
          </ThemedText>
          <Stepper
            value={value.target}
            min={GOAL_LIMITS[mode].min}
            max={GOAL_LIMITS[mode].max}
            onChange={(target) => onChange({ period: mode, target })}
          />
        </View>
      )}
      <ThemedText type="small" themeColor="textSecondary">
        {description}
      </ThemedText>
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
          trackColor={{ true: color, false: theme.backgroundSelected }}
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
              <ThemedText type="smallBold" style={{ color: length === value ? textOn(color) : theme.text }}>
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
  colorPicker: {
    gap: Spacing.three,
  },
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
  emojiPicker: {
    gap: Spacing.two,
  },
  emojiField: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingHorizontal: Spacing.three,
    borderRadius: Spacing.three,
  },
  emojiFieldInput: {
    flex: 1,
    fontSize: 15,
    paddingVertical: Spacing.three,
  },
  goal: {
    gap: Spacing.three,
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
