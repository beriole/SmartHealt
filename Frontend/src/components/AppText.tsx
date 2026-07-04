import React from 'react';
import { Text, TextProps, TextStyle } from 'react-native';
import { useTheme } from '@/theme';
import { interFontFamily, FontWeightValue } from '@/theme/tokens';

type Variant = 'h1' | 'h2' | 'h3' | 'bodyLg' | 'body' | 'small' | 'caption' | 'label';
type Weight = 'regular' | 'medium' | 'semibold' | 'bold';

interface AppTextProps extends TextProps {
  variant?: Variant;
  weight?: Weight;
  color?: string;
  center?: boolean;
}

export function AppText({
  variant = 'body',
  weight,
  color,
  center,
  style,
  ...rest
}: AppTextProps) {
  const theme = useTheme();
  const sizes = theme.typography.sizes;

  const variantSize: Record<Variant, number> = {
    h1: sizes.h1,
    h2: sizes.h2,
    h3: sizes.h3,
    bodyLg: sizes.bodyLg,
    body: sizes.body,
    small: sizes.small,
    caption: sizes.caption,
    label: sizes.caption,
  };

  const defaultWeight: Record<Variant, Weight> = {
    h1: 'bold',
    h2: 'bold',
    h3: 'semibold',
    bodyLg: 'regular',
    body: 'regular',
    small: 'regular',
    caption: 'medium',
    label: 'semibold',
  };

  // Interlignage serré pour les titres, normal pour le corps.
  const lineMultiplier =
    variant === 'h1' || variant === 'h2' || variant === 'h3'
      ? theme.typography.lineHeights.tight
      : theme.typography.lineHeights.normal;

  const fontSize = variantSize[variant];
  const finalWeight = weight ?? defaultWeight[variant];
  const weightValue = theme.typography.weights[finalWeight] as FontWeightValue;

  const textStyle: TextStyle = {
    fontSize,
    lineHeight: Math.round(fontSize * lineMultiplier),
    fontFamily: interFontFamily[weightValue],
    color: color ?? theme.colors.foreground,
    textAlign: center ? 'center' : undefined,
    letterSpacing:
      variant === 'label' ? 0.8 : variant === 'h1' || variant === 'h2' ? -0.3 : undefined,
  };

  return <Text style={[textStyle, style]} {...rest} />;
}
