import React from 'react';
import { FlatList, View, StyleSheet, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AppText, Badge, Button, Card, Screen, EmptyState, ErrorState } from '@/components';
import { useTheme } from '@/theme';
import { formatFCFA } from '@/lib/format';
import { useMesLivraisons } from '@/features/livreur/hooks';
import { Commande, StatutCommande } from '@/types';
import { LivraisonsStackParamList } from '@/navigation/types';

type Tone = 'neutral' | 'success' | 'warning' | 'danger' | 'info';
const STATUT: Partial<Record<StatutCommande, { tone: Tone; label: string }>> = {
  preparee: { tone: 'info', label: 'À récupérer' },
  en_livraison: { tone: 'warning', label: 'En livraison' },
  livree: { tone: 'success', label: 'Livrée' },
  annulee: { tone: 'neutral', label: 'Annulée' },
};

export function LivraisonsListScreen() {
  const theme = useTheme();
  const navigation =
    useNavigation<NativeStackNavigationProp<LivraisonsStackParamList>>();
  const { data, isLoading, isError, refetch, isRefetching } = useMesLivraisons();

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
      <FlatList
        data={items}
        keyExtractor={(c: Commande) => c.id_commande}
        contentContainerStyle={styles.list}
        onRefresh={refetch}
        refreshing={isRefetching}
        ListEmptyComponent={
          <EmptyState
            title="Aucune livraison"
            description="Vos courses acceptées apparaîtront ici."
          />
        }
        renderItem={({ item }) => {
          const s = STATUT[item.statut_commande];
          return (
            <Card style={styles.card}>
              <View style={styles.between}>
                <AppText weight="semibold" style={styles.flex}>
                  {item.pharmacie?.nom_pharmacie ?? 'Commande'}
                </AppText>
                {s ? <Badge label={s.label} tone={s.tone} /> : null}
              </View>
              {item.adresse_livraison ? (
                <AppText variant="small" color={theme.colors.textSecondary}>
                  {item.adresse_livraison}
                </AppText>
              ) : null}
              <AppText variant="small" weight="semibold" color={theme.colors.primary}>
                {formatFCFA(item.montant_total_fcfa)}
              </AppText>
              {item.statut_commande === 'en_livraison' ? (
                <Button
                  label="Valider la livraison"
                  onPress={() =>
                    navigation.navigate('ValiderLivraison', { id: item.id_commande })
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
  card: { gap: 6 },
  between: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  flex: { flex: 1 },
  btn: { marginTop: 8 },
});
