/** Échelle d'espacement 4/8pt. */
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
} as const;

/** Rayons de bordure. */
export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  pill: 999,
} as const;

/**
 * Échelle typographique (corps mobile ≥ 16px, interligne 1.5).
 * Familles : Figtree (titres) / Noto Sans (corps) — à lier nativement.
 */
export const typography = {
  fonts: {
    heading: 'Figtree',
    body: 'NotoSans',
  },
  sizes: {
    caption: 12,
    small: 14,
    body: 16,
    bodyLg: 18,
    h3: 24,
    h2: 28,
    h1: 32,
  },
  weights: {
    regular: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },
  lineHeights: {
    tight: 1.25,
    normal: 1.5,
    relaxed: 1.75,
  },
} as const;

/** Cibles tactiles minimales (Apple HIG / Material). */
export const touch = {
  minTarget: 44,
} as const;

export type Spacing = typeof spacing;
export type Radius = typeof radius;
export type Typography = typeof typography;
