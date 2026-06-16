import React from 'react';
import { ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { RouteProp, useRoute } from '@react-navigation/native';
import { AppText, Screen, Section, BulletList, ErrorState } from '@/components';
import { useTheme } from '@/theme';
import { formatDate } from '@/lib/format';
import { useAnalyseIa } from '@/features/ia/hooks';
import {
  DiagnosticResult,
  CompatibiliteResult,
  MedecineTraditionnelleResult,
} from '@/types';
import { SanteStackParamList } from '@/navigation/types';
import { DiagnosticResultView } from './components/DiagnosticResultView';
import { CompatibiliteResultView } from './components/CompatibiliteResultView';
import { RemedesResultView } from './components/RemedesResultView';
import { LABELS_ANALYSE } from './HistoriqueIaScreen';

export function AnalyseDetailScreen() {
  const theme = useTheme();
  const route = useRoute<RouteProp<SanteStackParamList, 'AnalyseDetail'>>();
  const { data, isLoading, isError, refetch } = useAnalyseIa(route.params.id);

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

  const resultat = data.resultat as Record<string, unknown>;

  const renderResult = () => {
    switch (data.type_analyse) {
      case 'diagnostic':
        return <DiagnosticResultView result={resultat as unknown as DiagnosticResult} />;
      case 'compatibilite_medicament':
        return <CompatibiliteResultView result={resultat as unknown as CompatibiliteResult} />;
      case 'medecine_traditionnelle':
        return <RemedesResultView result={resultat as unknown as MedecineTraditionnelleResult} />;
      default:
        return (
          <Section title="Synthèse">
            <AppText color={theme.colors.textSecondary}>
              {(resultat.synthese as string) ??
                (resultat.conseil_general as string) ??
                'Détail non disponible pour ce type d’analyse.'}
            </AppText>
            {Array.isArray(resultat.recommandations_preventives) ? (
              <BulletList items={resultat.recommandations_preventives as string[]} />
            ) : null}
          </Section>
        );
    }
  };

  return (
    <Screen edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <AppText variant="h3">{LABELS_ANALYSE[data.type_analyse] ?? data.type_analyse}</AppText>
        <AppText variant="small" color={theme.colors.textSecondary} style={styles.date}>
          {formatDate(data.date_analyse)}
        </AppText>
        {renderResult()}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  loader: { marginTop: 32 },
  scroll: { paddingVertical: 16, paddingBottom: 40 },
  date: { marginTop: 4, marginBottom: 8 },
});
