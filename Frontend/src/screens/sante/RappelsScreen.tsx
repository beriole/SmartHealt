import React from 'react';
import { ScrollView, View, StyleSheet, ActivityIndicator } from 'react-native';
import { Activity, Pill } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  AppText,
  Badge,
  Button,
  Card,
  Section,
  Screen,
  ErrorState,
} from '@/components';
import { useTheme } from '@/theme';
import { formatDate } from '@/lib/format';
import {
  useRappels,
  usePrisesDuJour,
  useStatsObservance,
  useMarquerPrise,
} from '@/features/rappel/hooks';
import { Prise, StatutPrise } from '@/types';
import { SanteStackParamList } from '@/navigation/types';

type Tone = 'neutral' | 'success' | 'warning' | 'danger' | 'info';
const STATUT_PRISE: Record<StatutPrise, { tone: Tone; label: string }> = {
  en_attente: { tone: 'neutral', label: 'En attente' },
  prise: { tone: 'success', label: 'Prise' },
  manquee: { tone: 'danger', label: 'Manquée' },
  reportee: { tone: 'warning', label: 'Reportée' },
};

function heureDe(iso: string): string {
  return new Date(iso).toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function RappelsScreen() {
  const theme = useTheme();
  const navigation =
    useNavigation<NativeStackNavigationProp<SanteStackParamList>>();
  const stats = useStatsObservance();
  const prises = usePrisesDuJour();
  const rappels = useRappels();
  const marquer = useMarquerPrise();

  if (prises.isLoading || rappels.isLoading) {
    return (
      <Screen>
        <ActivityIndicator style={styles.loader} color={theme.colors.primary} />
      </Screen>
    );
  }
  if (prises.isError || rappels.isError) {
    return (
      <Screen>
        <ErrorState
          onRetry={() => {
            prises.refetch();
            rappels.refetch();
          }}
        />
      </Screen>
    );
  }

  const taux = stats.data?.taux_observance_pourcentage ?? 0;

  return (
    <Screen edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Card accent style={styles.statCard}>
          <View style={styles.statTop}>
            <View style={styles.flex}>
              <AppText variant="label" color={theme.colors.primary}>
                TAUX D'OBSERVANCE
              </AppText>
              <AppText variant="h1" color={theme.colors.primary}>
                {Math.round(taux)}%
              </AppText>
            </View>
            <View
              style={[
                styles.statIcon,
                { backgroundColor: theme.colors.primaryContainer },
              ]}
            >
              <Activity size={24} color={theme.colors.primary} />
            </View>
          </View>
          <View style={[styles.track, { backgroundColor: theme.colors.surfaceContainerHigh }]}>
            <View
              style={[
                styles.fill,
                {
                  width: `${Math.min(Math.max(taux, 0), 100)}%`,
                  backgroundColor: theme.colors.primary,
                },
              ]}
            />
          </View>
          {stats.data ? (
            <AppText variant="small" color={theme.colors.textSecondary}>
              {stats.data.prises_effectuees}/{stats.data.total_prises_passees} prises suivies
            </AppText>
          ) : null}
        </Card>

        <Section title="Prises du jour">
          {prises.data && prises.data.length > 0 ? (
            prises.data.map((p: Prise) => {
              const s = STATUT_PRISE[p.statut_prise];
              return (
                <Card key={p.id_prise} style={styles.priseCard}>
                  <View style={styles.between}>
                    <View style={styles.flex}>
                      <AppText weight="semibold">
                        {p.rappel?.medicament?.nom_commercial ?? 'Médicament'}
                      </AppText>
                      <AppText variant="small" color={theme.colors.textSecondary}>
                        {heureDe(p.date_heure_prevue)}
                      </AppText>
                    </View>
                    <Badge label={s.label} tone={s.tone} />
                  </View>
                  {p.statut_prise === 'en_attente' ? (
                    <View style={styles.actions}>
                      <Button
                        label="Pris"
                        onPress={() => marquer.mutate({ id: p.id_prise, statut: 'prise' })}
                        style={styles.flex}
                      />
                      <Button
                        label="Manqué"
                        variant="secondary"
                        onPress={() => marquer.mutate({ id: p.id_prise, statut: 'manquee' })}
                        style={styles.flex}
                      />
                    </View>
                  ) : null}
                </Card>
              );
            })
          ) : (
            <AppText color={theme.colors.textSecondary}>
              Aucune prise prévue aujourd'hui.
            </AppText>
          )}
        </Section>

        <Section title="Mes traitements">
          {rappels.data && rappels.data.length > 0 ? (
            rappels.data.map(r => (
              <Card key={r.id_rappel} style={styles.rappelCard}>
                <View
                  style={[
                    styles.pillIcon,
                    { backgroundColor: theme.colors.primaryContainer },
                  ]}
                >
                  <Pill size={20} color={theme.colors.primary} />
                </View>
                <View style={styles.flex}>
                  <AppText weight="semibold">
                    {r.medicament?.nom_commercial ?? 'Médicament'}
                  </AppText>
                  <AppText variant="small" color={theme.colors.textSecondary}>
                    {(r.heure_prise ?? []).join(', ')} · du {formatDate(r.date_debut)} au{' '}
                    {formatDate(r.date_fin)}
                  </AppText>
                </View>
              </Card>
            ))
          ) : (
            <AppText color={theme.colors.textSecondary}>
              Aucun traitement programmé.
            </AppText>
          )}
        </Section>

        <Button
          label="Programmer un rappel"
          variant="secondary"
          onPress={() => navigation.navigate('Ordonnances')}
          style={styles.newBtn}
        />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  loader: { marginTop: 32 },
  scroll: { paddingVertical: 16, paddingBottom: 40 },
  statCard: { gap: 12 },
  statTop: { flexDirection: 'row', alignItems: 'flex-start' },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  track: { height: 8, borderRadius: 4, overflow: 'hidden' },
  fill: { height: 8, borderRadius: 4 },
  priseCard: { gap: 12 },
  rappelCard: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  pillIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  between: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  flex: { flex: 1 },
  actions: { flexDirection: 'row', gap: 8 },
  newBtn: { marginTop: 24 },
});
