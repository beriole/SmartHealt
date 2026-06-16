import React from 'react';
import { ScrollView, View, StyleSheet, ActivityIndicator } from 'react-native';
import { RouteProp, useRoute } from '@react-navigation/native';
import { AppText, Badge, Card, Section, Screen, ErrorState } from '@/components';
import { useTheme } from '@/theme';
import { formatFCFA, formatDate } from '@/lib/format';
import { useIntervention } from '@/features/intervention/hooks';
import { ProfilStackParamList } from '@/navigation/types';
import { ACTE_LABEL, STATUT_INTERVENTION } from './InterventionsScreen';

export function InterventionDetailScreen() {
  const theme = useTheme();
  const route = useRoute<RouteProp<ProfilStackParamList, 'InterventionDetail'>>();
  const { data, isLoading, isError, refetch } = useIntervention(route.params.id);

  if (isLoading) {
    return (
      <Screen>
        <ActivityIndicator style={styles.loader} color={theme.colors.primary} />
      </Screen>
    );
  }
  if (isError || !data) {
    return (
      <Screen>
        <ErrorState onRetry={refetch} />
      </Screen>
    );
  }

  const s = STATUT_INTERVENTION[data.statut];
  const infirmier = data.infirmier?.utilisateur;

  return (
    <Screen edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.headerRow}>
          <AppText variant="h3" style={styles.flex}>
            {ACTE_LABEL[data.type_acte]}
          </AppText>
          <Badge label={s.label} tone={s.tone} />
        </View>

        <Card style={styles.info}>
          <Row label="Date prévue" value={formatDate(data.date_planifiee)} />
          {data.date_effective ? (
            <Row label="Réalisée le" value={formatDate(data.date_effective)} />
          ) : null}
          <Row label="Adresse" value={data.adresse_intervention} />
          <Row label="Coût" value={formatFCFA(data.cout_fcfa)} />
          {infirmier ? (
            <Row label="Infirmier" value={`${infirmier.prenom} ${infirmier.nom}`} />
          ) : null}
        </Card>

        {data.compte_rendu ? (
          <Section title="Compte rendu">
            <AppText color={theme.colors.textSecondary}>{data.compte_rendu}</AppText>
          </Section>
        ) : null}
      </ScrollView>
    </Screen>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  const theme = useTheme();
  return (
    <View style={styles.row}>
      <AppText variant="small" color={theme.colors.textSecondary}>
        {label}
      </AppText>
      <AppText variant="small" weight="medium" style={styles.rowValue}>
        {value}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  loader: { marginTop: 32 },
  scroll: { paddingVertical: 16, paddingBottom: 40 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  flex: { flex: 1 },
  info: { gap: 10, marginTop: 12 },
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  rowValue: { flex: 1, textAlign: 'right' },
});
