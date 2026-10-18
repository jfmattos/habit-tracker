import { router } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { HabitCard } from '@/components/habit-card';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useHabits } from '@/store/habits';

export default function HabitsScreen() {
  const theme = useTheme();
  const habits = useHabits();

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView edges={['top', 'left', 'right']} style={styles.container}>
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.header}>
            <ThemedText type="subtitle">Habits</ThemedText>
            <Pressable
              onPress={() => router.push('/new')}
              accessibilityLabel="Add habit"
              style={({ pressed }) => [
                styles.addButton,
                { backgroundColor: theme.text },
                pressed && styles.pressed,
              ]}>
              <SymbolView
                name={{ ios: 'plus', android: 'add', web: 'add' }}
                size={20}
                tintColor={theme.background}
              />
            </Pressable>
          </View>

          {habits.length === 0 ? (
            <ThemedView type="backgroundElement" style={styles.empty}>
              <ThemedText type="smallBold">No habits yet</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                Tap + to add your first habit.
              </ThemedText>
            </ThemedView>
          ) : (
            habits.map((habit) => <HabitCard key={habit.id} habit={habit} />)
          )}
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    gap: Spacing.three,
    padding: Spacing.three,
    paddingBottom: Spacing.six,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.two,
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  empty: {
    alignItems: 'center',
    gap: Spacing.one,
    padding: Spacing.five,
    borderRadius: Spacing.four,
  },
  pressed: {
    opacity: 0.7,
  },
});
