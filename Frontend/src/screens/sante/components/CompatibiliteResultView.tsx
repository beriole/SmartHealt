import React from 'react';
import { View, StyleSheet } from 'react-native';
import { AppText, Card, Section, BulletList, Badge } from '@/components';
import { useTheme } from '@/theme';
import { CompatibiliteResult, NiveauCompatibilite } from '@/types';

type Tone = 'neutral' | 'success' | 'warning' | 'danger' | 'info';

const NIVEAU: Record<NiveauCompatibilite, { tone: Tone; label: string }> = {
  compatible: { tone: 'success', label: 'Compatible' },
  compatible_avec_precautions: { tone: 'warning', label: 'Avec précautions' },
  non_recommande: { tone: 'danger', label: 'Non recommandé' },
  dangereux: { tone: 'danger', label: 'Dangereux' },
};

const SEVERITE: Record<string, Tone> = {
  faible: 'neutral',
  moderee: 'warning',
  grave: 'danger',
};

export function CompatibiliteResultView({
  result,
}: {
  result: CompatibiliteResult;
}) {
  const theme = useTheme();
  const niveau = NIVEAU[result.niveau_compatibilite];

  return (
    <View>
      <View style={styles.headerRow}>
        <Badge label={niveau.label} tone={niveau.tone} />
        <Badge label={`Risque ${result.score_risque}/100`} tone="info" />
      </View>

      {result.contre_indications?.length ? (
        <Section title="Contre-indications">
          <BulletList items={result.contre_indications} tone={theme.colors.destructive} />
        </Section>
      ) : null}

      {result.interactions_medicamenteuses?.length ? (
        <Section title="Interactions médicamenteuses">
          {result.interactions_medicamenteuses.map((it, i) => (
            <Card key={i} style={styles.card}>
              <View style={styles.between}>
                <AppText weight="semibold" style={styles.flex}>
                  {it.medicament_concerne}
                </AppText>
                <Badge label={it.severite} tone={SEVERITE[it.severite] ?? 'neutral'} />
              </View>
              <AppText variant="small" color={theme.colors.textSecondary}>
                {it.description}
              </AppText>
            </Card>
          ))}
        </Section>
      ) : null}

      {result.effets_secondaires_a_risque?.length ? (
        <Section title="Effets secondaires à risque">
          <BulletList items={result.effets_secondaires_a_risque} tone={theme.colors.warning} />
        </Section>
      ) : null}

      {result.precautions?.length ? (
        <Section title="Précautions">
          <BulletList items={result.precautions} />
        </Section>
      ) : null}

      {result.rapport_detaille ? (
        <Section title="Rapport détaillé">
          <AppText color={theme.colors.textSecondary}>{result.rapport_detaille}</AppText>
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
  headerRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', alignItems: 'center' },
  card: { gap: 6 },
  between: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  flex: { flex: 1 },
  disclaimer: { marginTop: 24, fontStyle: 'italic' },
});
