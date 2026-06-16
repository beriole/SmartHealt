import React from 'react';
import { FlatList, Pressable, View, StyleSheet, ActivityIndicator } from 'react-native';
import { Star, Truck } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { AppText, Card, EmptyState, ErrorState, Screen } from '@/components';
import { useTheme } from '@/theme';
import { usePharmacies } from '@/features/pharmacie/hooks';
import { PharmacieStackParamList } from '@/navigation/types';

type Nav = NativeStackNavigationProp<PharmacieStackParamList, 'PharmacieList'>;

export function PharmacieListScreen() {
  const theme = useTheme();
  const { t } = useTranslation();
  const navigation = useNavigation<Nav>();
  const { data, isLoading, isError, refetch } = usePharmacies();

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
        keyExtractor={item => item.id_pharmacie}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <Pressable
            onPress={() =>
              navigation.navigate('PharmacieDetail', {
                id: item.id_pharmacie,
                nom: item.nom_pharmacie,
              })
            }
          >
            <Card style={styles.card}>
              <AppText weight="semibold">{item.nom_pharmacie}</AppText>
              <AppText variant="small" color={theme.colors.textSecondary} numberOfLines={1}>
                {item.adresse}
              </AppText>
              <View style={styles.meta}>
                <View style={styles.metaItem}>
                  <Star size={14} color={theme.colors.warning} />
                  <AppText variant="caption" color={theme.colors.textSecondary}>
                    {Number(item.note_moyenne).toFixed(1)}
                  </AppText>
                </View>
                {item.livraison_disponible ? (
                  <View style={styles.metaItem}>
                    <Truck size={14} color={theme.colors.success} />
                    <AppText variant="caption" color={theme.colors.success}>
                      {t('pharmacie.delivery')}
                    </AppText>
                  </View>
                ) : null}
              </View>
            </Card>
          </Pressable>
        )}
        ListEmptyComponent={<EmptyState title={t('pharmacie.noPharmacy')} />}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  loader: { marginTop: 32 },
  list: { padding: 16, gap: 12 },
  card: { gap: 4 },
  meta: { flexDirection: 'row', gap: 16, marginTop: 4 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
});
