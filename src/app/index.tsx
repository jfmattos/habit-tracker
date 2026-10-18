import { Redirect, router } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { HabitCard } from '@/components/habit-card';
import { IconButton } from '@/components/icon-button';
import { SwipeToDelete } from '@/components/swipe-to-delete';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { todayKey } from '@/lib/dates';
import { isSatisfied } from '@/lib/goals';
import { useHabits } from '@/store/habits';
import { useSettings } from '@/store/settings';

export default function TodayScreen() {
  const theme = useTheme();
  const habits = useHabits();
  const settings = useSettings();

  if (!settings.onboarded && habits.length === 0) {
    return <Redirect href="/onboarding" />;
  }

  const today = todayKey();
  const doneCount = habits.filter((habit) => isSatisfied(habit, today)).length;
  const allDone = habits.length > 0 && doneCount === habits.length;

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView edges={['top', 'left', 'right']} style={styles.container}>
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.header}>
            <View>
              <ThemedText type="small" themeColor="textSecondary">
                {new Date().toLocaleDateString(undefined, {
                  weekday: 'long',
                  month: 'long',
                  day: 'numeric',
                })}
              </ThemedText>
              <ThemedText type="subtitle">Today</ThemedText>
            </View>
            <View style={styles.actions}>
              <IconButton
                icon={{ ios: 'chart.bar.fill', android: 'bar_chart', web: 'bar_chart' }}
                label="Progress"
                onPress={() => router.push('/progress')}
              />
              <IconButton
                icon={{ ios: 'gearshape.fill', android: 'settings', web: 'settings' }}
                label="Settings"
                onPress={() => router.push('/settings')}
              />
              <IconButton
                icon={{ ios: 'plus', android: 'add', web: 'add' }}
                label="Add habit"
                primary
                onPress={() => router.push('/habit-form')}
              />
            </View>
          </View>

          {habits.length > 0 && (
            <View style={styles.summary}>
              <ThemedText type="smallBold">
                {allDone ? 'All done for today 🎉' : `${doneCount} of ${habits.length} done`}
              </ThemedText>
              <View style={styles.segments}>
                {habits.map((habit) => (
                  <View
                    key={habit.id}
                    style={[
                      styles.segment,
                      {
                        backgroundColor: isSatisfied(habit, today) ? habit.color : theme.backgroundElement,
                      },
                    ]}
                  />
                ))}
              </View>
            </View>
          )}

          {habits.length === 0 ? (
            <ThemedView type="backgroundElement" style={styles.empty}>
              <ThemedText type="smallBold">No habits yet</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                Tap + to add your first habit.
              </ThemedText>
            </ThemedView>
          ) : (
            habits.map((habit) => (
              <SwipeToDelete key={habit.id} habit={habit}>
                <HabitCard habit={habit} />
              </SwipeToDelete>
            ))
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
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingTop: Spacing.two,
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.two,
    paddingBottom: Spacing.one,
  },
  summary: {
    gap: Spacing.two,
  },
  segments: {
    flexDirection: 'row',
    gap: 4,
  },
  segment: {
    flex: 1,
    height: 8,
    borderRadius: 4,
  },
  empty: {
    alignItems: 'center',
    gap: Spacing.one,
    padding: Spacing.five,
    borderRadius: Spacing.four,
  },
});
