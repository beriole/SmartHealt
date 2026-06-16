import React from 'react';
import { FlatList, View, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AppText, Badge, Card, Screen, EmptyState, ErrorState } from '@/components';
import { useTheme } from '@/theme';
import { formatDate } from '@/lib/format';
import { useMonCarnet } from '@/features/carnet/hooks';
import { useOrdonnances } from '@/features/ordonnance/hooks';
import { Ordonnance, StatutOrdonnance } from '@/types';
import { SanteStackParamList } from '@/navigation/types';

type Tone = 'neutral' | 'success' | 'warning' | 'danger' | 'info';

export const STATUT_ORDONNANCE: Record<StatutOrdonnance, { tone: Tone; label: string }> = {
  active: { tone: 'info', label: 'Active' },
  partiellement_servie: { tone: 'warning', label: 'Partiellement servie' },
  servie: { tone: 'success', label: 'Servie' },
  expiree: { tone: 'neutral', label: 'Expirée' },
};

export function OrdonnancesScreen() {
  const theme = useTheme();
  const navigation =
    useNavigation<NativeStackNavigationProp<SanteStackParamList>>();
  const carnet = useMonCarnet();
  const { data, isLoading, isError, refetch } = useOrdonnances(
    carnet.data?.id_patient,
  );

  if (isLoading || carnet.isLoading) {
    return (
      <Screen>
        <ActivityIndicator style={styles.loader} color={theme.colors.primary} />
      </Screen>
    );
  }
  if (isError) {
    return (
      <Screen>
        <ErrorState onRetry={refetch} />
      </Screen>
    );
  }

  const items = data?.data ?? [];

  return (
    <Screen padded={false} edges={['bottom']}>
      <FlatList
        data={items}
        keyExtractor={(o: Ordonnance) => o.id_ordonnance}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <EmptyState
            title="Aucune ordonnance"
            description="Vos ordonnances émises par un médecin apparaîtront ici."
          />
        }
        renderItem={({ item }) => {
          const s = STATUT_ORDONNANCE[item.statut];
          return (
            <Pressable
              onPress={() =>
                navigation.navigate('OrdonnanceDetail', { id: item.id_ordonnance })
              }
            >
              <Card style={styles.row}>
                <View style={styles.flex}>
                  <AppText weight="semibold">
                    Ordonnance du {formatDate(item.date_emission)}
                  </AppText>
                  <View style={styles.meta}>
                    <Badge label={s.label} tone={s.tone} />
                    <AppText variant="small" color={theme.colors.textSecondary}>
                      {item.lignes?.length ?? 0} médicament(s)
                    </AppText>
                  </View>
                </View>
                <ChevronRight size={20} color={theme.colors.textSecondary} />
              </Card>
            </Pressable>
          );
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  loader: { marginTop: 32 },
  list: { padding: 16, gap: 10, flexGrow: 1 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  flex: { flex: 1, gap: 6 },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 8 },
});
