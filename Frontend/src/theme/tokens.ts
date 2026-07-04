/** Échelle d'espacement 4/8pt (rythme grille maquette). */
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
} as const;

/** Rayons de bordure (formes « Rounded » du design system). */
export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  pill: 999,
} as const;

/**
 * Échelle typographique « Trust & Vitality ».
 * Police Inter (fallback système si non liée nativement).
 */
export const typography = {
  fonts: {
    heading: 'Inter',
    body: 'Inter',
  },
  sizes: {
    caption: 12, // label-md
    small: 14, // body-sm
    body: 16, // body-md
    bodyLg: 18, // body-lg
    h3: 24, // headline-md
    h2: 28, // headline-lg-mobile
    h1: 32, // display-lg
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

/**
 * Ombres ambiantes teintées (élévation tonale du design system).
 * Level 1 = cartes, Level 2 = modales / pop-overs.
 */
export const elevation = {
  level1: {
    shadowColor: '#0052CC',
    shadowOpacity: 0.08,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  level2: {
    shadowColor: '#0F172A',
    shadowOpacity: 0.12,
    shadowRadius: 30,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8,
  },
} as const;

/**
 * Familles Inter chargées via @expo-google-fonts/inter.
 * Sur Android, une police custom exige une fontFamily par graisse
 * (le fontWeight seul ne suffit pas). Mapping poids CSS → famille chargée.
 */
export const interFontFamily = {
  '400': 'Inter_400Regular',
  '500': 'Inter_500Medium',
  '600': 'Inter_600SemiBold',
  '700': 'Inter_700Bold',
} as const;

export type FontWeightValue = keyof typeof interFontFamily;

/** Cibles tactiles minimales (Apple HIG / Material). */
export const touch = {
  minTarget: 44,
} as const;

export type Spacing = typeof spacing;
export type Radius = typeof radius;
export type Typography = typeof typography;
export type Elevation = typeof elevation;
