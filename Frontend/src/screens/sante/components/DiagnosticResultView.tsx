import React from 'react';
import { View, StyleSheet } from 'react-native';
import { TriangleAlert } from 'lucide-react-native';
import {
  AppText,
  Card,
  Section,
  BulletList,
  Badge,
  UrgencyBadge,
} from '@/components';
import { useTheme } from '@/theme';
import { formatFCFA } from '@/lib/format';
import { DiagnosticResult } from '@/types';

export function DiagnosticResultView({ result }: { result: DiagnosticResult }) {
  const theme = useTheme();

  return (
    <View>
      <View style={styles.headerRow}>
        <UrgencyBadge niveau={result.niveau_urgence} />
        {result.specialite_recommandee ? (
          <Badge label={result.specialite_recommandee} tone="info" />
        ) : null}
      </View>

      {result.consultation_obligatoire ? (
        <Card
          style={[
            styles.alert,
            { borderColor: theme.colors.destructive, backgroundColor: theme.colors.muted },
          ]}
        >
          <View style={styles.alertRow}>
            <TriangleAlert size={20} color={theme.colors.destructive} />
            <AppText weight="semibold" color={theme.colors.destructive} style={styles.flex}>
              Une consultation médicale est recommandée avant tout traitement.
            </AppText>
          </View>
        </Card>
      ) : null}

      {result.maladies_probables?.length ? (
        <Section title="Causes probables">
          {result.maladies_probables.map((m, i) => (
            <Card key={i} style={styles.card}>
              <View style={styles.between}>
                <AppText weight="semibold" style={styles.flex}>
                  {m.maladie}
                </AppText>
                <Badge label={`${m.probabilite_pourcent}%`} tone="info" />
              </View>
              <AppText variant="small" color={theme.colors.textSecondary}>
                {m.justification}
              </AppText>
            </Card>
          ))}
        </Section>
      ) : null}

      {result.conduite_a_tenir?.length ? (
        <Section title="Conduite à tenir">
          <BulletList items={result.conduite_a_tenir} />
        </Section>
      ) : null}

      {result.conseils_immediats?.length ? (
        <Section title="Conseils immédiats">
          <BulletList items={result.conseils_immediats} />
        </Section>
      ) : null}

      {result.traitements_recommandes?.length ? (
        <Section title="Traitements suggérés">
          {result.traitements_recommandes.map((t, i) => (
            <Card key={i} style={styles.card}>
              <View style={styles.between}>
                <AppText weight="semibold" style={styles.flex}>
                  {t.nom_medicament}
                </AppText>
                {t.necessite_ordonnance ? (
                  <Badge label="Ordonnance" tone="warning" />
                ) : (
                  <Badge label="Sans ordonnance" tone="success" />
                )}
              </View>
              <AppText variant="small" color={theme.colors.textSecondary}>
                {t.posologie_suggeree} · {t.duree_traitement_jours} j
              </AppText>
              {t.precautions?.length ? (
                <BulletList items={t.precautions} tone={theme.colors.warning} />
              ) : null}
              {t.disponibilite_pharmacies?.length ? (
                <View style={styles.pharmas}>
                  {t.disponibilite_pharmacies.map(p => (
                    <View key={p.id_stock} style={styles.between}>
                      <AppText variant="small" style={styles.flex}>
                        {p.pharmacie}
                      </AppText>
                      <AppText variant="small" weight="semibold" color={theme.colors.primary}>
                        {formatFCFA(p.prix_fcfa)}
                      </AppText>
                    </View>
                  ))}
                </View>
              ) : null}
            </Card>
          ))}
        </Section>
      ) : null}

      {result.signes_alarme?.length ? (
        <Section title="Signes d'alarme — consulter en urgence">
          <BulletList items={result.signes_alarme} tone={theme.colors.destructive} />
        </Section>
      ) : null}

      {result.rapport_preliminaire ? (
        <Section title="Rapport préliminaire">
          <AppText color={theme.colors.textSecondary}>
            {result.rapport_preliminaire}
          </AppText>
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
  alert: { marginTop: 16 },
  alertRow: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  card: { gap: 6 },
  between: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  flex: { flex: 1 },
  pharmas: { gap: 4, marginTop: 4 },
  disclaimer: { marginTop: 24, fontStyle: 'italic' },
});
