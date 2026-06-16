import React from 'react';
import { FlatList, View, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { AppText, Button, Card, Screen, EmptyState, ErrorState } from '@/components';
import { useTheme } from '@/theme';
import { formatFCFA } from '@/lib/format';
import { useDisponibles, useAccepterCourse } from '@/features/livreur/hooks';
import { Commande } from '@/types';

export function CoursesScreen() {
  const theme = useTheme();
  const { data, isLoading, isError, refetch, isRefetching } = useDisponibles();
  const accepter = useAccepterCourse();

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

  const onAccepter = (id: string) =>
    accepter.mutate(id, {
      onSuccess: () => Alert.alert('Course', 'Course acceptée. Récupérez le colis en pharmacie.'),
      onError: err => Alert.alert('Course', err.message),
    });

  return (
    <Screen edges={['top']} padded={false}>
      <FlatList
        data={data ?? []}
        keyExtractor={(c: Commande) => c.id_commande}
        contentContainerStyle={styles.list}
        onRefresh={refetch}
        refreshing={isRefetching}
        ListEmptyComponent={
          <EmptyState
            title="Aucune course"
            description="Aucune livraison disponible pour le moment."
          />
        }
        renderItem={({ item }) => (
          <Card style={styles.card}>
            <View style={styles.between}>
              <AppText weight="semibold" style={styles.flex}>
                {item.pharmacie?.nom_pharmacie ?? 'Pharmacie'}
              </AppText>
              <AppText weight="semibold" color={theme.colors.primary}>
                {formatFCFA(item.montant_total_fcfa)}
              </AppText>
            </View>
            {item.pharmacie?.adresse ? (
              <AppText variant="small" color={theme.colors.textSecondary}>
                Retrait : {item.pharmacie.adresse}
              </AppText>
            ) : null}
            {item.adresse_livraison ? (
              <AppText variant="small" color={theme.colors.textSecondary}>
                Livraison : {item.adresse_livraison}
              </AppText>
            ) : null}
            <Button
              label="Accepter la course"
              loading={accepter.isPending && accepter.variables === item.id_commande}
              onPress={() => onAccepter(item.id_commande)}
              style={styles.btn}
            />
          </Card>
        )}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  loader: { marginTop: 32 },
  list: { padding: 16, gap: 12, flexGrow: 1 },
  card: { gap: 6 },
  between: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  flex: { flex: 1 },
  btn: { marginTop: 8 },
});
