import { router } from 'expo-router';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { HabitColors } from '@/constants/habit-colors';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { feedback } from '@/lib/feedback';
import { ChallengeTiers } from '@/lib/habit-logic';
import { remindersSupported, requestReminderPermission } from '@/lib/reminders';
import { addHabit, type HabitKind } from '@/store/habits';
import { updateSettings } from '@/store/settings';

type Choice = { name: string; emoji: string; kind: HabitKind; target: number; color: string };

const SUGGESTIONS: Choice[] = [
  { name: 'Read 10 pages', emoji: '📚', kind: 'check', target: 1, color: HabitColors[4] },
  { name: 'Drink water', emoji: '💧', kind: 'count', target: 8, color: HabitColors[3] },
  { name: 'Workout', emoji: '💪', kind: 'check', target: 1, color: HabitColors[2] },
  { name: 'Meditate', emoji: '🧘', kind: 'check', target: 1, color: HabitColors[5] },
  { name: 'Journal', emoji: '✍️', kind: 'check', target: 1, color: HabitColors[1] },
  { name: 'Walk outside', emoji: '🚶', kind: 'check', target: 1, color: HabitColors[7] },
];

const FIRST_CHALLENGE = ChallengeTiers[0];

export default function OnboardingScreen() {
  const theme = useTheme();
  const [step, setStep] = useState(0);
  const [choice, setChoice] = useState<Choice | null>(null);
  const [custom, setCustom] = useState('');
  const steps = remindersSupported ? 4 : 3;

  const habit: Choice | null = custom.trim()
    ? { name: custom.trim(), emoji: '✨', kind: 'check', target: 1, color: HabitColors[0] }
    : choice;
  const color = habit?.color ?? theme.text;

  function finish() {
    if (habit) {
      addHabit({ ...habit, challengeLength: FIRST_CHALLENGE });
    }
    updateSettings({ onboarded: true });
    router.replace('/');
  }

  function next() {
    feedback.select();
    if (step + 1 < steps) {
      setStep(step + 1);
    } else {
      finish();
    }
  }

  async function enableReminders() {
    const granted = await requestReminderPermission();
    updateSettings({ reminders: granted });
    finish();
  }

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.container}>
          <View style={styles.dots}>
            {Array.from({ length: steps }, (_, index) => (
              <View
                key={index}
                style={[
                  styles.dot,
                  { backgroundColor: index <= step ? color : theme.backgroundElement },
                ]}
              />
            ))}
          </View>

          <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
            {step === 0 && (
              <View style={styles.center}>
                <ThemedText style={styles.hero}>🌱</ThemedText>
                <ThemedText type="subtitle" style={styles.centerText}>
                  Build habits that stick
                </ThemedText>
                <ThemedText themeColor="textSecondary" style={styles.centerText}>
                  Check in every day, grow your streaks and win challenges. Small steps, every
                  day.
                </ThemedText>
              </View>
            )}

            {step === 1 && (
              <View style={styles.section}>
                <ThemedText type="subtitle">Pick your first habit</ThemedText>
                <View style={styles.chips}>
                  {SUGGESTIONS.map((suggestion) => {
                    const selected = !custom.trim() && choice?.name === suggestion.name;
                    return (
                      <Pressable
                        key={suggestion.name}
                        onPress={() => {
                          feedback.select();
                          setCustom('');
                          setChoice(suggestion);
                        }}
                        style={[
                          styles.chip,
                          {
                            backgroundColor: selected ? suggestion.color : theme.backgroundElement,
                          },
                        ]}>
                        <ThemedText
                          type="smallBold"
                          style={{ color: selected ? '#ffffff' : theme.text }}>
                          {suggestion.emoji} {suggestion.name}
                          {suggestion.kind === 'count' ? ` · ${suggestion.target}×` : ''}
                        </ThemedText>
                      </Pressable>
                    );
                  })}
                </View>
                <TextInput
                  value={custom}
                  onChangeText={setCustom}
                  placeholder="Or write your own"
                  placeholderTextColor={theme.textSecondary}
                  maxLength={40}
                  returnKeyType="done"
                  style={[styles.input, { backgroundColor: theme.backgroundElement, color: theme.text }]}
                />
              </View>
            )}

            {step === 2 && habit && (
              <View style={styles.center}>
                <ThemedText type="small" themeColor="textSecondary">
                  YOUR FIRST CHALLENGE
                </ThemedText>
                <ThemedText type="subtitle" style={styles.centerText}>
                  {FIRST_CHALLENGE} days of {habit.name}
                </ThemedText>
                <View style={styles.challengeDays}>
                  {Array.from({ length: FIRST_CHALLENGE }, (_, index) => (
                    <View key={index} style={styles.challengeDay}>
                      <View
                        style={[
                          styles.challengeCircle,
                          { borderColor: color, backgroundColor: index === 0 ? `${color}33` : undefined },
                        ]}>
                        <ThemedText type="smallBold" style={{ color }}>
                          {index + 1}
                        </ThemedText>
                      </View>
                      <ThemedText type="small" themeColor="textSecondary">
                        Day {index + 1}
                      </ThemedText>
                    </View>
                  ))}
                </View>
                <ThemedText themeColor="textSecondary" style={styles.centerText}>
                  Check in {FIRST_CHALLENGE} days in a row to win your first trophy 🏆. Then
                  unlock longer challenges.
                </ThemedText>
              </View>
            )}

            {step === 3 && (
              <View style={styles.center}>
                <ThemedText style={styles.hero}>🔔</ThemedText>
                <ThemedText type="subtitle" style={styles.centerText}>
                  Want a friendly nudge?
                </ThemedText>
                <ThemedText themeColor="textSecondary" style={styles.centerText}>
                  We&apos;ll check in each morning to set your intention, and remind you in the
                  evening if a habit is still open.
                </ThemedText>
              </View>
            )}
          </ScrollView>

          <View style={styles.footer}>
            {step === 3 ? (
              <>
                <PrimaryButton label="Turn on reminders" color={color} onPress={enableReminders} />
                <Pressable onPress={finish} hitSlop={8} style={styles.secondary}>
                  <ThemedText type="small" themeColor="textSecondary">
                    Maybe later
                  </ThemedText>
                </Pressable>
              </>
            ) : (
              <PrimaryButton
                label={step === 0 ? 'Get started' : step === 1 ? 'Continue' : 'Accept the challenge'}
                color={color}
                disabled={step === 1 && !habit}
                onPress={() => {
                  if (step === 2) feedback.goal();
                  next();
                }}
              />
            )}
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ThemedView>
  );
}

function PrimaryButton({
  label,
  color,
  disabled,
  onPress,
}: {
  label: string;
  color: string;
  disabled?: boolean;
  onPress: () => void;
}) {
  const theme = useTheme();
  // Before a habit is picked the accent is the text color, so the label flips to the background
  const textColor = color === theme.text ? theme.background : '#ffffff';

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.primary,
        { backgroundColor: color },
        disabled && styles.disabled,
        pressed && styles.pressed,
      ]}>
      <ThemedText type="smallBold" style={[styles.primaryText, { color: textColor }]}>
        {label}
      </ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  dots: {
    flexDirection: 'row',
    gap: Spacing.one,
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.three,
  },
  dot: {
    flex: 1,
    height: 4,
    borderRadius: 2,
  },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: Spacing.four,
    width: '100%',
    maxWidth: 520,
    alignSelf: 'center',
  },
  center: {
    alignItems: 'center',
    gap: Spacing.three,
  },
  centerText: {
    textAlign: 'center',
  },
  hero: {
    fontSize: 72,
    lineHeight: 84,
  },
  section: {
    gap: Spacing.four,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  chip: {
    paddingVertical: Spacing.two + Spacing.half,
    paddingHorizontal: Spacing.three,
    borderRadius: Spacing.four,
  },
  input: {
    fontSize: 17,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    borderRadius: Spacing.three,
  },
  challengeDays: {
    flexDirection: 'row',
    gap: Spacing.four,
    paddingVertical: Spacing.three,
  },
  challengeDay: {
    alignItems: 'center',
    gap: Spacing.two,
  },
  challengeCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 2.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footer: {
    gap: Spacing.two,
    padding: Spacing.four,
    width: '100%',
    maxWidth: 520,
    alignSelf: 'center',
  },
  primary: {
    alignItems: 'center',
    paddingVertical: Spacing.three,
    borderRadius: Spacing.three,
  },
  primaryText: {
    fontSize: 16,
  },
  secondary: {
    alignItems: 'center',
    padding: Spacing.two,
  },
  disabled: {
    opacity: 0.4,
  },
  pressed: {
    opacity: 0.7,
  },
});
