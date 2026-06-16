import React, { useEffect, useMemo, useState } from 'react';
import { View, FlatList, StyleSheet, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import {
  Button,
  EmptyState,
  ErrorState,
  Screen,
  SearchBar,
  StockCard,
} from '@/components';
import { useTheme } from '@/theme';
import { useStockSearch } from '@/features/pharmacie/hooks';
import { useAddToCart } from '@/features/pharmacie/useAddToCart';
import { useCartStore } from '@/store/cartStore';
import { PharmacieStackParamList } from '@/navigation/types';

type Nav = NativeStackNavigationProp<PharmacieStackParamList, 'PharmacieHome'>;

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

  const cartIds = useCartStore(s => s.items);
  const inCartSet = useMemo(
    () => new Set(cartIds.map(l => l.id_stock)),
    [cartIds],
  );

  const hasQuery = debounced.trim().length >= 2;

  return (
    <Screen padded={false}>
      <View style={styles.header}>
        <SearchBar
          value={term}
          onChangeText={setTerm}
          placeholder={t('pharmacie.searchPlaceholder')}
        />
        <Button
          label={t('pharmacie.viewAllPharmacies')}
          variant="ghost"
          onPress={() => navigation.navigate('PharmacieList')}
        />
      </View>

      {!hasQuery ? (
        <EmptyState
          title={t('pharmacie.searchTitle')}
          description={t('pharmacie.searchHint')}
        />
      ) : isError ? (
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
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: 16, paddingTop: 12, gap: 4 },
  list: { padding: 16, gap: 12 },
  loader: { marginTop: 32 },
});
