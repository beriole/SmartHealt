import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  View,
  ViewStyle,
} from 'react-native';
import { useTheme } from '@/theme';
import { AppText } from './AppText';

type Variant = 'primary' | 'secondary' | 'destructive' | 'ghost' | 'tonal';
type Size = 'md' | 'lg';

interface ButtonProps {
  label: string;
  onPress?: () => void;
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  /** Icône optionnelle rendue avant le label. */
  icon?: React.ReactNode;
  style?: ViewStyle;
}

export function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'lg',
  loading = false,
  disabled = false,
  fullWidth = true,
  icon,
  style,
}: ButtonProps) {
  const theme = useTheme();
  const isDisabled = disabled || loading;

  const bg: Record<Variant, string> = {
    primary: theme.colors.primary,
    secondary: 'transparent',
    tonal: theme.colors.surfaceContainerHigh,
    destructive: theme.colors.destructive,
    ghost: 'transparent',
  };
  const fg: Record<Variant, string> = {
    primary: theme.colors.primaryOn,
    secondary: theme.colors.primary,
    tonal: theme.colors.primary,
    destructive: theme.colors.destructiveOn,
    ghost: theme.colors.primary,
  };
  const isOutlined = variant === 'secondary';
  const isSolid = variant === 'primary' || variant === 'destructive';

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      disabled={isDisabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        size === 'lg' ? styles.lg : styles.md,
        {
          backgroundColor: bg[variant],
          borderRadius: theme.radius.md,
          opacity: isDisabled ? 0.5 : pressed ? 0.9 : 1,
          transform: [{ scale: pressed && !isDisabled ? 0.98 : 1 }],
          alignSelf: fullWidth ? 'stretch' : 'flex-start',
          borderWidth: isOutlined ? 1.5 : 0,
          borderColor: isOutlined ? theme.colors.primary : undefined,
        },
        isSolid && !isDisabled && theme.elevation.level1,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={fg[variant]} />
      ) : (
        <View style={styles.content}>
          {icon}
          <AppText weight="bold" color={fg[variant]}>
            {label}
          </AppText>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  lg: { minHeight: 54, paddingHorizontal: 24 },
  md: { minHeight: 46, paddingHorizontal: 20 },
  content: { flexDirection: 'row', alignItems: 'center', gap: 8 },
});
