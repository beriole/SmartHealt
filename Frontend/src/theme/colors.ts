/**
 * Palette SmartHealth — design system « Trust & Vitality » (maquette Stitch).
 * Bleu médical (#0052CC) pour la confiance et l'autorité clinique,
 * vert vitalité (#2ECC71 / #6BFE9C) pour la santé et les actions positives.
 * Tokens Material-3 complets, déclinés light ET dark en parallèle.
 */
export const lightColors = {
  // --- Brand ---
  primary: '#0052CC', // bleu médical principal (CTA, marque)
  primaryDark: '#003D9B', // bleu profond (titres, hero)
  primaryOn: '#FFFFFF',
  primaryContainer: '#DAE2FF',
  onPrimaryContainer: '#001848',

  secondary: '#006D37', // vert vitalité (texte succès)
  secondaryOn: '#FFFFFF',
  secondaryContainer: '#6BFE9C',
  onSecondaryContainer: '#00743A',

  tertiary: '#8A5A00', // ambre (alertes douces)
  tertiaryOn: '#FFFFFF',
  tertiaryContainer: '#FFDDB9',
  onTertiaryContainer: '#663E00',

  accent: '#0052CC',
  accentOn: '#FFFFFF',

  // --- Surfaces (élévation tonale M3) ---
  background: '#FAF8FF',
  surface: '#FFFFFF', // surface-container-lowest (cartes)
  surfaceAlt: '#F2F3FF', // surface-container-low
  surfaceContainer: '#EAEDFF',
  surfaceContainerHigh: '#E2E7FF',
  surfaceContainerHighest: '#DAE2FD',
  surfaceVariant: '#DAE2FD',
  muted: '#EAEDFF',

  // --- Texte & contours ---
  foreground: '#131B2E', // on-surface / on-background
  textSecondary: '#434654', // on-surface-variant
  textOnMuted: '#434654',
  outline: '#737685',
  border: '#C3C6D6', // outline-variant
  ring: '#0052CC',

  // --- Statuts ---
  success: '#16A34A',
  warning: '#D97706',
  destructive: '#BA1A1A',
  destructiveOn: '#FFFFFF',
};

export const darkColors: typeof lightColors = {
  // --- Brand ---
  primary: '#B2C5FF',
  primaryDark: '#DAE2FF',
  primaryOn: '#002A6E',
  primaryContainer: '#0040A2',
  onPrimaryContainer: '#DAE2FF',

  secondary: '#4AE183',
  secondaryOn: '#00210C',
  secondaryContainer: '#005228',
  onSecondaryContainer: '#6BFE9C',

  tertiary: '#FFB961',
  tertiaryOn: '#2B1700',
  tertiaryContainer: '#663E00',
  onTertiaryContainer: '#FFDDB9',

  accent: '#B2C5FF',
  accentOn: '#002A6E',

  // --- Surfaces ---
  background: '#111421',
  surface: '#1A1E2D', // cartes
  surfaceAlt: '#1F2334',
  surfaceContainer: '#23283A',
  surfaceContainerHigh: '#2D3346',
  surfaceContainerHighest: '#383E52',
  surfaceVariant: '#434654',
  muted: '#23283A',

  // --- Texte & contours ---
  foreground: '#EEF0FF',
  textSecondary: '#C3C6D6',
  textOnMuted: '#C3C6D6',
  outline: '#8D90A0',
  border: '#434654',
  ring: '#B2C5FF',

  // --- Statuts ---
  success: '#4ADE80',
  warning: '#FBBF24',
  destructive: '#FFB4AB',
  destructiveOn: '#690005',
};

export type ColorTokens = typeof lightColors;
