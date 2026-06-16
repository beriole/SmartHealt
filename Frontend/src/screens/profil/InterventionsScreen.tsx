import React from 'react';
import { FlatList, View, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AppText, Badge, Button, Card, Screen, EmptyState, ErrorState } from '@/components';
import { useTheme } from '@/theme';
import { formatDate } from '@/lib/format';
import { useInterventions } from '@/features/intervention/hooks';
import { Intervention, TypeActe, StatutIntervention } from '@/types';
import { ProfilStackParamList } from '@/navigation/types';

type Tone = 'neutral' | 'success' | 'warning' | 'danger' | 'info';

export const ACTE_LABEL: Record<TypeActe, string> = {
  injection: 'Injection',
  pansement: 'Pansement',
  prise_sang: 'Prise de sang',
  perfusion: 'Perfusion',
  autre: 'Autre acte',
};

export const STATUT_INTERVENTION: Record<StatutIntervention, { tone: Tone; label: string }> = {
  planifiee: { tone: 'info', label: 'Planifiée' },
  en_cours: { tone: 'warning', label: 'En cours' },
  terminee: { tone: 'success', label: 'Terminée' },
  annulee: { tone: 'neutral', label: 'Annulée' },
};

export function InterventionsScreen() {
  const theme = useTheme();
  const navigation =
    useNavigation<NativeStackNavigationProp<ProfilStackParamList>>();
  const { data, isLoading, isError, refetch } = useInterventions();

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
        keyExtractor={(i: Intervention) => i.id_intervention}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <Button
            label="Planifier une intervention"
            onPress={() => navigation.navigate('NouvelleIntervention')}
            style={styles.addBtn}
          />
        }
        ListEmptyComponent={
          <EmptyState
            title="Aucune intervention"
            description="Planifiez une intervention infirmière à domicile."
          />
        }
        renderItem={({ item }) => {
          const s = STATUT_INTERVENTION[item.statut];
          return (
            <Pressable
              onPress={() =>
                navigation.navigate('InterventionDetail', { id: item.id_intervention })
              }
            >
              <Card style={styles.row}>
                <View style={styles.flex}>
                  <AppText weight="semibold">{ACTE_LABEL[item.type_acte]}</AppText>
                  <View style={styles.meta}>
                    <Badge label={s.label} tone={s.tone} />
                    <AppText variant="small" color={theme.colors.textSecondary}>
                      {formatDate(item.date_planifiee)}
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
  addBtn: { marginBottom: 6 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  flex: { flex: 1, gap: 6 },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 8 },
});
