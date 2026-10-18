# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Project

Habit Tracker: an Expo app (iOS, Android, web from one codebase) for tracking daily habits. All data is local to the device; there is no backend or sync.

The app is designed with a product framework the owner applies to every app. Keep new work inside it:

- **Core function**: create and track habits.
- **Core loop**: every check-in is rewarded with an animation, haptics and a sound. Winning a challenge triggers a full-screen celebration.
- **Accessory features**: two habit types (once a day, or several times a day), plus a Progress screen with a log and consistency charts.
- **Surface area**: 5–7 screens at most. There are 6 now: Today, Onboarding, Habit detail, Habit form, Progress and Settings. The celebration is an overlay, not a screen. Prefer extending an existing screen over adding a new one.
- **Retention hook**: challenges (3 → 7 → 14 → 30 days), plus local reminders each morning and evening.

All app content stays in **English**: UI copy, notification texts, code, comments and commit messages. This holds even when the owner writes requests in Portuguese.

The project is pinned to **Expo SDK 57** because the iOS App Store build of Expo Go supports up to SDK 57. Use the v57 docs (`https://docs.expo.dev/versions/v57.0.0/`). Do not upgrade the SDK unless the App Store Expo Go supports the newer version.

## Commands

There is no test suite. Verify changes with:

```bash
npx tsc --noEmit   # typecheck
npx expo lint      # lint (ESLint flat config in eslint.config.js)
npx expo-doctor    # dependency/config checks
npx expo export    # confirms iOS, Android and web all bundle
```

Typed routes (`experiments.typedRoutes`) are generated into `.expo/types/router.d.ts` when the dev server starts. After adding or renaming a route, start `npx expo start` once before running `tsc`, or route strings will fail to typecheck.

Do not run `npm run reset-project`: it is the leftover template script and would move the app's `src/` into `example/`.

## Environment

- Node is installed via nvm. In a non-interactive shell `node`/`npx` may be missing from PATH; prefix commands with `PATH=~/.nvm/versions/node/v24.22.0/bin:$PATH`.
- The development Mac has no Xcode, so there is no iOS simulator. Test on the web (`http://localhost:8081`) or on an iPhone via Expo Go (`npx expo start --lan`, then scan the QR code).
- The app's target runtime is **Expo Go on iPhone**, for the long term. The owner has decided not to get an Apple Developer account, so there will be no iOS development builds, TestFlight or App Store builds. Only use libraries that Expo Go already includes, avoid anything that needs a development build or a custom native config plugin, and keep the SDK at the version the App Store Expo Go supports.
- EAS is linked to `@jfmattos/habit-tracker`. `eas.json` has `development`, `preview` (Android APK) and `production` profiles, but only Android builds are possible without the Apple account.

## Architecture

- **Routing** (`src/app/`): a single root `Stack` in `_layout.tsx`, with no tabs. `index` (Today) redirects to `onboarding` when `settings.onboarded` is false and there are no habits. `habit/[id]` sets its title with `<Stack.Title>` and has trash (delete, with confirmation) and pencil (edit) buttons on the right of its header; there are no edit/delete buttons in the screen body. `habit-form` creates a habit, or edits one when opened with `?id=`. It is presented as a standard `modal` with a scrolling form. Don't present it as a full-height `formSheet`: scrolling content inside one didn't work on iOS in Expo Go. The root layout wraps everything in `GestureHandlerRootView` (needed for `SwipeToDelete` on Today cards; buttons inside a swipeable card check `useSwipeGuard()` so the end of a swipe isn't taken as a tap) and renders `CelebrationOverlay` and keeps reminders in sync with the stores.
- **Stores** (`src/store/`): `create-store.ts` provides `createStore` and `createPersistentStore`. Each store is a module-level value read through `useSyncExternalStore`, with no provider. There are three:
  - `habits.ts`, saved under the `localStorage` key `habits`, with a `migrate` function for older formats.
  - `settings.ts`, saved under `settings`: onboarding, reminders, reminder hours, sound and haptics.
  - `celebration.ts`, in memory only: the challenge win currently on screen.
- **Habit model**: `emoji` is shown by `HabitBadge`, which falls back to a color dot when it's empty, as it is for older habits. `goal` is `{ period: 'day' | 'week' | 'month', target }`. Per-day goals count check-ins; weekly (Monday–Sunday) and monthly goals count done days. `kind`/`target` (`'check'` = 1 a day, `'count'` = N a day) are derived from the goal by `trackingFor` in the store, so inputs set `goal`, never `kind`/`target`. Goal logic lives in `src/lib/goals.ts`: `goalProgress`, `goalsMet` (each met day, week or month is a trophy) and `isSatisfied` (done that day, or that period's weekly/monthly goal is met). Use `isSatisfied`, not `isDone`, for "done today", perfect days and reminders. `log` is a `Record<'YYYY-MM-DD', number>`, and a day counts as done when its count reaches the `target`. `challenge` is `{ length, startKey }` or null, and `wins` lists the lengths of challenges won. The derived logic lives in `src/lib/habit-logic.ts`: `isDone`, `challengeState` (active, completed or failed) and `nextChallengeLength` (the tiers in `ChallengeTiers`).
- **Check-ins go through `src/lib/check-in.ts`** (`logOnce`, `undoOnce`, `cycleDay`), never straight to `setCount`. These functions write the new count, then fire the reward from `src/lib/feedback.ts`: a tick for progress, a chime when a habit is done, a fanfare and a celebration when a challenge is won. `setCount` and `updateHabit` both detect a completed challenge, through `settle`, and move it into `wins`. `updateHabit` takes `challengeLength`: a new length keeps a running challenge's `startKey`, and `null` removes the challenge. The celebration store holds one of two kinds: `'challenge'` (a challenge won, which takes priority) or `'perfect-day'` (the check-in that completed every habit for today). The UI adds its own visuals on top: `Burst` particles and a scale pop in `HabitCard`.
- **Progress percentages** (`habitPeriod` and `periodTotals` in `src/lib/stats.ts`) are measured against the whole 7- or 30-day period, not only the days since a habit was created. A habit created 3 days ago and done all 3 days is at 3/30 = 10% over 30 days. The owner asked for this explicitly. The periods stay rolling (last 7 and last 30 days), not calendar weeks or months. The Progress screen has two in-screen tabs, Overview and History. History is the day-by-day log, grouped into Monday-to-Sunday weeks and paged 14 days at a time. The Trophies tile counts challenges won + perfect days + goals met. Reaching a weekly or monthly goal shows its own celebration (`'goal'` kind).
- **Sounds** live in `assets/sounds/`. They are synthesized by `scripts/generate-sounds.mjs`, so change that script and re-run it rather than editing the WAV files. `feedback.ts` respects the silent switch and the sound and haptics settings.
- **Reminders** (`src/lib/reminders.ts`) are local scheduled notifications through `expo-notifications`, which works in Expo Go without a server. `syncReminders()` (debounced) cancels everything and schedules the next 7 days: a morning intention and an evening nudge. Today's texts list the habits still open and mention any active challenge. It runs on every store change and whenever the app returns to the foreground.
- **Platform splits** (keep them): `install-storage.ts` provides `globalThis.localStorage` on native through `expo-sqlite`, while `.web.ts` is empty because importing `expo-sqlite` on web breaks the dev bundle. `reminders.web.ts` is a no-op stub so `expo-notifications` never loads in the browser. After adding a new `.web.ts` file, restart Metro with `--clear`, or the native module will keep being served on web.
- **Dates** (`src/lib/dates.ts`): all day keys are local-time `YYYY-MM-DD` strings, compared lexically (for example, `key > today` means a future day). Months are `{ year, month }` with a 0-based month. Weeks start on Monday everywhere: calendars (`Weekdays`, `monthCells`) and weekly stats (`weekStart`).
- **Theming**: `src/constants/theme.ts` defines the light/dark `Colors`. `useTheme()` returns the active palette, and `ThemedText`/`ThemedView` apply it. Habit colors are either presets (`src/constants/habit-colors.ts`) or any hue + shade picked on the color sliders (`hueToColor` in `src/lib/colors.ts`), pastels included. Never hard-code white text on a habit color. Use `textOn(color)`, which keeps white on vivid colors and switches to dark text on light ones. A partly done day uses the habit color with alpha `59` appended (`${color}59`). `MonthGrid` (`compact` on the cards, `full` with tap-to-cycle on the detail screen) and `BarChart` are the shared visual components.
- **Web**: `web.output` is `"single"` (SPA). Server output caused hydration mismatches between the server's light theme and the client's dark theme. Use `@/hooks/use-color-scheme` rather than React Native's `useColorScheme` in components that render on web.
- **Icons**: `expo-symbols` `SymbolView` takes SF Symbol names for iOS and Material Symbol names for Android/web, e.g. `{ ios: 'chevron.left', android: 'chevron_left', web: 'chevron_left' }`.
