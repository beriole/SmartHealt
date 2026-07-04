import React from 'react';
import { View, ViewStyle, StyleProp, StyleSheet } from 'react-native';
import { useTheme } from '@/theme';

interface CardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  /** Padding interne (16 par défaut, 24 = lg). */
  padding?: 'sm' | 'md' | 'lg';
  /** Liseré latéral coloré (pattern « hero » de la maquette). */
  accent?: boolean;
  /** Niveau d'élévation tonale. */
  elevated?: boolean;
}

export function Card({
  children,
  style,
  padding = 'md',
  accent = false,
  elevated = true,
}: CardProps) {
  const theme = useTheme();
  const pad = padding === 'lg' ? 24 : padding === 'sm' ? 12 : 16;

  return (
    <View
      style={[
        {
          backgroundColor: theme.colors.surface,
          borderRadius: theme.radius.lg,
          padding: pad,
          borderLeftWidth: accent ? 4 : 0,
          borderLeftColor: accent ? theme.colors.primary : undefined,
        },
        elevated && theme.elevation.level1,
        style,
      ]}
    >
      {children}
    </View>
  );
}

// Conservé pour compat éventuelle.
export const cardStyles = StyleSheet.create({});
