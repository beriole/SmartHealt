import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme } from '@/theme';
import { AppText } from './AppText';

type Tone = 'neutral' | 'success' | 'warning' | 'danger' | 'info';

interface BadgeProps {
  label: string;
  tone?: Tone;
}

export function Badge({ label, tone = 'neutral' }: BadgeProps) {
  const theme = useTheme();

  const toneColor: Record<Tone, string> = {
    neutral: theme.colors.textSecondary,
    success: theme.colors.success,
    warning: theme.colors.warning,
    danger: theme.colors.destructive,
    info: theme.colors.primary,
  };
  const color = toneColor[tone];

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: color + '1A', // 10% d'opacité, fond teinté
          borderRadius: theme.radius.pill,
        },
      ]}
    >
      <AppText variant="label" color={color}>
        {label}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
});
