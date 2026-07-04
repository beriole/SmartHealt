import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Check } from 'lucide-react-native';
import { useTheme } from '@/theme';
import { AppText } from './AppText';

interface StepProgressProps {
  /** Libellés des étapes (ex. ['Identité', 'Vérification', 'Profil']). */
  steps: string[];
  /** Index de l'étape courante (0-based). */
  current: number;
}

export function StepProgress({ steps, current }: StepProgressProps) {
  const theme = useTheme();

  return (
    <View style={styles.wrapper}>
      {steps.map((label, i) => {
        const done = i < current;
        const active = i === current;
        const reached = done || active;
        const circleBg = done
          ? theme.colors.secondary
          : active
          ? theme.colors.primary
          : theme.colors.surfaceContainerHigh;
        const textColor = reached ? theme.colors.primaryOn : theme.colors.outline;

        return (
          <React.Fragment key={label}>
            <View style={styles.stepItem}>
              <View style={[styles.circle, { backgroundColor: circleBg }]}>
                {done ? (
                  <Check size={16} color={theme.colors.primaryOn} />
                ) : (
                  <AppText variant="label" weight="bold" color={textColor}>
                    {i + 1}
                  </AppText>
                )}
              </View>
              <AppText
                variant="label"
                color={active ? theme.colors.primary : theme.colors.outline}
                style={styles.label}
              >
                {label}
              </AppText>
            </View>
            {i < steps.length - 1 ? (
              <View
                style={[
                  styles.line,
                  {
                    backgroundColor: i < current
                      ? theme.colors.secondary
                      : theme.colors.border,
                  },
                ]}
              />
            ) : null}
          </React.Fragment>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { flexDirection: 'row', alignItems: 'center' },
  stepItem: { alignItems: 'center', gap: 6, width: 76 },
  circle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: { textAlign: 'center' },
  line: { flex: 1, height: 2, marginBottom: 22, borderRadius: 1 },
});
