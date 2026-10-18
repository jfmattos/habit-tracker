# Habit Tracker

A simple, rewarding habit tracker for iOS, Android and the web, built with [Expo](https://expo.dev) and React Native.

Create habits, check in every day, and earn trophies for staying consistent. Every check-in is rewarded with an animation, a haptic tap and a chime. Challenges, goals and daily reminders keep you coming back.

All data stays on your device. There is no account, server or sync.

## Features

- **Habits with an emoji and a color.** Pick from 14 preset colors or any hue and shade on the color sliders, and from a list of emojis or any emoji from your keyboard.
- **Goals per habit.** Once a day, several times a day (for example, 8 glasses of water), a number of days per week (Monday to Sunday) or a number of days per month.
- **A rewarding check-in.** Each check-in gets particles, a haptic tap and a sound. Meeting a goal, winning a challenge or completing every habit for the day ("perfect day") brings up a full-screen celebration with confetti.
- **Challenges.** Check in 3, 7, 14, 21 or 30 days in a row to win a trophy. Winning one unlocks the next, longer challenge.
- **Trophies.** Earned for every challenge won, every perfect day and every goal met.
- **Progress.** A habit-by-day grid for the last 7 or 30 days, completion percentages, streaks and per-habit stats, plus a History tab with the full day-by-day log.
- **Month view per habit.** A calendar where you can mark past days or fix the count for any day, with a weekly chart and the habit's goal progress.
- **Reminders.** A morning check-in and an evening nudge for habits you haven't done yet, as local notifications at the times you choose.
- **Quick edits.** Swipe a habit to the left to delete it. Use − and + to fix accidental taps.
- **Onboarding.** Pick a first habit, accept a 3-day challenge and turn on reminders.
- **Light and dark mode.**

## Design

The app follows a simple product framework:

| Layer | In this app |
|---|---|
| Core function | Create and track habits |
| Core loop | Every check-in is rewarded: visuals, haptics, sound |
| Accessory features | Goals, progress charts, history log |
| Surface area | 6 screens: Today, Onboarding, Habit, Habit form, Progress, Settings |
| Retention hook | Challenges, trophies and daily reminders |

## Getting started

You need [Node.js](https://nodejs.org) (the project uses v24) and the [Expo Go](https://expo.dev/go) app on your phone.

```bash
npm install
npx expo start
```

Then scan the QR code with your phone's camera (iOS) or from inside Expo Go (Android). Your phone and computer must be on the same Wi-Fi. Press `w` in the terminal to open the web version.

> **Expo SDK 57.** The project is pinned to SDK 57 because that is the newest SDK the App Store version of Expo Go supports. If Expo Go says the project needs a newer or older version, update Expo Go or check the `expo` version in `package.json`.

## Scripts

| Command | What it does |
|---|---|
| `npx expo start` | Start the dev server (scan the QR code with Expo Go) |
| `npx expo start --web` | Run the web version |
| `npx tsc --noEmit` | Typecheck |
| `npx expo lint` | Lint |
| `npx expo-doctor` | Check dependencies and config |
| `node scripts/generate-sounds.mjs` | Regenerate the reward sounds in `assets/sounds/` |

There is no test suite yet.

## Tech stack

- [Expo](https://expo.dev) SDK 57, React Native and TypeScript
- [Expo Router](https://docs.expo.dev/router/introduction/) for navigation
- [`expo-sqlite`](https://docs.expo.dev/versions/v57.0.0/sdk/sqlite/) for on-device storage (the browser's `localStorage` on web)
- [`expo-haptics`](https://docs.expo.dev/versions/v57.0.0/sdk/haptics/), [`expo-audio`](https://docs.expo.dev/versions/v57.0.0/sdk/audio/) and [`react-native-reanimated`](https://docs.swmansion.com/react-native-reanimated/) for the rewards
- [`expo-notifications`](https://docs.expo.dev/versions/v57.0.0/sdk/notifications/) for local reminders
- [`react-native-gesture-handler`](https://docs.swmansion.com/react-native-gesture-handler/) for swipe to delete

Everything used is included in Expo Go, so the app runs without a custom development build.

## Project structure

```
src/
  app/          Screens (Expo Router): Today, onboarding, habit, habit form, progress, settings
  components/   UI pieces: habit card, month grid, celebration overlay, pickers
  lib/          Logic: check-ins and rewards, goals, stats, dates, colors, reminders
  store/        On-device stores for habits, settings and celebrations
assets/
  sounds/       Reward sounds, synthesized by scripts/generate-sounds.mjs
```

See [CLAUDE.md](CLAUDE.md) for architecture notes and the rules the codebase follows.

## License

See [LICENSE](LICENSE).
