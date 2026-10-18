import { SymbolView, type SymbolViewProps } from 'expo-symbols';
import { Pressable, StyleSheet } from 'react-native';

import { useTheme } from '@/hooks/use-theme';

type IconButtonProps = {
  icon: SymbolViewProps['name'];
  label: string;
  onPress: () => void;
  primary?: boolean;
  disabled?: boolean;
};

export function IconButton({ icon, label, onPress, primary, disabled }: IconButtonProps) {
  const theme = useTheme();

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityLabel={label}
      hitSlop={4}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: primary ? theme.text : theme.backgroundElement },
        disabled && styles.disabled,
        pressed && styles.pressed,
      ]}>
      <SymbolView name={icon} size={18} tintColor={primary ? theme.background : theme.text} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabled: {
    opacity: 0.3,
  },
  pressed: {
    opacity: 0.7,
  },
});
