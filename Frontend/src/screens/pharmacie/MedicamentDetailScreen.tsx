import React from 'react';
import { View, Image, StyleSheet, ActivityIndicator } from 'react-native';
import { Pill, Info } from 'lucide-react-native';
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
      ) : (
        <View style={[styles.image, styles.imageFallback, { backgroundColor: theme.colors.surfaceVariant }]}>
          <Pill size={48} color={theme.colors.primary} />
        </View>
      )}

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

      {data.necessite_ordonnance ? (
        <View
          style={[
            styles.notice,
            {
              backgroundColor: theme.colors.warning + '1A',
              borderRadius: theme.radius.md,
            },
          ]}
        >
          <Info size={18} color={theme.colors.warning} />
          <AppText variant="small" color={theme.colors.warning} style={styles.flex}>
            {t('pharmacie.prescriptionRequired')} — une ordonnance valide sera demandée à la commande.
          </AppText>
        </View>
      ) : null}

      <AppText variant="caption" color={theme.colors.textSecondary} center style={styles.hint}>
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
  imageFallback: { alignItems: 'center', justifyContent: 'center' },
  header: { gap: 2, marginBottom: 12 },
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  card: { gap: 10, marginBottom: 16 },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  notice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    marginBottom: 16,
  },
  flex: { flex: 1 },
  hint: { marginTop: 4 },
});
