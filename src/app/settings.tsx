import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { Alert, Platform, Pressable, ScrollView, StyleSheet, Switch, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { feedback } from '@/lib/feedback';
import { remindersSupported, requestReminderPermission, sendTestReminder } from '@/lib/reminders';
import { updateSettings, useSettings } from '@/store/settings';

const MORNING_HOURS = [7, 8, 9, 10];
const EVENING_HOURS = [18, 19, 20, 21];

function hourLabel(hour: number) {
  return new Date(2000, 0, 1, hour).toLocaleTimeString(undefined, { hour: 'numeric' });
}

function notifyPermissionDenied() {
  Alert.alert(
    'Notifications are off',
    'Allow notifications for Expo Go in the iOS Settings app (Settings → Expo Go → Notifications), then try again.'
  );
}

export default function SettingsScreen() {
  const theme = useTheme();
  const settings = useSettings();

  async function toggleReminders(enabled: boolean) {
    if (!enabled) {
      updateSettings({ reminders: false });
      return;
    }
    const granted = await requestReminderPermission();
    updateSettings({ reminders: granted });
    if (!granted) notifyPermissionDenied();
  }

  async function testReminder() {
    if (await sendTestReminder()) {
      Alert.alert('Test reminder sent', 'Lock your phone or go to the home screen. It arrives in 5 seconds.');
    } else {
      notifyPermissionDenied();
    }
  }

  return (
    <ScrollView
      style={{ backgroundColor: theme.background }}
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={styles.content}>
      <Section title="Reminders">
        {remindersSupported ? (
          <>
            <Row label="Daily check-ins" detail="A morning intention and an evening nudge for open habits.">
              <Switch value={settings.reminders} onValueChange={toggleReminders} />
            </Row>
            {settings.reminders && (
              <>
                <HourPicker
                  label="Morning check-in"
                  hours={MORNING_HOURS}
                  value={settings.morningHour}
                  onChange={(morningHour) => updateSettings({ morningHour })}
                />
                <HourPicker
                  label="Evening nudge"
                  hours={EVENING_HOURS}
                  value={settings.eveningHour}
                  onChange={(eveningHour) => updateSettings({ eveningHour })}
                />
                <Pressable onPress={testReminder} style={({ pressed }) => pressed && styles.pressed}>
                  <ThemedText type="smallBold" style={styles.link}>
                    Send a test reminder
                  </ThemedText>
                </Pressable>
              </>
            )}
          </>
        ) : (
          <ThemedText type="small" themeColor="textSecondary">
            Reminders work in the app on your phone.
          </ThemedText>
        )}
      </Section>

      <Section title="Rewards">
        <Row label="Sounds" detail="A chime when you complete a habit.">
          <Switch value={settings.sound} onValueChange={(sound) => updateSettings({ sound })} />
        </Row>
        {Platform.OS !== 'web' && (
          <Row label="Haptics" detail="Feel every check-in.">
            <Switch value={settings.haptics} onValueChange={(haptics) => updateSettings({ haptics })} />
          </Row>
        )}
      </Section>

      <Section title="Intro">
        <Pressable
          onPress={() => {
            updateSettings({ onboarded: false });
            router.replace('/onboarding');
          }}
          style={({ pressed }) => pressed && styles.pressed}>
          <ThemedText type="smallBold" style={styles.link}>
            Replay the intro
          </ThemedText>
        </Pressable>
        <ThemedText type="small" themeColor="textSecondary">
          Walks through picking a habit and starting a challenge. It adds the habit you pick.
        </ThemedText>
      </Section>
    </ScrollView>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View style={styles.section}>
      <ThemedText type="small" themeColor="textSecondary" style={styles.sectionTitle}>
        {title.toUpperCase()}
      </ThemedText>
      <ThemedView type="backgroundElement" style={styles.panel}>
        {children}
      </ThemedView>
    </View>
  );
}

function Row({ label, detail, children }: { label: string; detail: string; children: ReactNode }) {
  return (
    <View style={styles.row}>
      <View style={styles.rowText}>
        <ThemedText type="smallBold">{label}</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          {detail}
        </ThemedText>
      </View>
      {children}
    </View>
  );
}

function HourPicker({
  label,
  hours,
  value,
  onChange,
}: {
  label: string;
  hours: number[];
  value: number;
  onChange: (hour: number) => void;
}) {
  const theme = useTheme();

  return (
    <View style={styles.hourPicker}>
      <ThemedText type="smallBold">{label}</ThemedText>
      <View style={styles.hours}>
        {hours.map((hour) => (
          <Pressable
            key={hour}
            onPress={() => {
              feedback.select();
              onChange(hour);
            }}
            accessibilityState={{ selected: hour === value }}
            style={[
              styles.hour,
              { backgroundColor: hour === value ? theme.text : theme.backgroundSelected },
            ]}>
            <ThemedText
              type="smallBold"
              style={{ color: hour === value ? theme.background : theme.text }}>
              {hourLabel(hour)}
            </ThemedText>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    width: '100%',
    maxWidth: 480,
    alignSelf: 'center',
    gap: Spacing.four,
    padding: Spacing.three,
    paddingBottom: Spacing.six,
  },
  section: {
    gap: Spacing.two,
  },
  sectionTitle: {
    paddingHorizontal: Spacing.two,
    fontSize: 13,
  },
  panel: {
    gap: Spacing.three,
    padding: Spacing.three,
    borderRadius: Spacing.four,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  rowText: {
    flex: 1,
  },
  hourPicker: {
    gap: Spacing.two,
  },
  hours: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  hour: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.two,
    borderRadius: Spacing.three,
  },
  link: {
    color: '#3E63DD',
  },
  pressed: {
    opacity: 0.7,
  },
});
