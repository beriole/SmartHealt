import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  FlatList,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Pressable,
  Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import {
  Pill,
  Syringe,
  Leaf,
  Wind,
  MapPin,
  Star,
  ChevronRight,
  Truck,
} from 'lucide-react-native';
import {
  AppText,
  Badge,
  Card,
  EmptyState,
  ErrorState,
  Screen,
  SearchBar,
  StockCard,
} from '@/components';
import { useTheme } from '@/theme';
import { useStockSearch, usePharmacies } from '@/features/pharmacie/hooks';
import { useAddToCart } from '@/features/pharmacie/useAddToCart';
import { useCartStore } from '@/store/cartStore';
import { resolveImageUrl } from '@/lib/media';
import { Pharmacie } from '@/types';
import { PharmacieStackParamList } from '@/navigation/types';

type Nav = NativeStackNavigationProp<PharmacieStackParamList, 'PharmacieHome'>;

const CATEGORIES = [
  { key: 'douleur', label: 'Douleur & Fièvre', Icon: Pill, tone: 'primary' },
  { key: 'antibiotiques', label: 'Antibiotiques', Icon: Syringe, tone: 'secondary' },
  { key: 'vitamines', label: 'Vitamines', Icon: Leaf, tone: 'tertiary' },
  { key: 'respiratoire', label: 'Respiratoire', Icon: Wind, tone: 'primary' },
] as const;

export function PharmacieHomeScreen() {
  const theme = useTheme();
  const { t } = useTranslation();
  const navigation = useNavigation<Nav>();
  const addToCart = useAddToCart();

  const [term, setTerm] = useState('');
  const [debounced, setDebounced] = useState('');

  useEffect(() => {
    const id = setTimeout(() => setDebounced(term), 350);
    return () => clearTimeout(id);
  }, [term]);

  const { data, isFetching, isError, refetch } = useStockSearch(debounced);
  const pharmacies = usePharmacies({ limit: 5 });

  const cartIds = useCartStore(s => s.items);
  const inCartSet = useMemo(
    () => new Set(cartIds.map(l => l.id_stock)),
    [cartIds],
  );

  const hasQuery = debounced.trim().length >= 2;

  const toneColor = (tone: string) =>
    tone === 'secondary'
      ? theme.colors.secondary
      : tone === 'tertiary'
      ? theme.colors.tertiary
      : theme.colors.primary;

  return (
    <Screen padded={false}>
      <View style={styles.header}>
        <SearchBar
          value={term}
          onChangeText={setTerm}
          placeholder={t('pharmacie.searchPlaceholder')}
        />
      </View>

      {hasQuery ? (
        isError ? (
          <ErrorState onRetry={refetch} />
        ) : isFetching && !data ? (
          <ActivityIndicator style={styles.loader} color={theme.colors.primary} />
        ) : (
          <FlatList
            data={data ?? []}
            keyExtractor={item => item.id_stock}
            contentContainerStyle={styles.list}
            renderItem={({ item }) => (
              <StockCard
                stock={item}
                inCart={inCartSet.has(item.id_stock)}
                onPress={() =>
                  navigation.navigate('MedicamentDetail', {
                    id: item.id_medicament,
                  })
                }
                onAdd={() => addToCart(item)}
              />
            )}
            ListEmptyComponent={
              <EmptyState
                title={t('pharmacie.noResultTitle')}
                description={t('pharmacie.noResultBody')}
              />
            }
          />
        )
      ) : (
        <ScrollView
          contentContainerStyle={styles.browse}
          showsVerticalScrollIndicator={false}
        >
          {/* Catégories */}
          <View style={styles.sectionHead}>
            <AppText variant="h3" weight="semibold">
              Catégories
            </AppText>
          </View>
          <View style={styles.catGrid}>
            {CATEGORIES.map(({ key, label, Icon, tone }) => {
              const color = toneColor(tone);
              return (
                <Pressable
                  key={key}
                  onPress={() => setTerm(label.split(' ')[0])}
                  android_ripple={{ color: theme.colors.muted }}
                  style={[
                    styles.catTile,
                    theme.elevation.level1,
                    {
                      backgroundColor: theme.colors.surface,
                      borderRadius: theme.radius.lg,
                    },
                  ]}
                >
                  <View style={[styles.catIcon, { backgroundColor: color + '1A' }]}>
                    <Icon size={26} color={color} />
                  </View>
                  <AppText variant="small" weight="semibold" center style={styles.catLabel}>
                    {label}
                  </AppText>
                </Pressable>
              );
            })}
          </View>

          {/* Bannière 24/7 */}
          <View style={[styles.banner, { backgroundColor: theme.colors.primary }]}>
            <View style={styles.bannerText}>
              <AppText variant="h3" weight="bold" color={theme.colors.primaryOn}>
                Recharges d'ordonnance 24/7
              </AppText>
              <AppText color={theme.colors.primaryOn} style={styles.bannerSub}>
                Vos médicaments livrés en 30 minutes ou moins.
              </AppText>
            </View>
            <View style={styles.bannerIcon}>
              <Truck size={28} color={theme.colors.primaryOn} />
            </View>
          </View>

          {/* Pharmacies à proximité */}
          <View style={[styles.sectionHead, styles.sectionHeadSpaced]}>
            <AppText variant="h3" weight="semibold">
              Pharmacies à Proximité
            </AppText>
            <Pressable onPress={() => navigation.navigate('PharmacieList')}>
              <AppText variant="small" weight="semibold" color={theme.colors.primary}>
                Tout voir
              </AppText>
            </Pressable>
          </View>

          {pharmacies.isLoading ? (
            <ActivityIndicator color={theme.colors.primary} style={styles.loader} />
          ) : (
            <View style={styles.pharmaList}>
              {(pharmacies.data?.data ?? []).map((p: Pharmacie) => {
                const uri = resolveImageUrl(p.image_url);
                const dispo = p.statut === 'active' || p.statut === 'ACTIVE';
                return (
                  <Pressable
                    key={p.id_pharmacie}
                    onPress={() =>
                      navigation.navigate('PharmacieDetail', {
                        id: p.id_pharmacie,
                        nom: p.nom_pharmacie,
                      })
                    }
                  >
                    <Card style={styles.pharmaCard} padding="sm">
                      {uri ? (
                        <Image source={{ uri }} style={styles.pharmaThumb} />
                      ) : (
                        <View
                          style={[
                            styles.pharmaThumb,
                            { backgroundColor: theme.colors.surfaceVariant },
                          ]}
                        >
                          <MapPin size={22} color={theme.colors.primary} />
                        </View>
                      )}
                      <View style={styles.flex}>
                        <View style={styles.pharmaTop}>
                          <AppText weight="bold" numberOfLines={1} style={styles.flex}>
                            {p.nom_pharmacie}
                          </AppText>
                          <Badge
                            label={dispo ? 'Disponible' : 'Fermée'}
                            tone={dispo ? 'success' : 'danger'}
                          />
                        </View>
                        <View style={styles.pharmaMeta}>
                          <MapPin size={13} color={theme.colors.outline} />
                          <AppText
                            variant="small"
                            color={theme.colors.outline}
                            numberOfLines={1}
                            style={styles.flex}
                          >
                            {p.adresse}
                          </AppText>
                        </View>
                        <View style={styles.pharmaMeta}>
                          {Number(p.note_moyenne) > 0 ? (
                            <>
                              <Star
                                size={13}
                                color={theme.colors.warning}
                                fill={theme.colors.warning}
                              />
                              <AppText variant="label">
                                {Number(p.note_moyenne).toFixed(1)}
                              </AppText>
                            </>
                          ) : (
                            <AppText variant="label" color={theme.colors.outline}>
                              Nouveau
                            </AppText>
                          )}
                          {p.livraison_disponible ? (
                            <>
                              <Truck size={13} color={theme.colors.primary} />
                              <AppText variant="label" color={theme.colors.primary}>
                                Livraison
                              </AppText>
                            </>
                          ) : null}
                        </View>
                      </View>
                      <ChevronRight size={20} color={theme.colors.outline} />
                    </Card>
                  </Pressable>
                );
              })}
            </View>
          )}
        </ScrollView>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 4 },
  list: { padding: 16, gap: 12 },
  loader: { marginTop: 32 },

  browse: { padding: 20, paddingBottom: 40 },
  sectionHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  catGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  catTile: {
    width: '47%',
    flexGrow: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
  },
  catIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  catLabel: { flex: 1, textAlign: 'left' },

  banner: {
    marginTop: 24,
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  bannerText: { flex: 1 },
  bannerSub: { opacity: 0.9, marginTop: 4 },
  bannerIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  sectionHeadSpaced: { marginTop: 24 },
  pharmaList: { gap: 12 },
  pharmaCard: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  pharmaThumb: {
    width: 60,
    height: 60,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  flex: { flex: 1 },
  pharmaTop: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  pharmaMeta: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 3 },
});
