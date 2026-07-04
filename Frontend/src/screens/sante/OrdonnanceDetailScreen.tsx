import React from 'react';
import { ScrollView, View, StyleSheet, ActivityIndicator , Pressable } from 'react-native';
import { BellPlus } from 'lucide-react-native';
import { RouteProp, useRoute, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AppText, Badge, Card, Section, Screen, ErrorState } from '@/components';
import { useTheme } from '@/theme';
import { formatDate } from '@/lib/format';
import { useOrdonnance } from '@/features/ordonnance/hooks';
import { SanteStackParamList } from '@/navigation/types';
import { STATUT_ORDONNANCE } from './OrdonnancesScreen';

export function OrdonnanceDetailScreen() {
  const theme = useTheme();
  const route = useRoute<RouteProp<SanteStackParamList, 'OrdonnanceDetail'>>();
  const navigation =
    useNavigation<NativeStackNavigationProp<SanteStackParamList>>();
  const { data, isLoading, isError, refetch } = useOrdonnance(route.params.id);

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

  const s = STATUT_ORDONNANCE[data.statut];

  return (
    <Screen edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.headerRow}>
          <Badge label={s.label} tone={s.tone} />
          <AppText variant="small" color={theme.colors.textSecondary}>
            Expire le {formatDate(data.date_expiration)}
          </AppText>
        </View>
        <AppText variant="small" color={theme.colors.textSecondary} style={styles.emise}>
          Émise le {formatDate(data.date_emission)}
        </AppText>

        <Section title="Médicaments prescrits">
          {data.lignes?.map(l => (
            <Card key={l.id_ligne} style={styles.ligne}>
              <View style={styles.between}>
                <AppText weight="semibold" style={styles.flex}>
                  {l.medicament?.nom_commercial ?? 'Médicament'}
                </AppText>
                {l.servi ? <Badge label="Servi" tone="success" /> : null}
              </View>
              <AppText variant="small" color={theme.colors.textSecondary}>
                {l.posologie} · {l.quantite} unité(s) · {l.duree_traitement_jours} j
              </AppText>
              <Pressable
                onPress={() =>
                  navigation.navigate('NouveauRappel', {
                    id_ordonnance: data.id_ordonnance,
                    id_medicament: l.id_medicament,
                    nom_medicament: l.medicament?.nom_commercial,
                  })
                }
                style={styles.rappelLink}
              >
                <BellPlus size={16} color={theme.colors.primary} />
                <AppText variant="small" weight="semibold" color={theme.colors.primary}>
                  Programmer un rappel
                </AppText>
              </Pressable>
            </Card>
          ))}
        </Section>

        {data.notes_pharmacien ? (
          <Section title="Notes du pharmacien">
            <AppText color={theme.colors.textSecondary}>{data.notes_pharmacien}</AppText>
          </Section>
        ) : null}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  loader: { marginTop: 32 },
  scroll: { paddingVertical: 16, paddingBottom: 40 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  emise: { marginTop: 6 },
  ligne: { gap: 8 },
  between: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  flex: { flex: 1 },
  rappelLink: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
});
