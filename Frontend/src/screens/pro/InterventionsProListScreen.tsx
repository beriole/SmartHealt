import React from 'react';
import { FlatList, View, StyleSheet, ActivityIndicator } from 'react-native';
import { Syringe, User, MapPin } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AppText, Badge, Button, Card, Screen, ScreenHeader, EmptyState, ErrorState } from '@/components';
import { useTheme } from '@/theme';
import { formatDate } from '@/lib/format';
import { useInterventions, useUpdateStatutIntervention } from '@/features/intervention/hooks';
import { Intervention } from '@/types';
import { InterventionsProStackParamList } from '@/navigation/types';
import { ACTE_LABEL, STATUT_INTERVENTION } from '@/screens/profil/InterventionsScreen';

export function InterventionsProListScreen() {
  const theme = useTheme();
  const navigation =
    useNavigation<NativeStackNavigationProp<InterventionsProStackParamList>>();
  const { data, isLoading, isError, refetch, isRefetching } = useInterventions();
  const updateStatut = useUpdateStatutIntervention();

  if (isLoading) {
    return (
      <Screen edges={['top']}>
        <ActivityIndicator style={styles.loader} color={theme.colors.primary} />
      </Screen>
    );
  }
  if (isError) {
    return (
      <Screen edges={['top']}>
        <ErrorState onRetry={refetch} />
      </Screen>
    );
  }

  const items = data?.data ?? [];

  return (
    <Screen edges={['top']} padded={false}>
      <ScreenHeader
        title="Mes interventions"
        subtitle="Soins à domicile qui vous sont assignés."
      />
      <FlatList
        data={items}
        keyExtractor={(i: Intervention) => i.id_intervention}
        contentContainerStyle={styles.list}
        onRefresh={refetch}
        refreshing={isRefetching}
        ListEmptyComponent={
          <EmptyState
            title="Aucune intervention"
            description="Les interventions qui vous sont assignées apparaîtront ici."
          />
        }
        renderItem={({ item }) => {
          const s = STATUT_INTERVENTION[item.statut];
          const patient = item.patient?.utilisateur;
          return (
            <Card style={styles.card}>
              <View style={styles.between}>
                <View style={styles.titleRow}>
                  <View style={[styles.acteIcon, { backgroundColor: theme.colors.primaryContainer }]}>
                    <Syringe size={18} color={theme.colors.primary} />
                  </View>
                  <AppText weight="bold" style={styles.flex}>
                    {ACTE_LABEL[item.type_acte]}
                  </AppText>
                </View>
                <Badge label={s.label} tone={s.tone} />
              </View>
              {patient ? (
                <View style={styles.metaRow}>
                  <User size={14} color={theme.colors.outline} />
                  <AppText variant="small" color={theme.colors.textSecondary}>
                    {patient.prenom} {patient.nom}
                  </AppText>
                </View>
              ) : null}
              <View style={styles.metaRow}>
                <MapPin size={14} color={theme.colors.outline} />
                <AppText variant="small" color={theme.colors.textSecondary} style={styles.flex}>
                  {formatDate(item.date_planifiee)} · {item.adresse_intervention}
                </AppText>
              </View>
              {item.statut === 'planifiee' ? (
                <Button
                  label="Démarrer"
                  onPress={() => updateStatut.mutate({ id: item.id_intervention, statut: 'en_cours' })}
                  style={styles.btn}
                />
              ) : item.statut === 'en_cours' ? (
                <Button
                  label="Terminer"
                  onPress={() =>
                    navigation.navigate('TerminerIntervention', { id: item.id_intervention })
                  }
                  style={styles.btn}
                />
              ) : null}
            </Card>
          );
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  loader: { marginTop: 32 },
  list: { padding: 16, gap: 12, flexGrow: 1 },
  card: { gap: 8 },
  between: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  acteIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  flex: { flex: 1 },
  btn: { marginTop: 8 },
});
