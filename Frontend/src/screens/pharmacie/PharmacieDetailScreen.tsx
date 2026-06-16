import React, { useMemo } from 'react';
import { FlatList, View, StyleSheet, ActivityIndicator } from 'react-native';
import { MapPin, Phone, Star } from 'lucide-react-native';
import { useRoute, RouteProp } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import {
  AppText,
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
            <AppText variant="h2">{data.nom_pharmacie}</AppText>
            <InfoRow icon={<MapPin size={16} color={theme.colors.textSecondary} />} text={data.adresse} />
            <InfoRow icon={<Phone size={16} color={theme.colors.textSecondary} />} text={data.telephone} />
            <InfoRow
              icon={<Star size={16} color={theme.colors.warning} />}
              text={`${Number(data.note_moyenne).toFixed(1)} / 5`}
            />
            <AppText variant="small" weight="semibold" style={styles.sectionTitle}>
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
  header: { gap: 6, marginBottom: 4 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  infoText: { flex: 1 },
  sectionTitle: { marginTop: 12 },
});
