import React from 'react';
import { StyleSheet, useWindowDimensions } from 'react-native';
import Svg, { Circle, Defs, RadialGradient, Stop } from 'react-native-svg';
import { useTheme } from '@/theme';

/**
 * Fond décoratif discret pour les écrans d'authentification :
 * halos doux bleu médical + vert vitalité (faible opacité, non distrayant).
 * À placer en premier enfant (position absolue).
 */
export function AuthBackdrop() {
  const theme = useTheme();
  const { width } = useWindowDimensions();
  const blue = theme.colors.primary;
  const green = theme.colors.secondary;

  return (
    <Svg style={StyleSheet.absoluteFill} pointerEvents="none">
      <Defs>
        <RadialGradient id="halo1" cx="50%" cy="50%" r="50%">
          <Stop offset="0" stopColor={blue} stopOpacity={theme.dark ? 0.28 : 0.16} />
          <Stop offset="1" stopColor={blue} stopOpacity={0} />
        </RadialGradient>
        <RadialGradient id="halo2" cx="50%" cy="50%" r="50%">
          <Stop offset="0" stopColor={green} stopOpacity={theme.dark ? 0.22 : 0.14} />
          <Stop offset="1" stopColor={green} stopOpacity={0} />
        </RadialGradient>
      </Defs>
      <Circle cx={width * 0.85} cy={-20} r={170} fill="url(#halo1)" />
      <Circle cx={width * 0.1} cy={140} r={130} fill="url(#halo2)" />
    </Svg>
  );
}
