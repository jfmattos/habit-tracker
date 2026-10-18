import { Alert, Platform } from 'react-native';

import { deleteHabit, type Habit } from '@/store/habits';

/**
 * Asks before deleting a habit and its history. `onDeleted` runs after deleting;
 * `onCancel` runs if the user keeps the habit (e.g. to close a swiped-open row).
 */
export function confirmDeleteHabit(
  habit: Habit,
  { onDeleted, onCancel }: { onDeleted?: () => void; onCancel?: () => void } = {}
) {
  const remove = () => {
    deleteHabit(habit.id);
    onDeleted?.();
  };
  const message = `Delete "${habit.name}" and all of its history?`;

  if (Platform.OS === 'web') {
    if (window.confirm(message)) {
      remove();
    } else {
      onCancel?.();
    }
    return;
  }

  Alert.alert(
    'Delete habit',
    message,
    [
      { text: 'Cancel', style: 'cancel', onPress: onCancel },
      { text: 'Delete', style: 'destructive', onPress: remove },
    ],
    { cancelable: true, onDismiss: onCancel }
  );
}
