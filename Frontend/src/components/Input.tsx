import React, { useState } from 'react';
import {
  TextInput,
  TextInputProps,
  View,
  Pressable,
  StyleSheet,
} from 'react-native';
import { Eye, EyeOff } from 'lucide-react-native';
import { useTheme } from '@/theme';
import { interFontFamily } from '@/theme/tokens';
import { AppText } from './AppText';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  helper?: string;
  required?: boolean;
  /** Icône optionnelle rendue à gauche du champ. */
  leftIcon?: React.ReactNode;
  /** Élément optionnel rendu à droite (ignoré si isPassword). */
  rightAccessory?: React.ReactNode;
  /** Champ mot de passe : masquage + bouton œil accessible intégré. */
  isPassword?: boolean;
}

export function Input({
  label,
  error,
  helper,
  required,
  leftIcon,
  rightAccessory,
  isPassword,
  accessibilityLabel,
  style,
  ...rest
}: InputProps) {
  const theme = useTheme();
  const [focused, setFocused] = useState(false);
  const [hidden, setHidden] = useState(true);

  const borderColor = error
    ? theme.colors.destructive
    : focused
    ? theme.colors.ring
    : theme.colors.border;

  return (
    <View style={styles.wrapper}>
      {label ? (
        <AppText
          variant="label"
          color={theme.colors.textSecondary}
          style={styles.label}
        >
          {label.toUpperCase()}
          {required ? ' *' : ''}
        </AppText>
      ) : null}
      <View
        style={[
          styles.field,
          rest.multiline && styles.fieldMultiline,
          {
            borderColor,
            borderWidth: focused ? 1.5 : 1,
            borderRadius: theme.radius.md,
            backgroundColor: theme.colors.surface,
          },
        ]}
      >
        {leftIcon ? <View style={styles.icon}>{leftIcon}</View> : null}
        <TextInput
          placeholderTextColor={theme.colors.outline}
          textAlignVertical={rest.multiline ? 'top' : 'center'}
          accessibilityLabel={accessibilityLabel ?? label}
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
            rest.multiline && styles.inputMultiline,
            { color: theme.colors.foreground, fontFamily: interFontFamily['400'] },
            style,
          ]}
          {...rest}
          secureTextEntry={isPassword ? hidden : rest.secureTextEntry}
        />
        {isPassword ? (
          <Pressable
            onPress={() => setHidden(h => !h)}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel={
              hidden ? 'Afficher le mot de passe' : 'Masquer le mot de passe'
            }
            style={styles.icon}
          >
            {hidden ? (
              <Eye size={20} color={theme.colors.outline} />
            ) : (
              <EyeOff size={20} color={theme.colors.outline} />
            )}
          </Pressable>
        ) : rightAccessory ? (
          <View style={styles.icon}>{rightAccessory}</View>
        ) : null}
      </View>
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
  wrapper: { gap: 8 },
  label: { marginLeft: 2 },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 52,
    paddingHorizontal: 14,
  },
  fieldMultiline: { alignItems: 'flex-start', minHeight: 110, paddingVertical: 12 },
  icon: { marginHorizontal: 2 },
  input: { flex: 1, fontSize: 16, paddingVertical: 0, minHeight: 52 },
  inputMultiline: { minHeight: 84, paddingVertical: 0 },
});
