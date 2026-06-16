import React from 'react';
import { View, StyleSheet } from 'react-native';
import { AppText } from './AppText';

interface SectionProps {
  title: string;
  children: React.ReactNode;
}

export function Section({ title, children }: SectionProps) {
  return (
    <View style={styles.section}>
      <AppText variant="small" weight="bold">
        {title.toUpperCase()}
      </AppText>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: 8, marginTop: 20 },
});
