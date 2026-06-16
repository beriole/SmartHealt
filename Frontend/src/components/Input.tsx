import React, { useState } from 'react';
import { TextInput, TextInputProps, View, StyleSheet } from 'react-native';
import { useTheme } from '@/theme';
import { AppText } from './AppText';

interface InputProps extends TextInputProps {
  label: string;
  error?: string;
  helper?: string;
  required?: boolean;
}

export function Input({
  label,
  error,
  helper,
  required,
  style,
  ...rest
}: InputProps) {
  const theme = useTheme();
  const [focused, setFocused] = useState(false);

  const borderColor = error
    ? theme.colors.destructive
    : focused
    ? theme.colors.ring
    : theme.colors.border;

  return (
    <View style={styles.wrapper}>
      <AppText variant="small" weight="medium" color={theme.colors.textSecondary}>
        {label}
        {required ? ' *' : ''}
      </AppText>
      <TextInput
        placeholderTextColor={theme.colors.textSecondary}
        onFocus={e => {
          setFocused(true);
          rest.onFocus?.(e);
        }}
        onBlur={e => {
          setFocused(false);
          rest.onBlur?.(e);
        }}
        style={[
          styles.input,
          {
            borderColor,
            borderRadius: theme.radius.md,
            color: theme.colors.foreground,
            backgroundColor: theme.colors.surface,
          },
          style,
        ]}
        {...rest}
      />
      {error ? (
        <AppText variant="caption" color={theme.colors.destructive}>
          {error}
        </AppText>
      ) : helper ? (
        <AppText variant="caption" color={theme.colors.textSecondary}>
          {helper}
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: 6 },
  input: {
    minHeight: 48,
    borderWidth: 1,
    paddingHorizontal: 14,
    fontSize: 16,
  },
});
