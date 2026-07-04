import React from 'react';
import { View, StyleSheet } from 'react-native';
import { AppText } from './AppText';

interface SectionProps {
  title: string;
  /** Action optionnelle à droite du titre (ex. « Tout voir »). */
  action?: React.ReactNode;
  children: React.ReactNode;
}

export function Section({ title, action, children }: SectionProps) {
  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <AppText variant="h3" weight="semibold">
          {title}
        </AppText>
        {action}
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: 12, marginTop: 24 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
});
