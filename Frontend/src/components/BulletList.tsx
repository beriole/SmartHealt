import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme } from '@/theme';
import { AppText } from './AppText';

interface BulletListProps {
  items: string[];
  /** Couleur de la puce (par défaut : primary). */
  tone?: string;
}

export function BulletList({ items, tone }: BulletListProps) {
  const theme = useTheme();
  if (!items?.length) {
    return null;
  }
  return (
    <View style={styles.list}>
      {items.map((item, i) => (
        <View key={i} style={styles.row}>
          <View
            style={[
              styles.dot,
              { backgroundColor: tone ?? theme.colors.primary },
            ]}
          />
          <AppText style={styles.text} color={theme.colors.foreground}>
            {item}
          </AppText>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  list: { gap: 6 },
  row: { flexDirection: 'row', gap: 8, alignItems: 'flex-start' },
  dot: { width: 6, height: 6, borderRadius: 3, marginTop: 8 },
  text: { flex: 1 },
});
