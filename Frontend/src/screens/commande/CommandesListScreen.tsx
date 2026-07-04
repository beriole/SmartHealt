import React, { useMemo, useState } from 'react';
import {
  FlatList,
  Pressable,
  View,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { Package, ChevronRight } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { AppText, Badge, Card, EmptyState, ErrorState, Screen, ScreenHeader } from '@/components';
import { useTheme } from '@/theme';
import { useCommandes } from '@/features/commande/hooks';
import { commandeTone } from '@/features/commande/status';
import { formatFCFA, formatDate } from '@/lib/format';
import { StatutCommande } from '@/types';
import { CommandesStackParamList } from '@/navigation/types';

type Nav = NativeStackNavigationProp<CommandesStackParamList, 'CommandesList'>;

type Filter = 'tous' | 'en_cours' | 'livree' | 'annulee';
const FILTERS: { key: Filter; label: string }[] = [
  { key: 'tous', label: 'Tous' },
  { key: 'en_cours', label: 'En cours' },
  { key: 'livree', label: 'Livré' },
  { key: 'annulee', label: 'Annulé' },
];

const EN_COURS: StatutCommande[] = [
  'en_attente',
  'confirmee',
  'preparee',
  'en_livraison',
];

export function CommandesListScreen() {
  const theme = useTheme();
  const { t } = useTranslation();
  const navigation = useNavigation<Nav>();
  const { data, isLoading, isError, refetch, isRefetching } = useCommandes();
  const [filter, setFilter] = useState<Filter>('tous');

  const filtered = useMemo(() => {
    const list = data?.data ?? [];
    if (filter === 'tous') return list;
    if (filter === 'en_cours')
      return list.filter(c => EN_COURS.includes(c.statut_commande));
    return list.filter(c => c.statut_commande === filter);
  }, [data, filter]);

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
    <Screen padded={false} edges={['top']}>
      <ScreenHeader
        title="Mes commandes"
        subtitle="Suivez et renouvelez vos commandes."
      />

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filters}
      >
        {FILTERS.map(f => {
          const active = filter === f.key;
          return (
            <Pressable
              key={f.key}
              onPress={() => setFilter(f.key)}
              style={[
                styles.chip,
                {
                  backgroundColor: active
                    ? theme.colors.primary
                    : theme.colors.surfaceContainerHigh,
                  borderRadius: theme.radius.pill,
                },
              ]}
            >
              <AppText
                variant="small"
                weight="semibold"
                color={active ? theme.colors.primaryOn : theme.colors.textSecondary}
              >
                {f.label}
              </AppText>
            </Pressable>
          );
        })}
      </ScrollView>

      <FlatList
        data={filtered}
        keyExtractor={item => item.id_commande}
        contentContainerStyle={styles.list}
        onRefresh={refetch}
        refreshing={isRefetching}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => {
          const nbArticles = item.lignes?.length;
          return (
            <Pressable
              onPress={() =>
                navigation.navigate('CommandeDetail', { id: item.id_commande })
              }
            >
              <Card style={styles.card}>
                <View style={styles.cardTop}>
                  <AppText variant="label" color={theme.colors.outline}>
                    COMMANDE #{item.id_commande.slice(0, 8).toUpperCase()}
                  </AppText>
                  <Badge
                    label={t(`commande.statut.${item.statut_commande}`)}
                    tone={commandeTone(item.statut_commande)}
                  />
                </View>

                <AppText weight="bold" variant="bodyLg" style={styles.date}>
                  {formatDate(item.date_commande)}
                </AppText>

                <View style={styles.cardBody}>
                  <View
                    style={[
                      styles.thumb,
                      { backgroundColor: theme.colors.surfaceVariant },
                    ]}
                  >
                    <Package size={22} color={theme.colors.primary} />
                  </View>
                  <View style={styles.flex}>
                    <AppText weight="semibold" numberOfLines={1}>
                      {item.pharmacie?.nom_pharmacie ?? t('tabs.commandes')}
                    </AppText>
                    {nbArticles != null ? (
                      <AppText variant="small" color={theme.colors.textSecondary}>
                        {nbArticles} article{nbArticles > 1 ? 's' : ''}
                      </AppText>
                    ) : null}
                  </View>
                  <AppText weight="bold" variant="bodyLg" color={theme.colors.primary}>
                    {formatFCFA(item.montant_total_fcfa)}
                  </AppText>
                </View>

                <View style={[styles.cardFooter, { borderTopColor: theme.colors.border }]}>
                  <AppText variant="small" weight="semibold" color={theme.colors.primary}>
                    Voir les détails
                  </AppText>
                  <ChevronRight size={16} color={theme.colors.primary} />
                </View>
              </Card>
            </Pressable>
          );
        }}
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
  filters: { paddingHorizontal: 20, paddingVertical: 16, gap: 8 },
  chip: { paddingHorizontal: 18, paddingVertical: 8 },
  list: { paddingHorizontal: 16, paddingBottom: 24, gap: 12 },
  card: { gap: 6 },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  date: { marginTop: 2 },
  cardBody: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 6 },
  thumb: {
    width: 48,
    height: 48,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  flex: { flex: 1 },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 2,
    borderTopWidth: 1,
    marginTop: 12,
    paddingTop: 10,
  },
});
