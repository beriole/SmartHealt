import React, { useMemo } from 'react';
import { FlatList, View, StyleSheet, ActivityIndicator } from 'react-native';
import { MapPin, Phone, Star, Truck } from 'lucide-react-native';
import { useRoute, RouteProp } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import {
  AppText,
  Badge,
  Card,
  EmptyState,
  ErrorState,
  Screen,
  StockCard,
} from '@/components';
import { useTheme } from '@/theme';
import { usePharmacie } from '@/features/pharmacie/hooks';
import { useAddToCart } from '@/features/pharmacie/useAddToCart';
import { useCartStore } from '@/store/cartStore';
import { PharmacieResume, StockItem } from '@/types';
import { PharmacieStackParamList } from '@/navigation/types';

export function PharmacieDetailScreen() {
  const theme = useTheme();
  const { t } = useTranslation();
  const route = useRoute<RouteProp<PharmacieStackParamList, 'PharmacieDetail'>>();
  const { data, isLoading, isError, refetch } = usePharmacie(route.params.id);
  const addToCart = useAddToCart();

  const cartItems = useCartStore(s => s.items);
  const inCartSet = useMemo(
    () => new Set(cartItems.map(l => l.id_stock)),
    [cartItems],
  );

  const resume: PharmacieResume | undefined = data
    ? {
        id_pharmacie: data.id_pharmacie,
        nom_pharmacie: data.nom_pharmacie,
        adresse: data.adresse,
        telephone: data.telephone,
        note_moyenne: data.note_moyenne,
        latitude: data.latitude,
        longitude: data.longitude,
        livraison_disponible: data.livraison_disponible,
      }
    : undefined;

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

  const stocks = (data.stocks ?? []).filter(s => s.quantite_disponible > 0);

  const onAdd = (stock: StockItem) => addToCart({ ...stock, pharmacie: resume });

  return (
    <Screen padded={false}>
      <FlatList
        data={stocks}
        keyExtractor={item => item.id_stock}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <View style={styles.header}>
            <Card style={styles.heroCard}>
              <View style={styles.heroTop}>
                <AppText variant="h3" weight="bold" style={styles.flex}>
                  {data.nom_pharmacie}
                </AppText>
                <View style={styles.ratingBadge}>
                  <Star size={14} color={theme.colors.warning} fill={theme.colors.warning} />
                  <AppText variant="label">
                    {Number(data.note_moyenne).toFixed(1)}
                  </AppText>
                </View>
              </View>
              <InfoRow icon={<MapPin size={16} color={theme.colors.outline} />} text={data.adresse} />
              <InfoRow icon={<Phone size={16} color={theme.colors.outline} />} text={data.telephone} />
              {data.livraison_disponible ? (
                <View style={styles.deliveryRow}>
                  <Truck size={16} color={theme.colors.primary} />
                  <Badge label={t('pharmacie.delivery')} tone="info" />
                </View>
              ) : null}
            </Card>
            <AppText variant="h3" weight="semibold" style={styles.sectionTitle}>
              {t('pharmacie.availableProducts')}
            </AppText>
          </View>
        }
        renderItem={({ item }) => (
          <StockCard
            stock={item}
            showPharmacie={false}
            inCart={inCartSet.has(item.id_stock)}
            onAdd={() => onAdd(item)}
          />
        )}
        ListEmptyComponent={<EmptyState title={t('pharmacie.noProduct')} />}
      />
    </Screen>
  );
}

function InfoRow({ icon, text }: { icon: React.ReactNode; text: string }) {
  const theme = useTheme();
  return (
    <View style={styles.infoRow}>
      {icon}
      <AppText variant="small" color={theme.colors.textSecondary} style={styles.infoText}>
        {text}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  loader: { marginTop: 32 },
  list: { padding: 16, gap: 12 },
  header: { marginBottom: 4 },
  heroCard: { gap: 8 },
  heroTop: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  flex: { flex: 1 },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  deliveryRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 2 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  infoText: { flex: 1 },
  sectionTitle: { marginTop: 16, marginBottom: 4 },
});
