import { router, useLocalSearchParams } from 'expo-router';
import { useState, type ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { ChallengePicker, ColorPicker, EmojiPicker, GoalPicker } from '@/components/habit-fields';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { HabitColors } from '@/constants/habit-colors';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { celebrateChallenge } from '@/lib/check-in';
import { textOn } from '@/lib/colors';
import { ChallengeTiers, challengeState } from '@/lib/habit-logic';
import { addHabit, getHabits, updateHabit, useHabit, type Goal } from '@/store/habits';

function close() {
  if (router.canGoBack()) {
    router.back();
  } else {
    router.replace('/');
  }
}

/** Creates a habit, or edits one when opened with an `id` */
export default function HabitFormScreen() {
  const theme = useTheme();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const habit = useHabit(id ?? '');
  const running = habit ? challengeState(habit) : null;

  const [name, setName] = useState(habit?.name ?? '');
  const [emoji, setEmoji] = useState(habit?.emoji ?? '🎯');
  const [color, setColor] = useState<string>(habit?.color ?? HabitColors[0]);
  const [goal, setGoal] = useState<Goal>(habit?.goal ?? { period: 'day', target: 1 });
  const [challengeLength, setChallengeLength] = useState<number | null>(
    habit ? (running?.status === 'active' ? running.length : null) : ChallengeTiers[0]
  );
  const canSave = name.trim().length > 0;

  function save() {
    if (!canSave) return;
    const input = { name: name.trim(), emoji, color, goal, challengeLength };
    if (habit) {
      const won = updateHabit(habit.id, input);
      const updated = getHabits().find((item) => item.id === habit.id);
      if (won && updated) celebrateChallenge(updated, won);
    } else {
      addHabit(input);
    }
    close();
  }

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Pressable onPress={close} hitSlop={8}>
            <ThemedText type="small" themeColor="textSecondary">
              Cancel
            </ThemedText>
          </Pressable>
          <ThemedText type="smallBold" style={styles.title}>
            {habit ? 'Edit habit' : 'New habit'}
          </ThemedText>
          <View style={styles.headerSpacer} />
        </View>

        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="e.g. Read 10 pages"
          placeholderTextColor={theme.textSecondary}
          autoFocus={!habit}
          returnKeyType="done"
          maxLength={40}
          style={[styles.input, { backgroundColor: theme.backgroundElement, color: theme.text }]}
        />

        <Field label="Emoji">
          <EmojiPicker value={emoji} color={color} onChange={setEmoji} />
        </Field>

        <Field label="Goal">
          <GoalPicker value={goal} onChange={setGoal} />
        </Field>

        <Field label="Color">
          <ColorPicker value={color} onChange={setColor} />
        </Field>

        <ChallengePicker value={challengeLength} color={color} onChange={setChallengeLength} />
        {running?.status === 'active' && challengeLength !== null && (
          <ThemedText type="small" themeColor="textSecondary">
            You&apos;re on day {running.day}. Changing the length keeps your progress.
          </ThemedText>
        )}

        <Pressable
          onPress={save}
          disabled={!canSave}
          style={({ pressed }) => [
            styles.saveButton,
            { backgroundColor: color },
            !canSave && styles.disabled,
            pressed && styles.pressed,
          ]}>
          <ThemedText type="smallBold" style={[styles.saveText, { color: textOn(color) }]}>
            {habit ? 'Save changes' : 'Add habit'}
          </ThemedText>
        </Pressable>
      </ScrollView>
    </ThemedView>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <View style={styles.field}>
      <ThemedText type="small" themeColor="textSecondary">
        {label}
      </ThemedText>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    gap: Spacing.four,
    padding: Spacing.four,
    paddingBottom: Spacing.six,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 17,
  },
  headerSpacer: {
    width: 44,
  },
  input: {
    fontSize: 17,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    borderRadius: Spacing.three,
  },
  field: {
    gap: Spacing.two,
  },
  saveButton: {
    alignItems: 'center',
    paddingVertical: Spacing.three,
    borderRadius: Spacing.three,
  },
  saveText: {
    color: '#ffffff',
    fontSize: 16,
  },
  disabled: {
    opacity: 0.4,
  },
  pressed: {
    opacity: 0.7,
  },
});
