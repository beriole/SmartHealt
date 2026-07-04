import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, {
  Defs,
  LinearGradient,
  Stop,
  Rect,
  Path,
  Circle,
  G,
} from 'react-native-svg';
import { AppText } from './AppText';
import { useTheme } from '@/theme';

interface BrandLogoProps {
  /** Côté du badge carré (px). */
  size?: number;
  /** Affiche le mot « SmartHealth » à droite du symbole. */
  withWordmark?: boolean;
  /** Taille du mot (par défaut proportionnelle). */
  wordmarkSize?: number;
}

/**
 * Logo SmartHealth — « Trust & Vitality ».
 * Squircle dégradé bleu médical (confiance), croix de soin blanche (santé)
 * et battement ECG vert vitalité (vie). 100 % vectoriel, sans emoji.
 */
export function BrandLogo({ size = 56, withWordmark, wordmarkSize }: BrandLogoProps) {
  const theme = useTheme();
  const r = size * 0.28;

  const mark = (
    <Svg width={size} height={size} viewBox="0 0 48 48">
      <Defs>
        <LinearGradient id="shBg" x1="0.15" y1="0" x2="0.85" y2="1">
          <Stop offset="0" stopColor="#2E7DFF" />
          <Stop offset="1" stopColor="#002D72" />
        </LinearGradient>
        <LinearGradient id="shGloss" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#FFFFFF" stopOpacity={0.16} />
          <Stop offset="1" stopColor="#FFFFFF" stopOpacity={0} />
        </LinearGradient>
      </Defs>

      {/* Badge dégradé */}
      <Rect x="0" y="0" width="48" height="48" rx="13" fill="url(#shBg)" />
      {/* Reflet doux */}
      <Rect x="0" y="0" width="48" height="26" rx="13" fill="url(#shGloss)" />

      {/* Croix de soin (barres arrondies blanches) */}
      <G>
        <Rect x="20" y="10.5" width="8" height="27" rx="3" fill="#FFFFFF" />
        <Rect x="10.5" y="20" width="27" height="8" rx="3" fill="#FFFFFF" />
      </G>

      {/* Battement ECG vert vitalité, traversant la barre horizontale */}
      <Path
        d="M11 24 H18.5 L20.5 24 L22.4 16.6 L25.6 31.4 L27.6 24 L29.5 24 H37"
        stroke="#20C168"
        strokeWidth={2.4}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      {/* Point de pulsation */}
      <Circle cx="37" cy="24" r="2.2" fill="#20C168" />
    </Svg>
  );

  if (!withWordmark) {
    return (
      <View style={[styles.badge, { width: size, height: size, borderRadius: r }]}>
        {mark}
      </View>
    );
  }

  return (
    <View style={styles.row}>
      {mark}
      <AppText
        weight="bold"
        color={theme.colors.primaryDark}
        style={[styles.word, { fontSize: wordmarkSize ?? size * 0.42 }]}
      >
        SmartHealth
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  word: { letterSpacing: -0.5 },
});
