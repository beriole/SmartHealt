import React from 'react';
import {
  FlatList,
  Pressable,
  View,
  Image,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { Star, Truck, MapPin, ChevronRight } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { AppText, Badge, Card, EmptyState, ErrorState, Screen } from '@/components';
import { useTheme } from '@/theme';
import { usePharmacies } from '@/features/pharmacie/hooks';
import { resolveImageUrl } from '@/lib/media';
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

  const list = data?.data ?? [];

  return (
    <Screen padded={false}>
      <View style={styles.header}>
        <AppText variant="h2">Pharmacies</AppText>
        <AppText color={theme.colors.textSecondary}>
          {list.length} résultat{list.length > 1 ? 's' : ''}
        </AppText>
      </View>

      <FlatList
        data={list}
        keyExtractor={item => item.id_pharmacie}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => {
          const uri = resolveImageUrl(item.image_url);
          const dispo = item.statut === 'active' || item.statut === 'ACTIVE';
          return (
            <Pressable
              onPress={() =>
                navigation.navigate('PharmacieDetail', {
                  id: item.id_pharmacie,
                  nom: item.nom_pharmacie,
                })
              }
            >
              <Card style={styles.card} padding="sm">
                {uri ? (
                  <Image source={{ uri }} style={styles.thumb} />
                ) : (
                  <View
                    style={[styles.thumb, { backgroundColor: theme.colors.surfaceVariant }]}
                  >
                    <MapPin size={24} color={theme.colors.primary} />
                  </View>
                )}
                <View style={styles.flex}>
                  <View style={styles.titleRow}>
                    <AppText weight="bold" numberOfLines={1} style={styles.flex}>
                      {item.nom_pharmacie}
                    </AppText>
                    <Badge
                      label={dispo ? 'Disponible' : 'Fermée'}
                      tone={dispo ? 'success' : 'danger'}
                    />
                  </View>
                  <View style={styles.metaRow}>
                    <MapPin size={13} color={theme.colors.outline} />
                    <AppText
                      variant="small"
                      color={theme.colors.outline}
                      numberOfLines={1}
                      style={styles.flex}
                    >
                      {item.adresse}
                    </AppText>
                  </View>
                  <View style={styles.metaRow}>
                    <Star size={13} color={theme.colors.warning} fill={theme.colors.warning} />
                    <AppText variant="label">
                      {Number(item.note_moyenne).toFixed(1)}
                    </AppText>
                    {item.livraison_disponible ? (
                      <>
                        <Truck size={13} color={theme.colors.primary} />
                        <AppText variant="label" color={theme.colors.primary}>
                          {t('pharmacie.delivery')}
                        </AppText>
                      </>
                    ) : null}
                  </View>
                </View>
                <ChevronRight size={20} color={theme.colors.outline} />
              </Card>
            </Pressable>
          );
        }}
        ListEmptyComponent={<EmptyState title={t('pharmacie.noPharmacy')} />}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  loader: { marginTop: 32 },
  header: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 8, gap: 2 },
  list: { paddingHorizontal: 16, paddingBottom: 24, gap: 12 },
  card: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  thumb: {
    width: 60,
    height: 60,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  flex: { flex: 1 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 3 },
});
