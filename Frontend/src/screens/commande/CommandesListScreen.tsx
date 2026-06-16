import React from 'react';
import { FlatList, Pressable, View, StyleSheet, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { AppText, Badge, Card, EmptyState, ErrorState, Screen } from '@/components';
import { useTheme } from '@/theme';
import { useCommandes } from '@/features/commande/hooks';
import { commandeTone, paiementTone } from '@/features/commande/status';
import { formatFCFA, formatDate } from '@/lib/format';
import { CommandesStackParamList } from '@/navigation/types';

type Nav = NativeStackNavigationProp<CommandesStackParamList, 'CommandesList'>;

export function CommandesListScreen() {
  const theme = useTheme();
  const { t } = useTranslation();
  const navigation = useNavigation<Nav>();
  const { data, isLoading, isError, refetch, isRefetching } = useCommandes();

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

  return (
    <Screen padded={false}>
      <FlatList
        data={data?.data ?? []}
        keyExtractor={item => item.id_commande}
        contentContainerStyle={styles.list}
        onRefresh={refetch}
        refreshing={isRefetching}
        renderItem={({ item }) => (
          <Pressable
            onPress={() =>
              navigation.navigate('CommandeDetail', { id: item.id_commande })
            }
          >
            <Card style={styles.card}>
              <View style={styles.headerRow}>
                <AppText weight="semibold" numberOfLines={1} style={styles.flex}>
                  {item.pharmacie?.nom_pharmacie ?? t('tabs.commandes')}
                </AppText>
                <AppText weight="bold" color={theme.colors.primary}>
                  {formatFCFA(item.montant_total_fcfa)}
                </AppText>
              </View>
              <AppText variant="caption" color={theme.colors.textSecondary}>
                {formatDate(item.date_commande)}
              </AppText>
              <View style={styles.badges}>
                <Badge
                  label={t(`commande.statut.${item.statut_commande}`)}
                  tone={commandeTone(item.statut_commande)}
                />
                <Badge
                  label={t(`commande.paiement.${item.statut_paiement}`)}
                  tone={paiementTone(item.statut_paiement)}
                />
              </View>
            </Card>
          </Pressable>
        )}
        ListEmptyComponent={
          <EmptyState
            title={t('commande.emptyTitle')}
            description={t('commande.emptyBody')}
          />
        }
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  loader: { marginTop: 32 },
  list: { padding: 16, gap: 12 },
  card: { gap: 6 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  flex: { flex: 1 },
  badges: { flexDirection: 'row', gap: 8, marginTop: 4, flexWrap: 'wrap' },
});
