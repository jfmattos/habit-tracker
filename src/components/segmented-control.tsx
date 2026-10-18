import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { feedback } from '@/lib/feedback';

type SegmentedControlProps<T extends string | number> = {
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
};

export function SegmentedControl<T extends string | number>({
  options,
  value,
  onChange,
}: SegmentedControlProps<T>) {
  const theme = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundElement }]}>
      {options.map((option) => (
        <Pressable
          key={option.value}
          onPress={() => {
            feedback.select();
            onChange(option.value);
          }}
          accessibilityState={{ selected: option.value === value }}
          style={[styles.segment, option.value === value && { backgroundColor: theme.backgroundSelected }]}>
          <ThemedText type="smallBold" themeColor={option.value === value ? 'text' : 'textSecondary'}>
            {option.label}
          </ThemedText>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    padding: 3,
    borderRadius: Spacing.three,
  },
  segment: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.two,
    borderRadius: Spacing.three - 3,
  },
});
