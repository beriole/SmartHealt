import React from 'react';
import { Text, TextProps, TextStyle } from 'react-native';
import { useTheme } from '@/theme';

type Variant = 'h1' | 'h2' | 'h3' | 'body' | 'small' | 'caption';
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
    body: sizes.body,
    small: sizes.small,
    caption: sizes.caption,
  };

  const defaultWeight: Record<Variant, Weight> = {
    h1: 'bold',
    h2: 'bold',
    h3: 'semibold',
    body: 'regular',
    small: 'regular',
    caption: 'medium',
  };

  const fontSize = variantSize[variant];
  const finalWeight = weight ?? defaultWeight[variant];

  const textStyle: TextStyle = {
    fontSize,
    lineHeight: Math.round(fontSize * theme.typography.lineHeights.normal),
    fontWeight: theme.typography.weights[finalWeight] as TextStyle['fontWeight'],
    color: color ?? theme.colors.foreground,
    textAlign: center ? 'center' : undefined,
  };

  return <Text style={[textStyle, style]} {...rest} />;
}
