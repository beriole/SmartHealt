import React from 'react';
import { FlatList, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { View } from 'react-native';
import { AppText, Card, Screen, EmptyState, ErrorState } from '@/components';
import { useTheme } from '@/theme';
import { formatDate } from '@/lib/format';
import { useHistoriqueIa } from '@/features/ia/hooks';
import { AnalyseIa, TypeAnalyseIa } from '@/types';
import { SanteStackParamList } from '@/navigation/types';

export const LABELS_ANALYSE: Record<TypeAnalyseIa, string> = {
  diagnostic: 'Diagnostic / triage',
  compatibilite_medicament: 'Compatibilité médicament',
  medecine_traditionnelle: 'Médecine traditionnelle',
  analyse_predictive: 'Analyse préventive',
  recommandation_traitement: 'Recommandation de traitement',
};

export function HistoriqueIaScreen() {
  const theme = useTheme();
  const navigation =
    useNavigation<NativeStackNavigationProp<SanteStackParamList>>();
  const { data, isLoading, isError, refetch } = useHistoriqueIa();

  if (isLoading) {
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
        keyExtractor={(item: AnalyseIa) => item.id_analyse}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <EmptyState
            title="Aucune analyse"
            description="Vos analyses IA apparaîtront ici."
          />
        }
        renderItem={({ item }) => (
          <Pressable
            onPress={() => navigation.navigate('AnalyseDetail', { id: item.id_analyse })}
          >
            <Card style={styles.row}>
              <View style={styles.flex}>
                <AppText weight="semibold">
                  {LABELS_ANALYSE[item.type_analyse] ?? item.type_analyse}
                </AppText>
                <AppText variant="small" color={theme.colors.textSecondary}>
                  {formatDate(item.date_analyse)}
                </AppText>
              </View>
              <ChevronRight size={20} color={theme.colors.textSecondary} />
            </Card>
          </Pressable>
        )}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  loader: { marginTop: 32 },
  list: { padding: 16, gap: 10, flexGrow: 1 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  flex: { flex: 1 },
});
