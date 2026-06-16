import React from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { useTheme } from '@/theme';
import { AppText } from './AppText';

export interface Option<T extends string> {
  value: T;
  label: string;
}

interface OptionGroupProps<T extends string> {
  label: string;
  options: Option<T>[];
  value?: T;
  onChange: (value: T) => void;
  error?: string;
  required?: boolean;
}

export function OptionGroup<T extends string>({
  label,
  options,
  value,
  onChange,
  error,
  required,
}: OptionGroupProps<T>) {
  const theme = useTheme();

  return (
    <View style={styles.wrapper}>
      <AppText variant="small" weight="medium" color={theme.colors.textSecondary}>
        {label}
        {required ? ' *' : ''}
      </AppText>
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
                  backgroundColor: selected ? theme.colors.primary : theme.colors.surface,
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
      {error ? (
        <AppText variant="caption" color={theme.colors.destructive}>
          {error}
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: 6 },
  row: { flexDirection: 'row', gap: 8 },
  chip: {
    flex: 1,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
});
