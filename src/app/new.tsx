import { router } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { HabitColors } from '@/constants/habit-colors';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { addHabit } from '@/store/habits';

function close() {
  if (router.canGoBack()) {
    router.back();
  } else {
    router.replace('/');
  }
}

export default function NewHabitScreen() {
  const theme = useTheme();
  const [name, setName] = useState('');
  const [color, setColor] = useState<string>(HabitColors[0]);
  const canSave = name.trim().length > 0;

  function save() {
    if (!canSave) return;
    addHabit(name.trim(), color);
    close();
  }

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={close} hitSlop={8}>
          <ThemedText type="small" themeColor="textSecondary">
            Cancel
          </ThemedText>
        </Pressable>
        <ThemedText type="smallBold" style={styles.title}>
          New habit
        </ThemedText>
        <View style={styles.headerSpacer} />
      </View>

      <TextInput
        value={name}
        onChangeText={setName}
        placeholder="e.g. Read 10 pages"
        placeholderTextColor={theme.textSecondary}
        autoFocus
        returnKeyType="done"
        onSubmitEditing={save}
        maxLength={40}
        style={[styles.input, { backgroundColor: theme.backgroundElement, color: theme.text }]}
      />

      <View style={styles.colors}>
        {HabitColors.map((option) => (
          <Pressable
            key={option}
            onPress={() => setColor(option)}
            accessibilityLabel={`Color ${option}`}
            accessibilityState={{ selected: option === color }}
            style={[styles.swatchRing, option === color && { borderColor: option }]}>
            <View style={[styles.swatch, { backgroundColor: option }]}>
              {option === color && (
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

      <Pressable
        onPress={save}
        disabled={!canSave}
        style={({ pressed }) => [
          styles.saveButton,
          { backgroundColor: color },
          !canSave && styles.disabled,
          pressed && styles.pressed,
        ]}>
        <ThemedText type="smallBold" style={styles.saveText}>
          Add habit
        </ThemedText>
      </Pressable>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.four,
    padding: Spacing.four,
    paddingBottom: Spacing.five,
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
