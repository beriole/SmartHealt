import React, { useMemo, useState } from 'react';
import {
  View,
  FlatList,
  Pressable,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { TriangleAlert, CalendarX, Pill, ChevronRight, Plus } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  AppText,
  Badge,
  Card,
  Screen,
  ScreenHeader,
  SearchBar,
  EmptyState,
  ErrorState,
} from '@/components';
import { useTheme } from '@/theme';
import { formatFCFA, formatDate } from '@/lib/format';
import { useMyStocks, useAlertes } from '@/features/pharmacien/hooks';
import { StockItem } from '@/types';
import { InventaireStackParamList } from '@/navigation/types';

type Nav = NativeStackNavigationProp<InventaireStackParamList>;

export function InventaireScreen() {
  const theme = useTheme();
  const navigation = useNavigation<Nav>();
  const [term, setTerm] = useState('');
  const { data, isLoading, isError, refetch, isRefetching } = useMyStocks();
  const alertes = useAlertes();

  const stocks = useMemo(() => {
    const list = data ?? [];
    if (!term.trim()) return list;
    const q = term.trim().toLowerCase();
    return list.filter(s => s.medicament.nom_commercial.toLowerCase().includes(q));
  }, [data, term]);

  const nbRuptures = alertes.data?.ruptures.length ?? 0;
  const nbPeremptions = alertes.data?.peremptions.length ?? 0;

  const stockTone = (s: StockItem): 'success' | 'warning' | 'danger' => {
    const seuil = s.seuil_alerte ?? 10;
    if (s.quantite_disponible <= 0) return 'danger';
    if (s.quantite_disponible <= seuil) return 'warning';
    return 'success';
  };

  return (
    <Screen edges={['top']} padded={false}>
      <ScreenHeader
        title="Inventaire"
        subtitle="Gérez le stock de votre officine."
        right={
          <Pressable
            onPress={() => navigation.navigate('AjouterStock')}
            android_ripple={{ color: theme.colors.muted, borderless: true }}
            hitSlop={8}
            style={[styles.addBtn, { backgroundColor: theme.colors.primary }]}
          >
            <Plus size={22} color={theme.colors.primaryOn} />
          </Pressable>
        }
      />

      {isLoading ? (
        <ActivityIndicator style={styles.loader} color={theme.colors.primary} />
      ) : isError ? (
        <ErrorState onRetry={refetch} />
      ) : (
        <FlatList
          data={stocks}
          keyExtractor={(s: StockItem) => s.id_stock}
          contentContainerStyle={styles.list}
          onRefresh={() => {
            refetch();
            alertes.refetch();
          }}
          refreshing={isRefetching}
          ListHeaderComponent={
            <View style={styles.header}>
              {(nbRuptures > 0 || nbPeremptions > 0) ? (
                <View style={styles.alertRow}>
                  <View style={[styles.alertCard, { backgroundColor: theme.colors.warning + '1A' }]}>
                    <TriangleAlert size={20} color={theme.colors.warning} />
                    <AppText variant="h3" weight="bold">{nbRuptures}</AppText>
                    <AppText variant="caption" color={theme.colors.textSecondary}>
                      Stock bas
                    </AppText>
                  </View>
                  <View style={[styles.alertCard, { backgroundColor: theme.colors.destructive + '1A' }]}>
                    <CalendarX size={20} color={theme.colors.destructive} />
                    <AppText variant="h3" weight="bold">{nbPeremptions}</AppText>
                    <AppText variant="caption" color={theme.colors.textSecondary}>
                      Péremptions
                    </AppText>
                  </View>
                </View>
              ) : null}
              <SearchBar
                value={term}
                onChangeText={setTerm}
                placeholder="Rechercher un médicament…"
              />
            </View>
          }
          ListEmptyComponent={
            <EmptyState
              title="Stock vide"
              description="Aucun médicament dans votre inventaire pour le moment."
            />
          }
          renderItem={({ item }) => {
            const tone = stockTone(item);
            return (
              <Pressable
                onPress={() => navigation.navigate('EditStock', { id_stock: item.id_stock })}
                android_ripple={{ color: theme.colors.muted }}
              >
                <Card style={styles.card}>
                  <View style={[styles.icon, { backgroundColor: theme.colors.primaryContainer }]}>
                    <Pill size={20} color={theme.colors.primary} />
                  </View>
                  <View style={styles.flex}>
                    <AppText weight="semibold" numberOfLines={1}>
                      {item.medicament.nom_commercial}
                    </AppText>
                    <AppText variant="small" color={theme.colors.textSecondary} numberOfLines={1}>
                      {item.medicament.dosage} · {formatFCFA(item.prix_vente_fcfa)}
                      {item.date_peremption ? ` · exp. ${formatDate(item.date_peremption)}` : ''}
                    </AppText>
                  </View>
                  <View style={styles.qtyCol}>
                    <Badge label={`${item.quantite_disponible}`} tone={tone} />
                    <ChevronRight size={18} color={theme.colors.outline} />
                  </View>
                </Card>
              </Pressable>
            );
          }}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  loader: { marginTop: 32 },
  list: { padding: 16, gap: 12, flexGrow: 1 },
  header: { gap: 12, marginBottom: 4 },
  alertRow: { flexDirection: 'row', gap: 12 },
  alertCard: {
    flex: 1,
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    gap: 2,
  },
  addBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  card: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  icon: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  qtyCol: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  flex: { flex: 1 },
});
