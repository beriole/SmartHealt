import React from 'react';
import { View, StyleSheet } from 'react-native';
import { AppText } from './AppText';
import { BrandLogo } from './BrandLogo';
import { useTheme } from '@/theme';

interface ScreenHeaderProps {
  /** Grand titre de la page. */
  title: string;
  subtitle?: string;
  /** Action à droite (ex. cloche de notifications). */
  right?: React.ReactNode;
  /** Affiche la marque SmartHealth (logo + mot) au-dessus du titre. */
  showBrand?: boolean;
}

/**
 * En-tête de page cohérent pour les écrans racines d'onglet :
 * marque SmartHealth (logo) + grand titre + sous-titre, sur fond surface.
 */
export function ScreenHeader({ title, subtitle, right, showBrand = true }: ScreenHeaderProps) {
  const theme = useTheme();
  return (
    <View style={[styles.wrap, { backgroundColor: theme.colors.surface, borderBottomColor: theme.colors.border }]}>
      <View style={styles.topRow}>
        {showBrand ? <BrandLogo size={26} withWordmark wordmarkSize={19} /> : <View />}
        {right ? <View>{right}</View> : null}
      </View>
      <AppText variant="h2" style={styles.title}>
        {title}
      </AppText>
      {subtitle ? (
        <AppText color={theme.colors.textSecondary} style={styles.subtitle}>
          {subtitle}
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 32,
  },
  title: { marginTop: 14 },
  subtitle: { marginTop: 2 },
});
