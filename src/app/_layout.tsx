import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { AppState } from 'react-native';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { CelebrationOverlay } from '@/components/celebration-overlay';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { syncReminders } from '@/lib/reminders';
import { subscribeHabits } from '@/store/habits';
import { subscribeSettings } from '@/store/settings';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();

  useEffect(() => {
    // Reminder texts depend on what's done today, so rebuild them whenever anything changes
    syncReminders();
    const unsubscribeHabits = subscribeHabits(syncReminders);
    const unsubscribeSettings = subscribeSettings(syncReminders);
    const appState = AppState.addEventListener('change', (state) => {
      if (state === 'active') syncReminders();
    });
    return () => {
      unsubscribeHabits();
      unsubscribeSettings();
      appState.remove();
    };
  }, []);

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <AnimatedSplashOverlay />
      <Stack>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="onboarding" options={{ headerShown: false, gestureEnabled: false }} />
        <Stack.Screen name="habit/[id]" options={{ headerBackTitle: 'Today' }} />
        <Stack.Screen name="progress" options={{ title: 'Progress', headerBackTitle: 'Today' }} />
        <Stack.Screen name="settings" options={{ title: 'Settings', headerBackTitle: 'Today' }} />
        <Stack.Screen
          name="habit-form"
          options={{
            presentation: 'formSheet',
            headerShown: false,
            // The form is taller than most screens, so it opens full height and scrolls
            sheetAllowedDetents: [1],
            sheetGrabberVisible: true,
            sheetCornerRadius: 24,
          }}
        />
      </Stack>
      <CelebrationOverlay />
    </ThemeProvider>
  );
}
