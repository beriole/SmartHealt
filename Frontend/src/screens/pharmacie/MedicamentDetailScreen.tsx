import React from 'react';
import { View, Image, StyleSheet, ActivityIndicator } from 'react-native';
import { useRoute, RouteProp } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { AppText, Badge, Card, ErrorState, Screen } from '@/components';
import { useTheme } from '@/theme';
import { useMedicament } from '@/features/pharmacie/hooks';
import { resolveImageUrl } from '@/lib/media';
import { formatFCFA } from '@/lib/format';
import { PharmacieStackParamList } from '@/navigation/types';

export function MedicamentDetailScreen() {
  const theme = useTheme();
  const { t } = useTranslation();
  const route = useRoute<RouteProp<PharmacieStackParamList, 'MedicamentDetail'>>();
  const { data, isLoading, isError, refetch } = useMedicament(route.params.id);

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

  const image = resolveImageUrl(data.image_url);

  return (
    <Screen scroll>
      {image ? (
        <Image source={{ uri: image }} style={styles.image} resizeMode="cover" />
      ) : null}

      <View style={styles.header}>
        <AppText variant="h2">{data.nom_commercial}</AppText>
        <AppText color={theme.colors.textSecondary}>{data.dci}</AppText>
      </View>

      <View style={styles.badges}>
        <Badge label={data.dosage} />
        <Badge label={data.forme_galenique} tone="info" />
        {data.necessite_ordonnance ? (
          <Badge label={t('pharmacie.prescriptionRequired')} tone="warning" />
        ) : (
          <Badge label={t('pharmacie.otc')} tone="success" />
        )}
      </View>

      <Card style={styles.card}>
        <Row label={t('pharmacie.category')} value={data.categorie} />
        <Row
          label={t('pharmacie.generic')}
          value={data.est_generique ? t('common.yes') : t('common.no')}
        />
        {data.prix_indicatif_fcfa ? (
          <Row
            label={t('pharmacie.indicativePrice')}
            value={formatFCFA(data.prix_indicatif_fcfa)}
          />
        ) : null}
      </Card>

      <AppText variant="caption" color={theme.colors.textSecondary} center>
        {t('pharmacie.searchToBuy')}
      </AppText>
    </Screen>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  const theme = useTheme();
  return (
    <View style={styles.row}>
      <AppText color={theme.colors.textSecondary}>{label}</AppText>
      <AppText weight="medium">{value}</AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  loader: { marginTop: 32 },
  image: { width: '100%', height: 180, borderRadius: 16, marginBottom: 16 },
  header: { gap: 2, marginBottom: 12 },
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  card: { gap: 10, marginBottom: 16 },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
});
