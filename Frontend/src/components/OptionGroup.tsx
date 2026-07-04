import React from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { useTheme } from '@/theme';
import { AppText } from './AppText';

export interface Option<T extends string> {
  value: T;
  label: string;
  /** Description secondaire (variante card). */
  description?: string;
  /** Élément graphique optionnel (variante card). */
  icon?: React.ReactNode;
}

interface OptionGroupProps<T extends string> {
  label: string;
  options: Option<T>[];
  value?: T;
  onChange: (value: T) => void;
  error?: string;
  required?: boolean;
  /** 'chip' = segmenté côte à côte ; 'card' = cartes empilées avec radio. */
  variant?: 'chip' | 'card';
}

export function OptionGroup<T extends string>({
  label,
  options,
  value,
  onChange,
  error,
  required,
  variant = 'chip',
}: OptionGroupProps<T>) {
  const theme = useTheme();

  return (
    <View style={styles.wrapper}>
      <AppText variant="label" color={theme.colors.textSecondary}>
        {label.toUpperCase()}
        {required ? ' *' : ''}
      </AppText>

      {variant === 'card' ? (
        <View style={styles.cardCol}>
          {options.map(opt => {
            const selected = opt.value === value;
            return (
              <Pressable
                key={opt.value}
                accessibilityRole="radio"
                accessibilityState={{ selected }}
                onPress={() => onChange(opt.value)}
                style={[
                  styles.card,
                  {
                    borderRadius: theme.radius.lg,
                    borderColor: selected ? theme.colors.primary : theme.colors.border,
                    borderWidth: selected ? 2 : 1,
                    backgroundColor: theme.colors.surface,
                  },
                ]}
              >
                {opt.icon ? <View style={styles.cardIcon}>{opt.icon}</View> : null}
                <View style={styles.cardText}>
                  <AppText weight="bold">{opt.label}</AppText>
                  {opt.description ? (
                    <AppText variant="small" color={theme.colors.textSecondary}>
                      {opt.description}
                    </AppText>
                  ) : null}
                </View>
                <View
                  style={[
                    styles.radio,
                    {
                      borderColor: selected ? theme.colors.primary : theme.colors.outline,
                    },
                  ]}
                >
                  {selected ? (
                    <View
                      style={[styles.radioDot, { backgroundColor: theme.colors.primary }]}
                    />
                  ) : null}
                </View>
              </Pressable>
            );
          })}
        </View>
      ) : (
        <View style={styles.row}>
          {options.map(opt => {
            const selected = opt.value === value;
            return (
              <Pressable
                key={opt.value}
                accessibilityRole="radio"
                accessibilityState={{ selected }}
                onPress={() => onChange(opt.value)}
                style={[
                  styles.chip,
                  {
                    borderRadius: theme.radius.md,
                    borderColor: selected ? theme.colors.primary : theme.colors.border,
                    backgroundColor: selected
                      ? theme.colors.primary
                      : theme.colors.surface,
                  },
                ]}
              >
                <AppText
                  weight={selected ? 'semibold' : 'regular'}
                  color={selected ? theme.colors.primaryOn : theme.colors.foreground}
                >
                  {opt.label}
                </AppText>
              </Pressable>
            );
          })}
        </View>
      )}

      {error ? (
        <AppText variant="caption" color={theme.colors.destructive}>
          {error}
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: 8 },
  row: { flexDirection: 'row', gap: 8 },
  chip: {
    flex: 1,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  cardCol: { gap: 12 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    minHeight: 64,
  },
  cardIcon: {},
  cardText: { flex: 1, gap: 2 },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioDot: { width: 11, height: 11, borderRadius: 6 },
});
