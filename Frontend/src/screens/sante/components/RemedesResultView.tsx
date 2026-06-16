import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Leaf } from 'lucide-react-native';
import { AppText, Card, Section, BulletList } from '@/components';
import { useTheme } from '@/theme';
import { MedecineTraditionnelleResult } from '@/types';

export function RemedesResultView({
  result,
}: {
  result: MedecineTraditionnelleResult;
}) {
  const theme = useTheme();

  return (
    <View>
      {result.avertissement ? (
        <Card style={[styles.warn, { backgroundColor: theme.colors.muted }]}>
          <AppText variant="small" color={theme.colors.textSecondary}>
            {result.avertissement}
          </AppText>
        </Card>
      ) : null}

      {result.remedes?.map((r, i) => (
        <Section key={i} title={r.nom}>
          <Card style={styles.card}>
            {r.plantes_utilisees?.length ? (
              <View style={styles.row}>
                <Leaf size={16} color={theme.colors.primary} />
                <AppText variant="small" color={theme.colors.textSecondary} style={styles.flex}>
                  {r.plantes_utilisees.join(', ')}
                </AppText>
              </View>
            ) : null}

            {r.ingredients?.length ? (
              <BulletList
                items={r.ingredients.map(ing => `${ing.nom} — ${ing.quantite}`)}
              />
            ) : null}

            <AppText variant="small" weight="semibold">Préparation</AppText>
            <AppText variant="small" color={theme.colors.textSecondary}>
              {r.preparation}
            </AppText>

            <AppText variant="small" color={theme.colors.textSecondary}>
              {r.mode_utilisation} · {r.frequence} · {r.duree}
            </AppText>

            {r.precautions?.length ? (
              <BulletList items={r.precautions} tone={theme.colors.warning} />
            ) : null}
            {r.contre_indications?.length ? (
              <BulletList items={r.contre_indications} tone={theme.colors.destructive} />
            ) : null}
          </Card>
        </Section>
      ))}

      {result.quand_consulter?.length ? (
        <Section title="Quand consulter un médecin">
          <BulletList items={result.quand_consulter} tone={theme.colors.destructive} />
        </Section>
      ) : null}

      {result.disclaimer ? (
        <AppText variant="caption" color={theme.colors.textSecondary} style={styles.disclaimer}>
          {result.disclaimer}
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  warn: { marginBottom: 4 },
  card: { gap: 6 },
  row: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  flex: { flex: 1 },
  disclaimer: { marginTop: 24, fontStyle: 'italic' },
});
