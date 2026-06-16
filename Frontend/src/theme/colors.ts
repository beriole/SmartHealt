/**
 * Palette de couleurs SmartHealth (design system « Accessible & Ethical »).
 * Vert pharmacie + bleu confiance. Conçu light ET dark en parallèle.
 */
export const lightColors = {
  primary: '#15803D', // vert pharmacie
  primaryOn: '#FFFFFF',
  secondary: '#22C55E',
  accent: '#0369A1', // bleu confiance
  accentOn: '#FFFFFF',

  background: '#F0FDF4',
  surface: '#FFFFFF',
  surfaceAlt: '#F6FBF7',
  muted: '#E8F0F1',

  foreground: '#14532D',
  textSecondary: '#3F6B52',
  textOnMuted: '#3F6B52',

  border: '#BBF7D0',
  ring: '#15803D',

  success: '#16A34A',
  warning: '#D97706',
  destructive: '#DC2626',
  destructiveOn: '#FFFFFF',
};

export const darkColors: typeof lightColors = {
  primary: '#22C55E',
  primaryOn: '#052e16',
  secondary: '#16A34A',
  accent: '#38BDF8',
  accentOn: '#052e16',

  background: '#0B1410',
  surface: '#12201A',
  surfaceAlt: '#16271F',
  muted: '#1E2F27',

  foreground: '#ECFDF3',
  textSecondary: '#A7C4B5',
  textOnMuted: '#A7C4B5',

  border: '#1F3A2C',
  ring: '#22C55E',

  success: '#22C55E',
  warning: '#F59E0B',
  destructive: '#F87171',
  destructiveOn: '#1B0A0A',
};

export type ColorTokens = typeof lightColors;
