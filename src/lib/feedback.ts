import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from 'expo-audio';
import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

import { getSettings } from '@/store/settings';

const sources = {
  tick: require('@/assets/sounds/tick.wav'),
  chime: require('@/assets/sounds/chime.wav'),
  fanfare: require('@/assets/sounds/fanfare.wav'),
};

type Sound = keyof typeof sources;

let players: Record<Sound, AudioPlayer> | null = null;

function play(sound: Sound) {
  if (!getSettings().sound) return;
  if (!players) {
    // UI sounds respect the silent switch and never stop the user's music
    setAudioModeAsync({ playsInSilentMode: false, interruptionMode: 'mixWithOthers' }).catch(
      () => {}
    );
    players = {
      tick: createAudioPlayer(sources.tick),
      chime: createAudioPlayer(sources.chime),
      fanfare: createAudioPlayer(sources.fanfare),
    };
  }
  const player = players[sound];
  player.seekTo(0).catch(() => {});
  player.play();
}

function haptic(effect: () => Promise<void>) {
  if (!getSettings().haptics || Platform.OS === 'web') return;
  effect().catch(() => {});
}

/** The reward layer of the core loop: every check-in gets felt and heard */
export const feedback = {
  /** One more check-in on a multi-check-in habit */
  progress() {
    haptic(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light));
    play('tick');
  },
  /** A habit is done for the day */
  goal() {
    haptic(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success));
    play('chime');
  },
  /** A challenge is won */
  win() {
    haptic(async () => {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    });
    play('fanfare');
  },
  undo() {
    haptic(() => Haptics.selectionAsync());
  },
  select() {
    haptic(() => Haptics.selectionAsync());
  },
};
